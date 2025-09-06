-- Make CNPJ nullable in companies table to allow imports without CNPJ
ALTER TABLE public.companies ALTER COLUMN cnpj DROP NOT NULL;