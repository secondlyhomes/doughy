/**
 * API VERSIONING
 *
 * Comprehensive API versioning system supporting multiple versions
 * Handles routing, migration, deprecation, and backwards compatibility
 *
 * @example
 * ```ts
 * const manager = new APIVersionManager()
 * const result = await manager.handleRequest({
 *   version: 'v2',
 *   endpoint: 'tasks',
 *   params: { status: 'active' }
 * })
 * ```
 */

import { supabase } from '@/services/supabaseClient'

// ============================================================================
// TYPES
// ============================================================================

export const API_VERSIONS = {
  v1: '1.0.0',
  v2: '2.0.0',
  v3: '3.0.0',
} as const

export type APIVersion = keyof typeof API_VERSIONS

export const CURRENT_VERSION: APIVersion = 'v3'
export const DEPRECATED_VERSIONS: APIVersion[] = ['v1']
export const SUPPORTED_VERSIONS: APIVersion[] = ['v2', 'v3']

export interface APIRequest {
  version: APIVersion
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  params?: any
  body?: any
  headers?: Record<string, string>
}

export interface APIResponse<T = any> {
  data?: T
  error?: APIError
  meta?: {
    version: APIVersion
    deprecated?: boolean
    deprecationDate?: string
    sunsetDate?: string
    upgradeUrl?: string
  }
}

export interface APIError {
  code: string
  message: string
  details?: any
}

export interface VersionConfig {
  version: APIVersion
  releaseDate: string
  deprecationDate?: string
  sunsetDate?: string
  breaking_changes: string[]
  new_features: string[]
}

// ============================================================================
// VERSION METADATA
// ============================================================================

export const VERSION_METADATA: Record<APIVersion, VersionConfig> = {
  v1: {
    version: 'v1',
    releaseDate: '2024-01-01',
    deprecationDate: '2025-01-01',
    sunsetDate: '2026-01-01',
    breaking_changes: [],
    new_features: ['Initial API release'],
  },
  v2: {
    version: 'v2',
    releaseDate: '2025-01-01',
    deprecationDate: '2026-01-01',
    sunsetDate: '2027-01-01',
    breaking_changes: [
      'Changed date format from timestamp to ISO 8601',
      'Renamed createdAt/updatedAt to created_at/updated_at',
      'Removed deprecated fields: oldStatus, legacyId',
    ],
    new_features: [
      'Added pagination support',
      'Added filtering and sorting',
      'Added partial updates (PATCH)',
    ],
  },
  v3: {
    version: 'v3',
    releaseDate: '2026-01-01',
    breaking_changes: [
      'Tasks now use UUIDs instead of sequential IDs',
      'Nested resources (subtasks) moved to separate endpoints',
      'Error responses now use RFC 7807 Problem Details',
    ],
    new_features: [
      'GraphQL-like field selection',
      'Webhook support',
      'Batch operations',
      'Real-time subscriptions',
    ],
  },
}

// ============================================================================
// API VERSION MANAGER
// ============================================================================

