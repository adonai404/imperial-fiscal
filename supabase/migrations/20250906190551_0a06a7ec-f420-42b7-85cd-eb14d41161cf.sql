-- Drop the unique constraint on CNPJ to allow multiple companies without CNPJ or with duplicate CNPJs
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_cnpj_key;