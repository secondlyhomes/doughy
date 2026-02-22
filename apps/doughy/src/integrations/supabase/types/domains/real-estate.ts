import type { Json } from '../common';

export interface RePropertiesTable {
  Row: {
    address_line_1: string
    address_line_2: string | null
    arv: number | null
    bathrooms: number | null
    bedrooms: number | null
    city: string
    created_at: string | null
    created_by: string | null
    geo_point: unknown | null
    id: string
    lot_size: number | null
    mls_id: string | null
    notes: string | null
    profile_id: string
    property_type: string | null
    purchase_price: number | null
    square_feet: number | null
    state: string
    status: string | null
    tags: string[] | null
    updated_at: string | null
    year_built: number | null
    zip: string
  }
  Insert: {
    address_line_1: string
    address_line_2?: string | null
    arv?: number | null
    bathrooms?: number | null
    bedrooms?: number | null
    city: string
    created_at?: string | null
    created_by?: string | null
    geo_point?: unknown | null
    id?: string
    lot_size?: number | null
    mls_id?: string | null
    notes?: string | null
    profile_id: string
    property_type?: string | null
    purchase_price?: number | null
    square_feet?: number | null
    state: string
    status?: string | null
    tags?: string[] | null
    updated_at?: string | null
    year_built?: number | null
    zip: string
  }
  Update: {
    address_line_1?: string
    address_line_2?: string | null
    arv?: number | null
    bathrooms?: number | null
    bedrooms?: number | null
    city?: string
    created_at?: string | null
    created_by?: string | null
    geo_point?: unknown | null
    id?: string
    lot_size?: number | null
    mls_id?: string | null
    notes?: string | null
    profile_id?: string
    property_type?: string | null
    purchase_price?: number | null
    square_feet?: number | null
    state?: string
    status?: string | null
    tags?: string[] | null
    updated_at?: string | null
    year_built?: number | null
    zip?: string
  }
  Relationships: []
}

export interface ReCompsTable {
  Row: {
    address: string
    bathrooms: number | null
    bedrooms: number | null
    city: string
    created_at: string | null
    created_by: string | null
    days_on_market: number | null
    distance: number | null
    features_json: Json | null
    id: string
    lot_size: number | null
    price_per_sqft: number | null
    property_id: string
    sale_date: string | null
    sale_price: number | null
    source: string | null
    special_features: string | null
    square_feet: number | null
    state: string
    status: string | null
    updated_at: string | null
    year_built: number | null
    zip: string
  }
  Insert: {
    address: string
    bathrooms?: number | null
    bedrooms?: number | null
    city: string
    created_at?: string | null
    created_by?: string | null
    days_on_market?: number | null
    distance?: number | null
    features_json?: Json | null
    id?: string
    lot_size?: number | null
    price_per_sqft?: number | null
    property_id: string
    sale_date?: string | null
    sale_price?: number | null
    source?: string | null
    special_features?: string | null
    square_feet?: number | null
    state: string
    status?: string | null
    updated_at?: string | null
    year_built?: number | null
    zip: string
  }
  Update: {
    address?: string
    bathrooms?: number | null
    bedrooms?: number | null
    city?: string
    created_at?: string | null
    created_by?: string | null
    days_on_market?: number | null
    distance?: number | null
    features_json?: Json | null
    id?: string
    lot_size?: number | null
    price_per_sqft?: number | null
    property_id?: string
    sale_date?: string | null
    sale_price?: number | null
    source?: string | null
    special_features?: string | null
    square_feet?: number | null
    state?: string
    status?: string | null
    updated_at?: string | null
    year_built?: number | null
    zip?: string
  }
  Relationships: [
    {
      foreignKeyName: "re_comps_property_id_fkey"
      columns: ["property_id"]
      isOneToOne: false
      referencedRelation: "re_properties"
      referencedColumns: ["id"]
    }
  ]
}

