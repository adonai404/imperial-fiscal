import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  created_at: string;
  updated_at: string;
}

export interface FiscalData {
  id: string;
  company_id: string;
  period: string;
  rbt12: number;
  entrada: number;
  saida: number;
  imposto: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithData extends Company {
  fiscal_data: FiscalData[];
}

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Company[];
    },
  });
};

export const useCompanyWithData = (companyId: string) => {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          fiscal_data(*)
        `)
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data as CompanyWithData;
    },
    enabled: !!companyId,
  });
};

export const useFiscalStats = () => {
  return useQuery({
    queryKey: ['fiscal-stats'],
    queryFn: async () => {
      const [companiesResult, fiscalDataResult] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact' }),
        supabase.from('fiscal_data').select('entrada, saida, imposto'),
      ]);

      if (companiesResult.error) throw companiesResult.error;
      if (fiscalDataResult.error) throw fiscalDataResult.error;

      const totalCompanies = companiesResult.count || 0;
      const totalRecords = fiscalDataResult.data?.length || 0;
      
      const totals = fiscalDataResult.data?.reduce(
        (acc, curr) => ({
          entrada: acc.entrada + (curr.entrada || 0),
          saida: acc.saida + (curr.saida || 0),
          imposto: acc.imposto + (curr.imposto || 0),
        }),
        { entrada: 0, saida: 0, imposto: 0 }
      ) || { entrada: 0, saida: 0, imposto: 0 };

      return {
        totalCompanies,
        totalRecords,
        ...totals,
      };
    },
  });
};

export const useImportExcel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Array<{
      empresa: string;
      cnpj: string;
      periodo: string;
      rbt12: number;
      entrada: number;
      saida: number;
      imposto: number;
    }>) => {
      // Process companies first
      const companiesMap = new Map();
      const uniqueCompanies = [];

      for (const row of data) {
        if (!companiesMap.has(row.cnpj)) {
          companiesMap.set(row.cnpj, row.empresa);
          uniqueCompanies.push({
            name: row.empresa,
            cnpj: row.cnpj,
          });
        }
      }

      // Insert companies (using upsert to handle duplicates)
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .upsert(uniqueCompanies, { onConflict: 'cnpj' })
        .select();

      if (companiesError) throw companiesError;

      // Create a map of CNPJ to company ID
      const cnpjToIdMap = new Map();
      companies?.forEach(company => {
        cnpjToIdMap.set(company.cnpj, company.id);
      });

      // Prepare fiscal data
      const fiscalDataRows = data.map(row => ({
        company_id: cnpjToIdMap.get(row.cnpj),
        period: row.periodo,
        rbt12: row.rbt12,
        entrada: row.entrada,
        saida: row.saida,
        imposto: row.imposto,
      }));

      // Insert fiscal data (using upsert to handle duplicates)
      const { error: fiscalError } = await supabase
        .from('fiscal_data')
        .upsert(fiscalDataRows, { onConflict: 'company_id,period' });

      if (fiscalError) throw fiscalError;

      return { importedRecords: data.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      toast({
        title: 'Importação concluída',
        description: `${result.importedRecords} registros importados com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um erro ao importar os dados. Verifique o arquivo e tente novamente.',
        variant: 'destructive',
      });
      console.error('Import error:', error);
    },
  });
};