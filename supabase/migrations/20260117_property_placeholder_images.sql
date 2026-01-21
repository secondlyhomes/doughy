-- Migration: Add placeholder Unsplash images to existing properties
-- This populates re_property_images with free-to-use real estate photos
-- for a more realistic UI experience during development

-- Create a temporary array of Unsplash image URLs
DO $$
DECLARE
    image_urls TEXT[] := ARRAY[
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',  -- Modern white house
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',  -- Luxury home exterior
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',  -- Modern house with pool
        'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',  -- Suburban home
        'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800',  -- Cozy house
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',  -- Modern architecture
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',  -- Pink house
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',  -- Luxury villa
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',  -- Contemporary home
        'https://images.unsplash.com/photo-1600573472591-ee6981cf35f5?w=800'   -- Ranch style
    ];
    prop RECORD;
    image_index INT := 1;
    total_images INT := array_length(image_urls, 1);
BEGIN
    -- Loop through all properties that don't have images yet
    FOR prop IN
        SELECT p.id, p.workspace_id
        FROM re_properties p
        LEFT JOIN re_property_images i ON p.id = i.property_id
        WHERE i.id IS NULL
    LOOP
        -- Insert a primary image for this property
        INSERT INTO re_property_images (property_id, url, is_primary, label, workspace_id)
        VALUES (
            prop.id,
            image_urls[image_index],
            true,
            'Primary Photo',
            prop.workspace_id
        );

        -- Cycle through images (1-10, then back to 1)
        image_index := (image_index % total_images) + 1;
    END LOOP;

    RAISE NOTICE 'Added placeholder images to properties without images';
END $$;
