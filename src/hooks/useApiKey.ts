// src/hooks/useApiKey.ts
// React hook for API key CRUD operations with encryption
// Ported from legacy web app and adapted for React Native

import { useEffect, useState, useCallback, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { supabase } from '@/lib/supabase';
import { encrypt, decrypt } from '@/lib/cryptoNative';
import type { ApiKeySaveResult } from '@/features/admin/types/integrations';
import { normalizeServiceName, getGroupForService } from '@/features/admin/utils/serviceHelpers';

interface UseApiKeyOptions {
  /**
   * When true, delays fetching the key until `loadKey()` is called manually.
   * This improves performance when many ApiKeyFormItem components mount at once.
   * @default false
   */
  deferLoad?: boolean;
}

/**
 * Hook for managing API keys with encryption
 *
 * @param service - Service identifier (e.g., 'openai', 'stripe', 'google-maps')
 * @param options - Hook options including deferLoad for delayed fetching
 * @returns API key state and CRUD operations
 */
export function useApiKey(service: string, options: UseApiKeyOptions = {}) {
  const { deferLoad = false } = options;

  const [key, setKey] = useState<string>('');
  const [keyExistsInDB, setKeyExistsInDB] = useState(false);
  const [loading, setLoading] = useState(!deferLoad); // Start as not loading if deferred
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Track which services have attempted upgrade to prevent duplicate attempts
  const upgradeAttemptedRef = useRef(new Set<string>());
  const isMountedRef = useRef(true);
  // Ref to hold save function for use in fetchKey (avoids circular dependency)
  const saveRef = useRef<(plaintext: string) => Promise<ApiKeySaveResult>>();

  /**
   * Save an API key (encrypt and store in database)
   */
  const save = useCallback(async (plaintext: string): Promise<ApiKeySaveResult> => {
    try {
      setIsSaving(true);

      // Wait for animations to complete before the blocking PBKDF2 operation
      // This prevents UI jank on slower devices where encryption can take 1-2 seconds
      await new Promise(resolve => InteractionManager.runAfterInteractions(resolve));

      // Encrypt the key (note: PBKDF2 blocks the main thread)
      const ciphertext = await encrypt(plaintext);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Normalize service name
      const normalizedService = normalizeServiceName(service);

      // Use upsert to avoid race condition between check and write
      // The unique constraint on (user_id, service) ensures atomicity
      const result = await supabase
        .from('security_api_keys')
        .upsert(
          {
            service: normalizedService,
            key_ciphertext: ciphertext,
            encrypted: true,
            user_id: user.id,
            group_name: getGroupForService(normalizedService),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,service' }
        );

      if (result.error) {
        console.error('Error saving API key:', result.error);
        return {
          success: false,
          error: `Failed to save API key: ${result.error.message}`,
        };
      }

      // Update local state
      setKey(plaintext);
      setKeyExistsInDB(true);
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

  // Keep saveRef updated with the current save function
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Fetch key function - can be called manually or on mount
  const fetchKey = useCallback(async () => {
    if (hasLoaded) return; // Already loaded

    let upgradeTimeoutId: NodeJS.Timeout | null = null;

    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('User not authenticated when fetching API key');
        if (isMountedRef.current) setLoading(false);
        return;
      }

      // Normalize service name
      const normalizedService = normalizeServiceName(service);

      // Query for API key
      const { data, error: fetchError } = await supabase
        .from('security_api_keys')
        .select('key_ciphertext, service')
        .eq('service', normalizedService)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching API key:', fetchError);
        setError(fetchError.message);
        if (isMountedRef.current) setLoading(false);
        return;
      }

      if (data && data.key_ciphertext && isMountedRef.current) {
        // Key exists in DB (even if we can't decrypt it)
        setKeyExistsInDB(true);

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
              upgradeTimeoutId = setTimeout(() => {
                if (isMountedRef.current && saveRef.current) {
                  saveRef.current(decrypted).catch(err => {
                    console.error('Failed to upgrade legacy key:', err);
                    upgradeAttemptedRef.current.delete(normalizedService);
                  });
                }
              }, 500);
            }
          }
        } catch (decryptErr) {
          console.error('Error decrypting API key:', decryptErr);
          setError('Failed to decrypt the API key. You can delete it and re-enter.');
        }
      }
    } catch (err) {
      console.error('Error in useApiKey:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setHasLoaded(true);
      }
    }

    return () => {
      if (upgradeTimeoutId) {
        clearTimeout(upgradeTimeoutId);
      }
    };
  }, [service, hasLoaded]);

  // Fetch API key on mount (unless deferred)
  useEffect(() => {
    isMountedRef.current = true;

    if (!deferLoad) {
      fetchKey();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [deferLoad, fetchKey]);

  /**
   * Delete an API key from database
   */
  const deleteKey = useCallback(async (): Promise<ApiKeySaveResult> => {
    try {
      const normalizedService = normalizeServiceName(service);

      const { error: deleteError } = await supabase
        .from('security_api_keys')
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
      setKeyExistsInDB(false);
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
    keyExistsInDB,
    setKey,
    save,
    deleteKey,
    loading,
    error,
    isSaving,
    /** Call to load the key when using deferLoad option */
    loadKey: fetchKey,
    /** Whether the key has been loaded at least once */
    hasLoaded,
  };
}
