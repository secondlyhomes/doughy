// src/utils/debouncedFunctions.ts
// Manager for debounced functions with cancellation support

import { debounce, DebouncedFunc } from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

export class DebouncedFunctionsManager {
  private functions: Map<string, DebouncedFunc<AnyFunction>> = new Map();

  getDebounced<T extends AnyFunction>(
    key: string,
    fn: T,
    wait: number = 500
  ): DebouncedFunc<T> {
    if (!this.functions.has(key)) {
      this.functions.set(key, debounce(fn, wait));
    }
    return this.functions.get(key) as DebouncedFunc<T>;
  }

  clear(): void {
    this.functions.forEach(fn => {
      if (fn.cancel) {
        fn.cancel();
      }
    });
    this.functions.clear();
  }
}
