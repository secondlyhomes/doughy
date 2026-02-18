export interface GeometryDump {
    path: number[] | null
    geom: unknown | null
  }
  
  export interface ValidDetail {
    valid: boolean | null
    reason: string | null
    location: unknown | null
  }
  
  // PostGIS views
  export interface GeometryColumnsView {
    Row: {
      coord_dimension: number | null
      f_geometry_column: unknown | null
      f_table_catalog: string | null
      f_table_name: unknown | null
      f_table_schema: unknown | null
      srid: number | null
      type: string | null
    }
    Insert: {
      coord_dimension?: number | null
      f_geometry_column?: unknown | null
      f_table_catalog?: string | null
      f_table_name?: unknown | null
      f_table_schema?: unknown | null
      srid?: number | null
      type?: string | null
    }
    Update: {
      coord_dimension?: number | null
      f_geometry_column?: unknown | null
      f_table_catalog?: string | null
      f_table_name?: unknown | null
      f_table_schema?: unknown | null
      srid?: number | null
      type?: string | null
    }
    Relationships: []
  }
  
  export interface GeographyColumnsView {
    Row: {
      coord_dimension: number | null
      f_geography_column: unknown | null
      f_table_catalog: unknown | null
      f_table_name: unknown | null
      f_table_schema: unknown | null
      srid: number | null
      type: string | null
    }
    Relationships: []
  }
  