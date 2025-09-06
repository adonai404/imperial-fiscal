-- Add DELETE policies for companies and fiscal_data tables

-- Allow deletion of companies
CREATE POLICY "Companies can be deleted by everyone" 
ON public.companies 
FOR DELETE 
USING (true);

-- Allow deletion of fiscal data (cascade when company is deleted)
CREATE POLICY "Fiscal data can be deleted by everyone" 
ON public.fiscal_data 
FOR DELETE 
USING (true);