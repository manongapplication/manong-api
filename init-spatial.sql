-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create spatial indexes function
CREATE OR REPLACE FUNCTION create_spatial_indexes()
RETURNS void AS $$
BEGIN
    -- Will be used after Prisma migrations
    RAISE NOTICE 'PostGIS extensions installed successfully';
END;
$$ LANGUAGE plpgsql;