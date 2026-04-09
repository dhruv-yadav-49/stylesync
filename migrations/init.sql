-- Create tables for StyleSync

CREATE TABLE IF NOT EXISTS scraped_sites (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    site_name TEXT,
    html TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS design_tokens (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES scraped_sites(id) ON DELETE CASCADE,
    colors JSONB DEFAULT '{}'::jsonb,
    typography JSONB DEFAULT '{}'::jsonb,
    spacing JSONB DEFAULT '{}'::jsonb,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locked_tokens (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES scraped_sites(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'colors', 'typography', 'spacing'
    field TEXT NOT NULL,    -- e.g., 'primary', 'headingFont'
    UNIQUE(site_id, category, field)
);

CREATE TABLE IF NOT EXISTS version_history (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES scraped_sites(id) ON DELETE CASCADE,
    tokens JSONB NOT NULL,
    change_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