export class APIVersionManager {
  /**
   * Route request to appropriate version handler
   */
  async handleRequest<T = any>(request: APIRequest): Promise<APIResponse<T>> {
    // Check if version is supported
    if (!this.isVersionSupported(request.version)) {
      return {
        error: {
          code: 'unsupported_version',
          message: `API version ${request.version} is not supported`,
          details: {
            requestedVersion: request.version,
            supportedVersions: SUPPORTED_VERSIONS,
            currentVersion: CURRENT_VERSION,
          },
        },
      }
    }

    // Add deprecation warning if needed
    const meta = this.getVersionMeta(request.version)

    // Route to version-specific handler
    try {
      let data: T
      switch (request.version) {
        case 'v1':
          data = await this.handleV1(request) as T
          break
        case 'v2':
          data = await this.handleV2(request) as T
          break
        case 'v3':
          data = await this.handleV3(request) as T
          break
        default:
          throw new Error(`Unhandled version: ${request.version}`)
      }

      return { data, meta }
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'internal_error',
          message: error.message,
          details: error.details,
        },
        meta,
      }
    }
  }

  /**
   * Check if version is supported
   */
  isVersionSupported(version: APIVersion): boolean {
    return SUPPORTED_VERSIONS.includes(version) || version === CURRENT_VERSION
  }

  /**
   * Get version metadata
   */
  getVersionMeta(version: APIVersion) {
    const config = VERSION_METADATA[version]
    const isDeprecated = DEPRECATED_VERSIONS.includes(version)

    return {
      version,
      deprecated: isDeprecated,
      deprecationDate: config.deprecationDate,
      sunsetDate: config.sunsetDate,
      upgradeUrl: `/docs/api/migration/${version}-to-${CURRENT_VERSION}`,
    }
  }

  // ==========================================================================
  // V1 HANDLERS
  // ==========================================================================

  private async handleV1(request: APIRequest): Promise<any> {
    // V1 is deprecated, but maintained for backwards compatibility
    console.warn(`V1 API called: ${request.endpoint}`)

    switch (request.endpoint) {
      case 'tasks':
        return this.getTasksV1(request)
      case 'task':
        return this.getTaskV1(request)
      default:
        throw new Error(`Unknown V1 endpoint: ${request.endpoint}`)
    }
  }

  private async getTasksV1(request: APIRequest): Promise<any> {
    // V1 format: { success: true, data: [...], count: 10 }
    const { data, error } = await supabase
      .from('tasks')
      .select('*')

    if (error) throw error

    // Transform to V1 format
    return {
      success: true,
      data: data.map(task => this.taskToV1Format(task)),
      count: data.length,
    }
  }

  private async getTaskV1(request: APIRequest): Promise<any> {
    const { id } = request.params

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return {
      success: true,
      data: this.taskToV1Format(data),
    }
  }

  private taskToV1Format(task: any) {
    // V1 used different field names and formats
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      // V1 used timestamps instead of ISO dates
      createdAt: new Date(task.created_at).getTime(),
      updatedAt: new Date(task.updated_at).getTime(),
      // V1 had these deprecated fields
      oldStatus: task.status, // kept for compatibility
      legacyId: task.id, // kept for compatibility
    }
  }

  // ==========================================================================
  // V2 HANDLERS
  // ==========================================================================

  private async handleV2(request: APIRequest): Promise<any> {
    switch (request.endpoint) {
      case 'tasks':
        return this.getTasksV2(request)
      case 'task':
        return this.getTaskV2(request)
      default:
        throw new Error(`Unknown V2 endpoint: ${request.endpoint}`)
    }
  }

  private async getTasksV2(request: APIRequest): Promise<any> {
    const { page = 1, limit = 20, sort, filter } = request.params || {}

    // V2 added pagination
    let query = supabase
      .from('tasks')
      .select('*', { count: 'exact' })

    // V2 added filtering
    if (filter) {
      if (filter.status) {
        query = query.eq('status', filter.status)
      }
      if (filter.priority) {
        query = query.eq('priority', filter.priority)
      }
    }

    // V2 added sorting
    if (sort) {
      const [field, order] = sort.split(':')
      query = query.order(field, { ascending: order === 'asc' })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    // V2 format: { data: [...], pagination: {...} }
    return {
      data: data.map(task => this.taskToV2Format(task)),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }
  }

  private async getTaskV2(request: APIRequest): Promise<any> {
    const { id } = request.params

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return this.taskToV2Format(data)
  }

  private taskToV2Format(task: any) {
    // V2 uses snake_case and ISO dates
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      created_at: task.created_at,
      updated_at: task.updated_at,
      user_id: task.user_id,
    }
  }

  // ==========================================================================
  // V3 HANDLERS (CURRENT)
  // ==========================================================================

  private async handleV3(request: APIRequest): Promise<any> {
    switch (request.endpoint) {
      case 'tasks':
        return this.getTasksV3(request)
      case 'task':
        return this.getTaskV3(request)
      case 'tasks.batch':
        return this.batchTasksV3(request)
      default:
        throw new Error(`Unknown V3 endpoint: ${request.endpoint}`)
    }
  }

  private async getTasksV3(request: APIRequest): Promise<any> {
    const {
      page = 1,
      limit = 20,
      sort,
      filter,
      fields, // V3 added field selection
    } = request.params || {}

    // V3 uses UUIDs and allows field selection
    const selectFields = fields ? fields.join(',') : '*'
    let query = supabase
      .from('tasks')
      .select(selectFields, { count: 'exact' })

    // Filtering
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value as any)
      })
    }

    // Sorting
    if (sort) {
      const [field, order] = sort.split(':')
      query = query.order(field, { ascending: order === 'asc' })
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    // V3 format includes links for HATEOAS
    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
      links: {
        self: `/api/v3/tasks?page=${page}&limit=${limit}`,
        first: `/api/v3/tasks?page=1&limit=${limit}`,
        last: `/api/v3/tasks?page=${Math.ceil((count || 0) / limit)}&limit=${limit}`,
        ...(page > 1 && {
          prev: `/api/v3/tasks?page=${page - 1}&limit=${limit}`,
        }),
        ...(page < Math.ceil((count || 0) / limit) && {
          next: `/api/v3/tasks?page=${page + 1}&limit=${limit}`,
        }),
      },
    }
  }

  private async getTaskV3(request: APIRequest): Promise<any> {
    const { id } = request.params
    const { fields } = request.params || {}

    const selectFields = fields ? fields.join(',') : '*'

    const { data, error } = await supabase
      .from('tasks')
      .select(selectFields)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw {
          code: 'not_found',
          message: 'Task not found',
          details: { id },
        }
      }
      throw error
    }

    return {
      data,
      links: {
        self: `/api/v3/tasks/${id}`,
        update: `/api/v3/tasks/${id}`,
        delete: `/api/v3/tasks/${id}`,
      },
    }
  }

  private async batchTasksV3(request: APIRequest): Promise<any> {
    // V3 added batch operations
    const { operations } = request.body

    const results = []
    for (const op of operations) {
      try {
        let result
        switch (op.method) {
          case 'POST':
            result = await supabase.from('tasks').insert(op.data).select().single()
            break
          case 'PATCH':
            result = await supabase.from('tasks').update(op.data).eq('id', op.id).select().single()
            break
          case 'DELETE':
            result = await supabase.from('tasks').delete().eq('id', op.id)
            break
          default:
            throw new Error(`Unsupported batch method: ${op.method}`)
        }

        results.push({
          success: true,
          operation: op,
          data: result.data,
        })
      } catch (error: any) {
        results.push({
          success: false,
          operation: op,
          error: {
            code: error.code,
            message: error.message,
          },
        })
      }
    }

    return {
      results,
      summary: {
        total: operations.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    }
  }

  // ==========================================================================
  // MIGRATION HELPERS
  // ==========================================================================

  /**
   * Migrate V1 data to V2 format
   */
  async migrateV1toV2(data: any): Promise<any> {
    return {
      ...data,
      // Convert timestamp to ISO date
      created_at: new Date(data.createdAt).toISOString(),
      updated_at: new Date(data.updatedAt).toISOString(),
      // Remove deprecated fields
      oldStatus: undefined,
      legacyId: undefined,
    }
  }

  /**
   * Migrate V2 data to V3 format
   */
  async migrateV2toV3(data: any): Promise<any> {
    // V3 uses UUIDs, so need to handle ID migration separately
    return {
      ...data,
      // Ensure UUID format
      id: this.ensureUUID(data.id),
      user_id: this.ensureUUID(data.user_id),
    }
  }

  private ensureUUID(id: any): string {
    // If already UUID, return as is
    if (typeof id === 'string' && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return id
    }

    // Otherwise, generate UUID from sequential ID
    // (This is a simplified example - real implementation would use a mapping table)
    return `00000000-0000-0000-0000-${String(id).padStart(12, '0')}`
  }
}

