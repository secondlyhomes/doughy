// src/hooks/useFieldRef.ts
// Field ref registry for scroll-to-error functionality

import { useRef, useCallback, RefObject } from 'react';
import { ScrollView, View, LayoutChangeEvent, TextInput } from 'react-native';

/**
 * Field layout information
 */
interface FieldLayout {
  /** Y position relative to scroll view content */
  y: number;
  /** Height of the field */
  height: number;
}

/**
 * Field ref registry type
 */
type FieldRegistry<T extends string> = Record<T, FieldLayout | undefined>;

/**
 * Options for useFieldRef hook
 */
export interface UseFieldRefOptions {
  /** Scroll offset from top when scrolling to field (default: 20) */
  scrollOffset?: number;
  /** Animation enabled for scrolling (default: true) */
  animated?: boolean;
}

/**
 * Return type for useFieldRef hook
 */
export interface UseFieldRefReturn<T extends string> {
  /** Ref to attach to ScrollView */
  scrollViewRef: RefObject<ScrollView | null>;
  /** Create onLayout handler for a field */
  createLayoutHandler: (fieldName: T) => (event: LayoutChangeEvent) => void;
  /** Scroll to a specific field */
  scrollToField: (fieldName: T) => void;
  /** Get layout info for a field */
  getFieldLayout: (fieldName: T) => FieldLayout | undefined;
  /** Focus a field's TextInput (if registered) */
  focusField: (fieldName: T) => void;
  /** Register a TextInput ref for a field */
  registerInputRef: (fieldName: T, ref: TextInput | null) => void;
}

/**
 * Hook for managing field refs and scroll-to-error functionality
 *
 * @example
 * ```tsx
 * const fieldRefs = useFieldRef<'email' | 'name'>();
 *
 * const form = useFormValidation({
 *   // ... config
 *   onScrollToError: (fieldName) => fieldRefs.scrollToField(fieldName),
 * });
 *
 * return (
 *   <ScrollView ref={fieldRefs.scrollViewRef}>
 *     <View onLayout={fieldRefs.createLayoutHandler('email')}>
 *       <FormField
 *         ref={(ref) => fieldRefs.registerInputRef('email', ref)}
 *         value={form.values.email}
 *         error={form.getFieldError('email')}
 *       />
 *     </View>
 *   </ScrollView>
 * );
 * ```
 */
export function useFieldRef<T extends string>(
  options: UseFieldRefOptions = {}
): UseFieldRefReturn<T> {
  const { scrollOffset = 20, animated = true } = options;

  // ScrollView ref
  const scrollViewRef = useRef<ScrollView>(null);

  // Field layout registry
  const fieldLayoutsRef = useRef<FieldRegistry<T>>({} as FieldRegistry<T>);

  // TextInput refs for focusing
  const inputRefsRef = useRef<Record<T, TextInput | null>>({} as Record<T, TextInput | null>);

  /**
   * Create onLayout handler for a field
   */
  const createLayoutHandler = useCallback(
    (fieldName: T) => (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      fieldLayoutsRef.current[fieldName] = { y, height };
    },
    []
  );

  /**
   * Scroll to a specific field
   */
  const scrollToField = useCallback(
    (fieldName: T) => {
      const layout = fieldLayoutsRef.current[fieldName];
      const scrollView = scrollViewRef.current;

      if (layout && scrollView) {
        // Calculate scroll position with offset
        const scrollY = Math.max(0, layout.y - scrollOffset);

        scrollView.scrollTo({
          y: scrollY,
          animated,
        });

        // Focus the input after scrolling
        setTimeout(() => {
          const inputRef = inputRefsRef.current[fieldName];
          if (inputRef && typeof inputRef.focus === 'function') {
            inputRef.focus();
          }
        }, animated ? 300 : 0);
      }
    },
    [scrollOffset, animated]
  );

  /**
   * Get layout info for a field
   */
  const getFieldLayout = useCallback(
    (fieldName: T): FieldLayout | undefined => {
      return fieldLayoutsRef.current[fieldName];
    },
    []
  );

  /**
   * Focus a field's TextInput
   */
  const focusField = useCallback((fieldName: T) => {
    const inputRef = inputRefsRef.current[fieldName];
    if (inputRef && typeof inputRef.focus === 'function') {
      inputRef.focus();
    }
  }, []);

  /**
   * Register a TextInput ref for a field
   */
  const registerInputRef = useCallback((fieldName: T, ref: TextInput | null) => {
    inputRefsRef.current[fieldName] = ref;
  }, []);

  return {
    scrollViewRef,
    createLayoutHandler,
    scrollToField,
    getFieldLayout,
    focusField,
    registerInputRef,
  };
}

export default useFieldRef;
