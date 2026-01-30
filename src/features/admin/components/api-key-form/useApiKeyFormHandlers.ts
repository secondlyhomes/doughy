// src/features/admin/components/api-key-form/useApiKeyFormHandlers.ts
// Custom hook for API key form event handlers

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useToast } from '@/components/ui/Toast';
import { validateApiKeyFormat } from '../../utils/serviceHelpers';
import { clearHealthCache, checkIntegrationHealth, testApiKeyWithoutSaving } from '../../services/apiKeyHealthService';
import { triggerHaptic } from './utils';
import type { UseApiKeyFormHandlersOptions, IntegrationHealth } from './types';

export function useApiKeyFormHandlers({
  service,
  label,
  inputValue,
  setInputValue,
  setShowValue,
  setIsEditing,
  setIsReplacing,
  setIsSaveLoading,
  setDeleteLoading,
  setHasWarning,
  setIsTesting,
  setTestResult,
  setKey,
  save,
  deleteKey,
  onSaved,
  ensureKeyLoaded,
  initializedRef,
}: UseApiKeyFormHandlersOptions) {
  const { toast } = useToast();

  // Handle save
  const handleSave = useCallback(async () => {
    if (!inputValue) {
      toast({ type: 'error', title: 'Missing Value', description: 'Please enter a value' });
      return;
    }

    setIsSaveLoading(true);

    // Force React to render the spinner before PBKDF2 blocks the thread
    await new Promise<void>(resolve => {
      const timeoutId = setTimeout(resolve, 100);
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            clearTimeout(timeoutId);
            resolve();
          });
        });
      } else {
        clearTimeout(timeoutId);
        resolve();
      }
    });

    const validation = validateApiKeyFormat(inputValue, service);

    if (validation.warning) {
      setHasWarning(true);
      toast({ type: 'warning', title: 'Warning', description: validation.warning, duration: 6000 });
    } else {
      setHasWarning(false);
    }

    if (!validation.isValid) {
      setIsSaveLoading(false);
      toast({ type: 'error', title: 'Invalid Key', description: validation.warning || 'Please enter a valid API key' });
      return;
    }

    try {
      toast({ type: 'info', title: 'Saving...', description: 'Encrypting and saving your API key' });

      const result = await save(inputValue);
      if (result.success) {
        triggerHaptic('success');
        toast({ type: 'success', title: 'Saved', description: `${label} configured` });
        setInputValue('');
        setShowValue(false);
        setIsEditing(false);

        clearHealthCache(service);
        setIsTesting(true);
        setTestResult(null);

        let healthResult: IntegrationHealth | undefined;
        try {
          healthResult = await checkIntegrationHealth(service, true);
          setTestResult(healthResult);

          if (healthResult.status === 'error') {
            toast({
              type: 'warning',
              title: 'Key Saved',
              description: `Saved but verification failed: ${healthResult.message}`,
              duration: 6000,
            });
          }
        } catch (healthError) {
          console.error('Health check after save failed:', healthError);
        } finally {
          setIsTesting(false);
        }

        onSaved?.(healthResult);
      } else {
        triggerHaptic('error');
        toast({ type: 'error', title: 'Save Failed', description: result.error || 'Please try again', duration: 6000 });
      }
    } catch (error) {
      triggerHaptic('error');
      console.error('Error saving API key:', error);
      toast({ type: 'error', title: 'Error', description: 'An unexpected error occurred', duration: 6000 });
    } finally {
      setIsSaveLoading(false);
    }
  }, [inputValue, service, label, save, toast, onSaved, setIsSaveLoading, setHasWarning, setInputValue, setShowValue, setIsEditing, setIsTesting, setTestResult]);

  // Handle delete
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete API Key',
      `Are you sure you want to delete ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(true);
              const result = await deleteKey();

              if (result.success) {
                triggerHaptic('success');
                setKey('');
                setIsEditing(true);
                setHasWarning(false);
                initializedRef.current = true;
                setTestResult(null);
                clearHealthCache(service);
                toast({ type: 'success', title: 'Deleted', description: `${label} has been removed` });
                onSaved?.({
                  name: label,
                  service,
                  status: 'not-configured',
                  lastChecked: new Date(),
                });
              } else {
                triggerHaptic('error');
                toast({ type: 'error', title: 'Delete Failed', description: result.error || 'Please try again', duration: 6000 });
              }
            } catch (error) {
              triggerHaptic('error');
              console.error('Error deleting API key:', error);
              toast({ type: 'error', title: 'Error', description: 'Failed to delete the API key', duration: 6000 });
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  }, [label, service, deleteKey, setKey, toast, onSaved, setDeleteLoading, setIsEditing, setHasWarning, setTestResult, initializedRef]);

  // Handle test connection
  const handleTest = useCallback(async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      await ensureKeyLoaded();
      clearHealthCache(service);
      const result = await checkIntegrationHealth(service, true);
      setTestResult(result);

      if (result.status === 'operational') {
        triggerHaptic('success');
        toast({
          type: 'success',
          title: 'Connection Successful',
          description: result.latency ? `Response time: ${result.latency}` : 'API is reachable',
        });
      } else if (result.status === 'error') {
        triggerHaptic('error');
        toast({
          type: 'error',
          title: 'Connection Failed',
          description: result.message || 'Could not connect to the API',
          duration: 6000,
        });
      }

      onSaved?.(result);
    } catch (error) {
      triggerHaptic('error');
      console.error('Error testing connection:', error);
      toast({
        type: 'error',
        title: 'Test Failed',
        description: 'Could not test the connection',
        duration: 6000,
      });
    } finally {
      setIsTesting(false);
    }
  }, [service, toast, onSaved, ensureKeyLoaded, setIsTesting, setTestResult]);

  // Handle replace - test new key BEFORE saving
  const handleReplace = useCallback(async () => {
    if (!inputValue) {
      toast({ type: 'error', title: 'Missing Value', description: 'Please enter a new key' });
      return;
    }

    const validation = validateApiKeyFormat(inputValue, service);
    if (!validation.isValid) {
      toast({ type: 'error', title: 'Invalid Key', description: validation.warning || 'Please enter a valid API key' });
      return;
    }

    try {
      setIsTesting(true);
      await ensureKeyLoaded();
      toast({ type: 'info', title: 'Testing...', description: 'Verifying new key before replacing' });

      const testResultData = await testApiKeyWithoutSaving(service, inputValue);

      if (testResultData.status === 'error') {
        triggerHaptic('error');
        toast({
          type: 'error',
          title: 'Test Failed',
          description: testResultData.message || 'The new key could not be verified. Your existing key has been preserved.',
          duration: 8000,
        });
        setTestResult(testResultData);
        return;
      }

      const saveResult = await save(inputValue);
      if (!saveResult.success) {
        toast({ type: 'error', title: 'Save Failed', description: saveResult.error || 'Could not save the new key', duration: 6000 });
        return;
      }

      clearHealthCache(service);

      triggerHaptic('success');
      toast({
        type: 'success',
        title: 'Key Replaced',
        description: `${label} updated successfully`,
      });
      setInputValue('');
      setShowValue(false);
      setIsReplacing(false);
      setTestResult(testResultData);
      onSaved?.(testResultData);
    } catch (error) {
      triggerHaptic('error');
      console.error('Error replacing key:', error);
      toast({
        type: 'error',
        title: 'Replace Failed',
        description: 'Could not replace the key',
        duration: 6000,
      });
    } finally {
      setIsTesting(false);
    }
  }, [inputValue, service, label, save, toast, onSaved, ensureKeyLoaded, setIsTesting, setTestResult, setInputValue, setShowValue, setIsReplacing]);

  // Cancel replace mode
  const handleCancelReplace = useCallback(() => {
    setIsReplacing(false);
    setInputValue('');
    setShowValue(false);
  }, [setIsReplacing, setInputValue, setShowValue]);

  return {
    handleSave,
    handleDelete,
    handleTest,
    handleReplace,
    handleCancelReplace,
  };
}