// ============================================================================
// VERSION DETECTION
// ============================================================================

/**
 * Detect API version from request headers or URL
 */
export function detectAPIVersion(request: any): APIVersion {
  // Check URL path: /api/v2/tasks
  const pathMatch = request.url?.match(/\/api\/(v\d+)\//)
  if (pathMatch) {
    return pathMatch[1] as APIVersion
  }

  // Check Accept header: application/vnd.myapp.v2+json
  const acceptHeader = request.headers?.['accept']
  const acceptMatch = acceptHeader?.match(/vnd\.myapp\.(v\d+)\+json/)
  if (acceptMatch) {
    return acceptMatch[1] as APIVersion
  }

  // Check custom header: X-API-Version: v2
  const versionHeader = request.headers?.['x-api-version']
  if (versionHeader) {
    return versionHeader as APIVersion
  }

  // Default to current version
  return CURRENT_VERSION
}

// ============================================================================
// DEPRECATION WARNINGS
// ============================================================================

export function getDeprecationWarning(version: APIVersion): string | null {
  if (!DEPRECATED_VERSIONS.includes(version)) {
    return null
  }

  const config = VERSION_METADATA[version]
  return (
    `API version ${version} is deprecated. ` +
    `It will be sunset on ${config.sunsetDate}. ` +
    `Please upgrade to ${CURRENT_VERSION}. ` +
    `Migration guide: /docs/api/migration/${version}-to-${CURRENT_VERSION}`
  )
}

// ============================================================================
// CLIENT SDK HELPERS
// ============================================================================

export class APIClient {
  constructor(
    private baseUrl: string,
    private version: APIVersion = CURRENT_VERSION
  ) {}

  async request<T = any>(
    endpoint: string,
    options?: RequestInit
  ): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}/api/${this.version}/${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': this.version,
        ...options?.headers,
      },
    })

    const data = await response.json()

    // Check for deprecation warnings
    if (data.meta?.deprecated) {
      console.warn(getDeprecationWarning(this.version))
    }

    return data
  }

  async get<T = any>(endpoint: string, params?: any): Promise<APIResponse<T>> {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return this.request<T>(`${endpoint}${query}`, { method: 'GET' })
  }

  async post<T = any>(endpoint: string, body: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async put<T = any>(endpoint: string, body: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async patch<T = any>(endpoint: string, body: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  async delete<T = any>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  setVersion(version: APIVersion) {
    this.version = version
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const apiVersionManager = new APIVersionManager()
