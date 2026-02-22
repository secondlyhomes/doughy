// This file would be quite large with all PostGIS functions
// I'll include a sample of the functions and you can expand as needed

export interface PostgisFunctions {
    st_area: {
      Args:
        | { "": string }
        | { "": unknown }
        | { geog: unknown; use_spheroid?: boolean }
      Returns: number
    }
    st_distance: {
      Args:
        | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
        | { geom1: unknown; geom2: unknown }
      Returns: number
    }
    st_intersects: {
      Args:
        | { geog1: unknown; geog2: unknown }
        | { geom1: unknown; geom2: unknown }
      Returns: boolean
    }
    st_contains: {
      Args: { geom1: unknown; geom2: unknown }
      Returns: boolean
    }
    st_within: {
      Args: { geom1: unknown; geom2: unknown }
      Returns: boolean
    }
    st_transform: {
      Args:
        | { geom: unknown; from_proj: string; to_proj: string }
        | { geom: unknown; from_proj: string; to_srid: number }
        | { geom: unknown; to_proj: string }
      Returns: unknown
    }
    // Add more functions as needed
  }
  
  // You could include either:
  // 1. All functions in this file (which would be very large)
  // 2. Just the most commonly used functions
  // 3. Create a separate file for different categories of functions
  