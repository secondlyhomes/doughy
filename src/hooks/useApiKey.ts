// src/hooks/useApiKey.ts
// React hook for API key CRUD operations with encryption
// Ported from legacy web app and adapted for React Native

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { encrypt, decrypt } from '@/lib/cryptoNative';
import type { ApiKeySaveResult } from '@/features/admin/types/integrations';
import { normalizeServiceName, getGroupForService } from '@/features/admin/utils/serviceHelpers';

/**
 * Hook for managing API keys with encryption
 *
 * @param service - Service identifier (e.g., 'openai', 'stripe', 'google-maps')
 * @returns API key state and CRUD operations
 */
export function useApiKey(service: string) {
  const [key, setKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Track which services have attempted upgrade to prevent duplicate attempts
  const upgradeAttemptedRef = useRef(new Set<string>());

  // Fetch API key on mount
  useEffect(() => {
    let isMounted = true;
    let upgradeTimeoutId: NodeJS.Timeout | null = null;

    const fetchKey = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('User not authenticated when fetching API key');
          if (isMounted) setLoading(false);
          return;
        }

        // Normalize service name
        const normalizedService = normalizeServiceName(service);

        // Query for API key
        const { data, error: fetchError } = await supabase
          .from('api_keys')
          .select('key_ciphertext, service')
          .eq('service', normalizedService)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching API key:', fetchError);
          setError(fetchError.message);
          if (isMounted) setLoading(false);
          return;
        }

        if (data && data.key_ciphertext && isMounted) {
          try {
            // Decrypt the key
            const decrypted = await decrypt(data.key_ciphertext);

            if (decrypted) {
              setKey(decrypted);

              // Auto-upgrade legacy DEV. format keys
              if (data.key_ciphertext.startsWith('DEV.') && !upgradeAttemptedRef.current.has(normalizedService)) {
                console.info('Upgrading legacy key for service:', service);
                upgradeAttemptedRef.current.add(normalizedService);

                // Re-save with new format (delayed to avoid blocking initial load)
                // Note: save() is intentionally not in useEffect deps to avoid infinite loop
                // The upgrade is a one-time operation tracked by upgradeAttemptedRef
                upgradeTimeoutId = setTimeout(() => {
                  if (isMounted) {
                    save(decrypted).catch(err => {
                      console.error('Failed to upgrade legacy key:', err);
                      // Remove from attempted set so it can be retried later
                      upgradeAttemptedRef.current.delete(normalizedService);
                    });
                  }
                }, 500);
              }
            }
          } catch (decryptErr) {
            console.error('Error decrypting API key:', decryptErr);
            setError('Failed to decrypt the API key');
          }
        }
      } catch (err) {
        console.error('Error in useApiKey:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchKey();

    return () => {
      isMounted = false;
      // Clean up upgrade timeout to prevent memory leaks
      if (upgradeTimeoutId) {
        clearTimeout(upgradeTimeoutId);
      }
    };
  }, [service]);

  /**
   * Save an API key (encrypt and store in database)
   */
  const save = useCallback(async (plaintext: string): Promise<ApiKeySaveResult> => {
    try {
      setIsSaving(true);

      // Encrypt the key
      const ciphertext = await encrypt(plaintext);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Normalize service name
      const normalizedService = normalizeServiceName(service);

      // Check if key already exists
      const { data: existingKey } = await supabase
        .from('api_keys')
        .select('*')
        .eq('service', normalizedService)
        .maybeSingle();

      let result;

      if (existingKey) {
        // Update existing key
        result = await supabase
          .from('api_keys')
          .update({
            key_ciphertext: ciphertext,
            encrypted: true,
            updated_at: new Date().toISOString(),
          })
          .eq('service', normalizedService);
      } else {
        // Insert new key
        result = await supabase
          .from('api_keys')
          .insert({
            service: normalizedService,
            key_ciphertext: ciphertext,
            encrypted: true,
            user_id: user.id,
            group_name: getGroupForService(normalizedService),
            updated_at: new Date().toISOString(),
          });
      }

      if (result.error) {
        console.error('Error saving API key:', result.error);
        return {
          success: false,
          error: `Failed to save API key: ${result.error.message}`,
        };
      }

      // Update local state
      setKey(plaintext);
      return { success: true };
    } catch (err) {
      console.error('Error in save API key:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save API key';
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSaving(false);
    }
  }, [service]);

  /**
   * Delete an API key from database
   */
  const deleteKey = useCallback(async (): Promise<ApiKeySaveResult> => {
    try {
      const normalizedService = normalizeServiceName(service);

      const { error: deleteError } = await supabase
        .from('api_keys')
        .delete()
        .eq('service', normalizedService);

      if (deleteError) {
        console.error('Error deleting API key:', deleteError);
        return {
          success: false,
          error: `Failed to delete API key: ${deleteError.message}`,
        };
      }

      // Clear local state
      setKey('');
      return { success: true };
    } catch (err) {
      console.error('Error in delete API key:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete API key',
      };
    }
  }, [service]);

  return {
    key,
    setKey,
    save,
    deleteKey,
    loading,
    error,
    isSaving,
  };
}
