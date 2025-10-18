-- Add region column to page_views table to track US states
ALTER TABLE public.page_views
ADD COLUMN region TEXT;