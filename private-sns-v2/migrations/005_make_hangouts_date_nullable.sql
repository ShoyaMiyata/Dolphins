-- Make date column nullable in hangouts table
ALTER TABLE public.hangouts ALTER COLUMN date DROP NOT NULL;
