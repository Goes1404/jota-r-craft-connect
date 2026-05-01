-- Migration: Admin Elite Features
-- 1. Add notes and manual tags to profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='admin_notes') THEN
        ALTER TABLE public.profiles ADD COLUMN admin_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='manual_tags') THEN
        ALTER TABLE public.profiles ADD COLUMN manual_tags TEXT[] DEFAULT '{}';
    END IF;
END $$;
