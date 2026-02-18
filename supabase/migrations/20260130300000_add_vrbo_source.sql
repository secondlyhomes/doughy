-- Add vrbo to crm_contact_source enum
-- VRBO is a major vacation rental platform like Airbnb

ALTER TYPE crm_contact_source ADD VALUE IF NOT EXISTS 'vrbo' AFTER 'airbnb';
