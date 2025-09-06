-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fiscal_data table
CREATE TABLE public.fiscal_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  rbt12 DECIMAL(15,2),
  entrada DECIMAL(15,2),
  saida DECIMAL(15,2),
  imposto DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, period)
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a business system)
CREATE POLICY "Companies are viewable by everyone" 
ON public.companies 
FOR SELECT 
USING (true);

CREATE POLICY "Companies can be inserted by everyone" 
ON public.companies 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Companies can be updated by everyone" 
ON public.companies 
FOR UPDATE 
USING (true);

CREATE POLICY "Fiscal data is viewable by everyone" 
ON public.fiscal_data 
FOR SELECT 
USING (true);

CREATE POLICY "Fiscal data can be inserted by everyone" 
ON public.fiscal_data 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Fiscal data can be updated by everyone" 
ON public.fiscal_data 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fiscal_data_updated_at
BEFORE UPDATE ON public.fiscal_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX idx_fiscal_data_company_id ON public.fiscal_data(company_id);
CREATE INDEX idx_fiscal_data_period ON public.fiscal_data(period);