// src/features/settings/services/landlord-seeder/constants.ts
// Constants and mock data arrays for landlord seeding

// ============================================
// Unsplash Property Images for Rentals
// ============================================

export const RENTAL_PROPERTY_IMAGES = [
  // Original 10
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', // Modern white house
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80', // Suburban home
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', // Luxury home exterior
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', // Modern house pool
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', // Contemporary home
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80', // Ranch style home
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80', // Classic American home
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', // Luxury villa
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80', // Modern minimal
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', // Craftsman home
  // Additional variety (20 more)
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80', // Two-story home
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', // Colonial style
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80', // Red door house
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80', // Modern architecture
  'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=800&q=80', // Brick home
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80', // Mediterranean villa
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', // Modern luxury
  'https://images.unsplash.com/photo-1599423300746-b62533397364?w=800&q=80', // Beach house
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=80', // Townhouse
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80', // Elegant home
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80', // Modern front
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Cozy apartment
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', // Apartment interior
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80', // Condo exterior
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80', // Urban apartment
  'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80', // Farmhouse style
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&q=80', // Country home
  'https://images.unsplash.com/photo-1575517111478-7f6afd0973db?w=800&q=80', // A-frame cabin
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80', // Cozy cottage
  'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80', // Modern kitchen
];

/**
 * Get a property image by index (cycles through available images)
 */
export function getPropertyImage(index: number = 0): string {
  return RENTAL_PROPERTY_IMAGES[index % RENTAL_PROPERTY_IMAGES.length];
}
