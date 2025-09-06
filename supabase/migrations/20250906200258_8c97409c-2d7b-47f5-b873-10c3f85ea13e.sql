-- Remove strict RLS policies temporarily to allow access to existing data
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can insert their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;

DROP POLICY IF EXISTS "Users can view fiscal data of their own companies" ON public.fiscal_data;
DROP POLICY IF EXISTS "Users can insert fiscal data for their own companies" ON public.fiscal_data;
DROP POLICY IF EXISTS "Users can update fiscal data of their own companies" ON public.fiscal_data;
DROP POLICY IF EXISTS "Users can delete fiscal data of their own companies" ON public.fiscal_data;

-- Remove user_id column since it's not being used properly yet
ALTER TABLE public.companies DROP COLUMN IF EXISTS user_id;

-- Create simple public access policies for now
CREATE POLICY "Public can view all companies" 
ON public.companies 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update companies" 
ON public.companies 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete companies" 
ON public.companies 
FOR DELETE 
USING (true);

-- Policies for fiscal_data
CREATE POLICY "Public can view all fiscal data" 
ON public.fiscal_data 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert fiscal data" 
ON public.fiscal_data 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update fiscal data" 
ON public.fiscal_data 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete fiscal data" 
ON public.fiscal_data 
FOR DELETE 
USING (true);