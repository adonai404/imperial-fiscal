-- Add sem_movimento column to companies table
ALTER TABLE public.companies 
ADD COLUMN sem_movimento BOOLEAN DEFAULT false;