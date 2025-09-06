-- Add user_id column to companies table to associate companies with users
ALTER TABLE public.companies ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON public.companies;
DROP POLICY IF EXISTS "Companies can be deleted by everyone" ON public.companies;
DROP POLICY IF EXISTS "Companies can be inserted by everyone" ON public.companies;
DROP POLICY IF EXISTS "Companies can be updated by everyone" ON public.companies;

DROP POLICY IF EXISTS "Fiscal data is viewable by everyone" ON public.fiscal_data;
DROP POLICY IF EXISTS "Fiscal data can be deleted by everyone" ON public.fiscal_data;
DROP POLICY IF EXISTS "Fiscal data can be inserted by everyone" ON public.fiscal_data;
DROP POLICY IF EXISTS "Fiscal data can be updated by everyone" ON public.fiscal_data;

-- Create secure RLS policies for companies table
CREATE POLICY "Users can view their own companies" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies" 
ON public.companies 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies" 
ON public.companies 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create secure RLS policies for fiscal_data table
CREATE POLICY "Users can view fiscal data of their own companies" 
ON public.fiscal_data 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = fiscal_data.company_id 
    AND companies.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert fiscal data for their own companies" 
ON public.fiscal_data 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = fiscal_data.company_id 
    AND companies.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update fiscal data of their own companies" 
ON public.fiscal_data 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = fiscal_data.company_id 
    AND companies.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete fiscal data of their own companies" 
ON public.fiscal_data 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = fiscal_data.company_id 
    AND companies.user_id = auth.uid()
  )
);