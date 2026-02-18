# Pattern: Creating a New Feature

## Step-by-Step Guide

Follow these steps when implementing a new feature.

### Step 1: Create Type Definitions

```typescript
// src/types/myFeature.ts

export type MyFeatureStatus = 'idle' | 'loading' | 'success' | 'error';

export interface MyFeatureItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyFeatureState {
  items: MyFeatureItem[];
  status: MyFeatureStatus;
  error: string | null;
}

export interface CreateMyFeatureInput {
  name: string;
}
```

### Step 2: Export from Types Index

```typescript
// src/types/index.ts - add these lines:
export type {
  MyFeatureItem,
  MyFeatureState,
  MyFeatureStatus,
  CreateMyFeatureInput,
} from './myFeature';
```

### Step 3: Create Service

```typescript
// src/services/myFeature.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyFeatureItem, CreateMyFeatureInput } from '@/types';

const STORAGE_KEY = '@myFeature';

export async function getItems(): Promise<MyFeatureItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get items:', error);
    return [];
  }
}

export async function createItem(
  input: CreateMyFeatureInput
): Promise<MyFeatureItem> {
  const items = await getItems();

  const newItem: MyFeatureItem = {
    id: crypto.randomUUID(),
    name: input.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  items.push(newItem);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  return newItem;
}

export async function updateItem(
  id: string,
  updates: Partial<CreateMyFeatureInput>
): Promise<MyFeatureItem | null> {
  const items = await getItems();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return items[index];
}

export async function deleteItem(id: string): Promise<boolean> {
  const items = await getItems();
  const filtered = items.filter((item) => item.id !== id);

  if (filtered.length === items.length) return false;

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}
```

### Step 4: Create Hook

```typescript
// src/hooks/useMyFeature.ts

import { useState, useCallback, useEffect } from 'react';
import { MyFeatureItem, MyFeatureState, CreateMyFeatureInput } from '@/types';
import * as myFeatureService from '@/services/myFeature';

export function useMyFeature() {
  const [state, setState] = useState<MyFeatureState>({
    items: [],
    status: 'idle',
    error: null,
  });

  const loadItems = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const items = await myFeatureService.getItems();
      setState({ items, status: 'success', error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to load',
      }));
    }
  }, []);

  const createItem = useCallback(async (input: CreateMyFeatureInput) => {
    const newItem = await myFeatureService.createItem(input);
    setState((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    return newItem;
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const success = await myFeatureService.deleteItem(id);
    if (success) {
      setState((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
      }));
    }
    return success;
  }, []);

  // Load on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    ...state,
    loadItems,
    createItem,
    deleteItem,
  };
}
```

### Step 5: Export Hook from Index

```typescript
// src/hooks/index.ts - add:
export { useMyFeature } from './useMyFeature';
```

### Step 6: Create Test

```typescript
// src/__tests__/services/myFeature.test.ts

import { getItems, createItem, deleteItem } from '@/services/myFeature';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('myFeature service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getItems', () => {
    it('returns empty array when no data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const items = await getItems();
      expect(items).toEqual([]);
    });

    it('returns parsed items', async () => {
      const mockItems = [{ id: '1', name: 'Test' }];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockItems)
      );

      const items = await getItems();
      expect(items).toEqual(mockItems);
    });
  });

  describe('createItem', () => {
    it('creates item with generated id', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const item = await createItem({ name: 'New Item' });

      expect(item.id).toBeDefined();
      expect(item.name).toBe('New Item');
      expect(item.createdAt).toBeDefined();
    });
  });

  describe('deleteItem', () => {
    it('returns true when item deleted', async () => {
      const mockItems = [{ id: '1', name: 'Test' }];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockItems)
      );

      const result = await deleteItem('1');
      expect(result).toBe(true);
    });

    it('returns false when item not found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');

      const result = await deleteItem('nonexistent');
      expect(result).toBe(false);
    });
  });
});
```

### Step 7: Use in Component

```typescript
// src/screens/MyFeatureScreen.tsx

import { View, FlatList, Text, Button } from 'react-native';
import { useMyFeature } from '@/hooks';

export function MyFeatureScreen() {
  const { items, status, createItem, deleteItem } = useMyFeature();

  if (status === 'loading') {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      <Button
        title="Add Item"
        onPress={() => createItem({ name: 'New Item' })}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name}</Text>
            <Button
              title="Delete"
              onPress={() => deleteItem(item.id)}
            />
          </View>
        )}
      />
    </View>
  );
}
```

## Checklist

- [ ] Types defined and exported from index
- [ ] Service created with async functions
- [ ] Hook wraps service with state management
- [ ] Hook exported from index
- [ ] Tests written for service
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Tests pass (`npm test`)