export interface ReFinancingScenariosTable {
  Row: {
    created_at: string | null
    created_by: string | null
    description: string | null
    id: string
    input_json: Json
    is_primary: boolean | null
    name: string
    property_id: string
    pros_cons: string | null
    result_json: Json | null
    scenario_type: string | null
    updated_at: string | null
  }
  Insert: {
    created_at?: string | null
    created_by?: string | null
    description?: string | null
    id?: string
    input_json: Json
    is_primary?: boolean | null
    name: string
    property_id: string
    pros_cons?: string | null
    result_json?: Json | null
    scenario_type?: string | null
    updated_at?: string | null
  }
  Update: {
    created_at?: string | null
    created_by?: string | null
    description?: string | null
    id?: string
    input_json?: Json
    is_primary?: boolean | null
    name?: string
    property_id?: string
    pros_cons?: string | null
    result_json?: Json | null
    scenario_type?: string | null
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "re_financing_scenarios_property_id_fkey"
      columns: ["property_id"]
      isOneToOne: false
      referencedRelation: "re_properties"
      referencedColumns: ["id"]
    }
  ]
}

export interface ReLeadPropertiesTable {
  Row: {
    created_at: string | null
    is_primary: boolean | null
    lead_id: string
    notes: string | null
    property_id: string
    relationship: string | null
    updated_at: string | null
  }
  Insert: {
    created_at?: string | null
    is_primary?: boolean | null
    lead_id: string
    notes?: string | null
    property_id: string
    relationship?: string | null
    updated_at?: string | null
  }
  Update: {
    created_at?: string | null
    is_primary?: boolean | null
    lead_id?: string
    notes?: string | null
    property_id?: string
    relationship?: string | null
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "re_lead_properties_property_id_fkey"
      columns: ["property_id"]
      isOneToOne: false
      referencedRelation: "re_properties"
      referencedColumns: ["id"]
    }
  ]
}

export interface RePropertyAnalysesTable {
  Row: {
    analysis_type: string | null
    created_at: string | null
    created_by: string | null
    id: string
    input_json: Json
    name: string | null
    property_id: string
    result_json: Json
    token_count: number | null
  }
  Insert: {
    analysis_type?: string | null
    created_at?: string | null
    created_by?: string | null
    id?: string
    input_json: Json
    name?: string | null
    property_id: string
    result_json: Json
    token_count?: number | null
  }
  Update: {
    analysis_type?: string | null
    created_at?: string | null
    created_by?: string | null
    id?: string
    input_json?: Json
    name?: string | null
    property_id?: string
    result_json?: Json
    token_count?: number | null
  }
  Relationships: [
    {
      foreignKeyName: "re_property_analyses_property_id_fkey"
      columns: ["property_id"]
      isOneToOne: false
      referencedRelation: "re_properties"
      referencedColumns: ["id"]
    }
  ]
}

export interface RePropertyImagesTable {
  Row: {
    created_at: string | null
    filename: string | null
    id: string
    is_primary: boolean | null
    label: string | null
    property_id: string
    uploaded_by: string | null
    url: string
  }
  Insert: {
    created_at?: string | null
    filename?: string | null
    id?: string
    is_primary?: boolean | null
    label?: string | null
    property_id: string
    uploaded_by?: string | null
    url: string
  }
  Update: {
    created_at?: string | null
    filename?: string | null
    id?: string
    is_primary?: boolean | null
    label?: string | null
    property_id?: string
    uploaded_by?: string | null
    url?: string
  }
  Relationships: [
    {
      foreignKeyName: "re_property_images_property_id_fkey"
      columns: ["property_id"]
      isOneToOne: false
      referencedRelation: "re_properties"
      referencedColumns: ["id"]
    }
  ]
}

export interface ReRepairEstimatesTable {
  Row: {
    category: string | null
    completed: boolean | null
    created_at: string | null
    created_by: string | null
    description: string
    estimate: number
    id: string
    notes: string | null
    priority: string | null
    property_id: string
    updated_at: string | null
  }
  Insert: {
    category?: string | null
    completed?: boolean | null
    created_at?: string | null
    created_by?: string | null
    description: string
    estimate: number
    id?: string
    notes?: string | null
    priority?: string | null
    property_id: string
    updated_at?: string | null
  }
  Update: {
    category?: string | null
    completed?: boolean | null
    created_at?: string | null
    created_by?: string | null
    description?: string
    estimate?: number
    id?: string
    notes?: string | null
    priority?: string | null
    property_id?: string
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "re_repair_estimates_property_id_fkey"
      columns: ["property_id"]
      isOneToOne: false
      referencedRelation: "re_properties"
      referencedColumns: ["id"]
    }
  ]
}
