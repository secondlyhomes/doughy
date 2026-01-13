// src/lib/mockData/queryBuilder.ts
// Mock implementation of Supabase's query builder API

import {
  simulateNetworkDelay,
  logMockOperation,
} from '@/config/devMode';

// UUID generator for React Native (crypto.randomUUID not available)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type FilterFn<T> = (item: T) => boolean;

interface QueryResult<T> {
  data: T[] | T | null;
  error: Error | null;
  count?: number;
}

/**
 * Mock query builder that mimics Supabase's fluent API
 */
export class MockQueryBuilder<T extends Record<string, unknown>> {
  private filters: FilterFn<T>[] = [];
  private ordering: { column: keyof T; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private offsetCount: number = 0;
  private selectColumns: string = '*';
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' =
    'select';
  private insertData: Partial<T>[] = [];
  private updateData: Partial<T> = {};

  constructor(
    private tableName: string,
    private store: MockDataStore
  ) {}

  // Query methods
  select(columns: string = '*') {
    this.selectColumns = columns;
    this.operation = 'select';
    return this;
  }

  insert(data: Partial<T> | Partial<T>[]) {
    this.operation = 'insert';
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data: Partial<T>) {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  upsert(data: Partial<T> | Partial<T>[]) {
    this.operation = 'upsert';
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  // Filter methods
  eq<K extends keyof T>(column: K, value: T[K]) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  neq<K extends keyof T>(column: K, value: T[K]) {
    this.filters.push((item) => item[column] !== value);
    return this;
  }

  gt<K extends keyof T>(column: K, value: T[K]) {
    this.filters.push((item) => (item[column] as number) > (value as number));
    return this;
  }

  gte<K extends keyof T>(column: K, value: T[K]) {
    this.filters.push((item) => (item[column] as number) >= (value as number));
    return this;
  }

  lt<K extends keyof T>(column: K, value: T[K]) {
    this.filters.push((item) => (item[column] as number) < (value as number));
    return this;
  }

  lte<K extends keyof T>(column: K, value: T[K]) {
    this.filters.push((item) => (item[column] as number) <= (value as number));
    return this;
  }

  like<K extends keyof T>(column: K, pattern: string) {
    const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
    this.filters.push((item) => regex.test(String(item[column])));
    return this;
  }

  ilike<K extends keyof T>(column: K, pattern: string) {
    return this.like(column, pattern);
  }

  is<K extends keyof T>(column: K, value: null | boolean) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  in<K extends keyof T>(column: K, values: T[K][]) {
    this.filters.push((item) => values.includes(item[column] as T[K]));
    return this;
  }

  contains<K extends keyof T>(column: K, value: unknown) {
    this.filters.push((item) => {
      const arr = item[column] as unknown[];
      return Array.isArray(arr) && arr.includes(value);
    });
    return this;
  }

  containedBy<K extends keyof T>(column: K, values: unknown[]) {
    this.filters.push((item) => {
      const arr = item[column] as unknown[];
      return Array.isArray(arr) && arr.every((v) => values.includes(v));
    });
    return this;
  }

  or(filters: string) {
    // Simple OR support - parse basic conditions
    // Example: "status.eq.active,status.eq.new"
    const conditions = filters.split(',');
    this.filters.push((item) => {
      return conditions.some((condition) => {
        const [col, op, val] = condition.split('.');
        if (op === 'eq') return item[col] === val;
        if (op === 'neq') return item[col] !== val;
        return false;
      });
    });
    return this;
  }

  // Ordering
  order(column: keyof T, options?: { ascending?: boolean }) {
    this.ordering = {
      column,
      ascending: options?.ascending ?? true,
    };
    return this;
  }

  // Pagination
  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  // Execution methods
  async single(): Promise<QueryResult<T>> {
    const result = await this.execute();
    if (Array.isArray(result.data) && result.data.length > 0) {
      return { data: result.data[0], error: null };
    }
    return { data: null, error: null };
  }

  async maybeSingle(): Promise<QueryResult<T>> {
    return this.single();
  }

  // Main execution - this is what gets called by then()
  async execute(): Promise<QueryResult<T[]>> {
    await simulateNetworkDelay();

    logMockOperation(`${this.operation.toUpperCase()} ${this.tableName}`, {
      filters: this.filters.length,
      limit: this.limitCount,
    });

    try {
      switch (this.operation) {
        case 'select':
          return this.executeSelect();
        case 'insert':
          return this.executeInsert();
        case 'update':
          return this.executeUpdate();
        case 'delete':
          return this.executeDelete();
        case 'upsert':
          return this.executeUpsert();
        default:
          return { data: [], error: null };
      }
    } catch (error) {
      return { data: [], error: error as Error };
    }
  }

  private executeSelect(): QueryResult<T[]> {
    let data = this.store.getAll<T>(this.tableName);

    // Apply filters
    data = data.filter((item) => this.filters.every((f) => f(item)));

    // Apply ordering
    if (this.ordering) {
      const { column, ascending } = this.ordering;
      data.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        const comparison = aVal < bVal ? -1 : 1;
        return ascending ? comparison : -comparison;
      });
    }

    const count = data.length;

    // Apply pagination
    if (this.offsetCount > 0) {
      data = data.slice(this.offsetCount);
    }
    if (this.limitCount !== null) {
      data = data.slice(0, this.limitCount);
    }

    return { data, error: null, count };
  }

  private executeInsert(): QueryResult<T[]> {
    const inserted: T[] = [];

    for (const item of this.insertData) {
      const newItem = {
        id: generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item,
      } as T;
      this.store.insert(this.tableName, newItem);
      inserted.push(newItem);
    }

    return { data: inserted, error: null };
  }

  private executeUpdate(): QueryResult<T[]> {
    let data = this.store.getAll<T>(this.tableName);
    data = data.filter((item) => this.filters.every((f) => f(item)));

    const updated: T[] = [];
    for (const item of data) {
      const updatedItem = {
        ...item,
        ...this.updateData,
        updated_at: new Date().toISOString(),
      } as T;
      this.store.update(this.tableName, (item as { id: string }).id, updatedItem);
      updated.push(updatedItem);
    }

    return { data: updated, error: null };
  }

  private executeDelete(): QueryResult<T[]> {
    let data = this.store.getAll<T>(this.tableName);
    data = data.filter((item) => this.filters.every((f) => f(item)));

    const deleted: T[] = [];
    for (const item of data) {
      this.store.delete(this.tableName, (item as { id: string }).id);
      deleted.push(item);
    }

    return { data: deleted, error: null };
  }

  private executeUpsert(): QueryResult<T[]> {
    const upserted: T[] = [];

    for (const item of this.insertData) {
      const existing = this.store
        .getAll<T>(this.tableName)
        .find((i) => (i as { id: string }).id === (item as { id: string }).id);

      if (existing) {
        const updated = {
          ...existing,
          ...item,
          updated_at: new Date().toISOString(),
        } as T;
        this.store.update(this.tableName, (item as { id: string }).id, updated);
        upserted.push(updated);
      } else {
        const newItem = {
          id: generateUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item,
        } as T;
        this.store.insert(this.tableName, newItem);
        upserted.push(newItem);
      }
    }

    return { data: upserted, error: null };
  }

  // Make it thenable for await support
  then<TResult1 = QueryResult<T[]>, TResult2 = never>(
    onfulfilled?: (value: QueryResult<T[]>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

/**
 * In-memory data store
 */
export class MockDataStore {
  private tables: Map<string, Map<string, Record<string, unknown>>> = new Map();

  getTable<T>(name: string): Map<string, T> {
    if (!this.tables.has(name)) {
      this.tables.set(name, new Map());
    }
    return this.tables.get(name) as Map<string, T>;
  }

  getAll<T>(tableName: string): T[] {
    const table = this.getTable<T>(tableName);
    return Array.from(table.values());
  }

  get<T>(tableName: string, id: string): T | undefined {
    return this.getTable<T>(tableName).get(id);
  }

  insert<T extends Record<string, unknown>>(tableName: string, item: T): void {
    const table = this.getTable<T>(tableName);
    const id = (item as { id: string }).id || generateUUID();
    table.set(id, { ...item, id });
  }

  update<T extends Record<string, unknown>>(
    tableName: string,
    id: string,
    item: T
  ): void {
    const table = this.getTable<T>(tableName);
    if (table.has(id)) {
      table.set(id, item);
    }
  }

  delete(tableName: string, id: string): void {
    this.getTable(tableName).delete(id);
  }

  clear(tableName?: string): void {
    if (tableName) {
      this.tables.delete(tableName);
    } else {
      this.tables.clear();
    }
  }

  getQueryBuilder<T extends Record<string, unknown>>(
    tableName: string
  ): MockQueryBuilder<T> {
    return new MockQueryBuilder<T>(tableName, this);
  }
}
