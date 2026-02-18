/**
 * Data Transformation Utilities
 *
 * Transform data between AsyncStorage format and Supabase format.
 */

// Local task format (AsyncStorage)
export interface LocalTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Supabase task format (database row)
export interface SupabaseTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Transform local task to Supabase format
export function transformTaskToSupabase(
  localTask: LocalTask,
  userId: string
): SupabaseTask {
  return {
    id: localTask.id,
    user_id: userId,
    title: localTask.title,
    description: localTask.description || null,
    completed: localTask.completed,
    created_at: localTask.createdAt,
    updated_at: localTask.updatedAt,
  };
}

// Transform Supabase task to local format
export function transformTaskToLocal(supabaseTask: SupabaseTask): LocalTask {
  return {
    id: supabaseTask.id,
    title: supabaseTask.title,
    description: supabaseTask.description || '',
    completed: supabaseTask.completed,
    createdAt: supabaseTask.created_at,
    updatedAt: supabaseTask.updated_at,
  };
}

// Validate task data
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateLocalTask(task: unknown): ValidationResult {
  const errors: string[] = [];

  if (!task || typeof task !== 'object') {
    return { valid: false, errors: ['Task must be an object'] };
  }

  const t = task as Record<string, unknown>;

  // Required fields
  if (!t.id || typeof t.id !== 'string') {
    errors.push('id must be a string');
  }

  if (!t.title || typeof t.title !== 'string') {
    errors.push('title must be a string');
  }

  if (typeof t.completed !== 'boolean') {
    errors.push('completed must be a boolean');
  }

  if (!t.createdAt || typeof t.createdAt !== 'string') {
    errors.push('createdAt must be an ISO string');
  } else if (!isValidISODate(t.createdAt)) {
    errors.push('createdAt must be a valid ISO date');
  }

  if (!t.updatedAt || typeof t.updatedAt !== 'string') {
    errors.push('updatedAt must be an ISO string');
  } else if (!isValidISODate(t.updatedAt)) {
    errors.push('updatedAt must be a valid ISO date');
  }

  // Optional fields
  if (t.description !== undefined && typeof t.description !== 'string') {
    errors.push('description must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSupabaseTask(task: unknown): ValidationResult {
  const errors: string[] = [];

  if (!task || typeof task !== 'object') {
    return { valid: false, errors: ['Task must be an object'] };
  }

  const t = task as Record<string, unknown>;

  // Required fields
  if (!t.id || typeof t.id !== 'string') {
    errors.push('id must be a string');
  }

  if (!t.user_id || typeof t.user_id !== 'string') {
    errors.push('user_id must be a string');
  }

  if (!t.title || typeof t.title !== 'string') {
    errors.push('title must be a string');
  }

  if (typeof t.completed !== 'boolean') {
    errors.push('completed must be a boolean');
  }

  if (!t.created_at || typeof t.created_at !== 'string') {
    errors.push('created_at must be an ISO string');
  }

  if (!t.updated_at || typeof t.updated_at !== 'string') {
    errors.push('updated_at must be an ISO string');
  }

  // Optional fields
  if (t.description !== null && t.description !== undefined && typeof t.description !== 'string') {
    errors.push('description must be a string or null');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Sanitize data
export function sanitizeTask(task: LocalTask): LocalTask {
  return {
    id: task.id.trim(),
    title: task.title.trim(),
    description: task.description?.trim() || '',
    completed: !!task.completed,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

// Deduplicate tasks
export function deduplicateTasks(tasks: LocalTask[]): LocalTask[] {
  const seen = new Set<string>();
  const unique: LocalTask[] = [];

  // Keep the most recently updated version
  const sorted = [...tasks].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  for (const task of sorted) {
    if (!seen.has(task.id)) {
      seen.add(task.id);
      unique.push(task);
    }
  }

  return unique;
}

// Helper functions
function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}

// Batch transformation
export function transformBatchToSupabase(
  localTasks: LocalTask[],
  userId: string
): SupabaseTask[] {
  return localTasks
    .filter((task) => validateLocalTask(task).valid)
    .map((task) => transformTaskToSupabase(task, userId));
}

export function transformBatchToLocal(supabaseTasks: SupabaseTask[]): LocalTask[] {
  return supabaseTasks
    .filter((task) => validateSupabaseTask(task).valid)
    .map(transformTaskToLocal);
}

// Migration statistics
export interface MigrationStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  sanitized: number;
  transformed: number;
}

export function analyzeTasks(tasks: LocalTask[]): MigrationStats {
  let valid = 0;
  let invalid = 0;
  const ids = new Set<string>();
  let duplicates = 0;

  for (const task of tasks) {
    const validation = validateLocalTask(task);

    if (validation.valid) {
      valid++;

      if (ids.has(task.id)) {
        duplicates++;
      } else {
        ids.add(task.id);
      }
    } else {
      invalid++;
    }
  }

  return {
    total: tasks.length,
    valid,
    invalid,
    duplicates,
    sanitized: 0, // Calculated during sanitization
    transformed: 0, // Calculated during transformation
  };
}

// Export examples for different data types
export interface LocalUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface SupabaseUserProfile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export function transformUserToSupabase(localUser: LocalUser): SupabaseUserProfile {
  return {
    id: localUser.id,
    email: localUser.email,
    name: localUser.name || null,
    created_at: localUser.createdAt,
  };
}

export function transformUserToLocal(supabaseUser: SupabaseUserProfile): LocalUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.name || '',
    createdAt: supabaseUser.created_at,
  };
}

// Settings migration
export interface LocalSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

export interface SupabaseSettings {
  user_id: string;
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
  language_code: string;
  updated_at: string;
}

export function transformSettingsToSupabase(
  localSettings: LocalSettings,
  userId: string
): SupabaseSettings {
  return {
    user_id: userId,
    theme: localSettings.theme,
    notifications_enabled: localSettings.notifications,
    language_code: localSettings.language,
    updated_at: new Date().toISOString(),
  };
}

export function transformSettingsToLocal(supabaseSettings: SupabaseSettings): LocalSettings {
  return {
    theme: supabaseSettings.theme,
    notifications: supabaseSettings.notifications_enabled,
    language: supabaseSettings.language_code,
  };
}

// Generic transformer factory
export function createTransformer<TLocal, TSupabase>(
  toSupabase: (local: TLocal, userId: string) => TSupabase,
  toLocal: (supabase: TSupabase) => TLocal
) {
  return {
    toSupabase: (items: TLocal[], userId: string) =>
      items.map((item) => toSupabase(item, userId)),

    toLocal: (items: TSupabase[]) =>
      items.map(toLocal),

    single: {
      toSupabase: (item: TLocal, userId: string) => toSupabase(item, userId),
      toLocal: (item: TSupabase) => toLocal(item),
    },
  };
}

// Task transformer instance
export const taskTransformer = createTransformer(
  transformTaskToSupabase,
  transformTaskToLocal
);

// User transformer instance
export const userTransformer = createTransformer(
  transformUserToSupabase,
  transformUserToLocal
);
