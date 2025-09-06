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

export interface CompanyWithLatestData extends Company {
  latest_fiscal_data?: {
    rbt12: number;
    entrada: number;
    saida: number;
    imposto: number;
    period: string;
  };
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

export const useCompaniesWithLatestFiscalData = () => {
  return useQuery({
    queryKey: ['companies-with-latest-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          fiscal_data!inner(rbt12, entrada, saida, imposto, period, created_at)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Process to get only the latest fiscal data for each company
      const companiesWithLatestData: CompanyWithLatestData[] = data?.map(company => {
        if (company.fiscal_data && company.fiscal_data.length > 0) {
          // Sort by created_at descending to get the most recent
          const sortedFiscalData = company.fiscal_data.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const latestData = sortedFiscalData[0];
          
          return {
            ...company,
            latest_fiscal_data: {
              rbt12: latestData.rbt12 || 0,
              entrada: latestData.entrada || 0,
              saida: latestData.saida || 0,
              imposto: latestData.imposto || 0,
              period: latestData.period || 'N/A'
            }
          };
        }
        return company;
      }) || [];
      
      return companiesWithLatestData;
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

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyId: string) => {
      // First delete all fiscal data for this company
      const { error: fiscalError } = await supabase
        .from('fiscal_data')
        .delete()
        .eq('company_id', companyId);

      if (fiscalError) throw fiscalError;

      // Then delete the company
      const { error: companyError } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (companyError) throw companyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      toast({
        title: 'Empresa excluída',
        description: 'A empresa e todos os seus dados fiscais foram removidos com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir empresa',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao excluir a empresa.',
        variant: 'destructive',
      });
    },
  });
};

export const useAddCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyData: { name: string; cnpj?: string }) => {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: companyData.name.trim(),
          cnpj: companyData.cnpj?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      toast({
        title: 'Empresa adicionada',
        description: 'A empresa foi cadastrada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar empresa',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao cadastrar a empresa.',
        variant: 'destructive',
      });
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
      rbt12: number | null;
      entrada: number | null;
      saida: number | null;
      imposto: number | null;
    }>) => {
      // Filter out rows without essential data (only empresa is required now)
      const validRows = data.filter(row => 
        row.empresa && row.empresa.trim()
      );

      if (validRows.length === 0) {
        throw new Error('Nenhum registro válido encontrado. Verifique se a coluna Empresa está preenchida.');
      }

      // Process companies first
      const companiesMap = new Map();
      const uniqueCompanies = [];

      for (const row of validRows) {
        // Use CNPJ if available, otherwise generate a unique key from company name
        const companyKey = row.cnpj && row.cnpj.trim() ? row.cnpj.trim() : `company_${row.empresa.trim().toLowerCase().replace(/\s+/g, '_')}`;
        
        if (!companiesMap.has(companyKey)) {
          companiesMap.set(companyKey, {
            name: row.empresa.trim(),
            cnpj: row.cnpj && row.cnpj.trim() ? row.cnpj.trim() : null,
            id: null // Will be filled after insert
          });
          uniqueCompanies.push({
            name: row.empresa.trim(),
            cnpj: row.cnpj && row.cnpj.trim() ? row.cnpj.trim() : null,
          });
        }
      }

      // Insert companies one by one to handle potential duplicates
      const companies = [];
      for (const company of uniqueCompanies) {
        // First check if company already exists
        const existingQuery = supabase
          .from('companies')
          .select('*');

        if (company.cnpj) {
          existingQuery.eq('cnpj', company.cnpj);
        } else {
          existingQuery.eq('name', company.name).is('cnpj', null);
        }

        const { data: existing } = await existingQuery.maybeSingle();

        if (existing) {
          companies.push(existing);
        } else {
          const { data: newCompany, error: insertError } = await supabase
            .from('companies')
            .insert(company)
            .select()
            .single();

          if (insertError) throw insertError;
          companies.push(newCompany);
        }
      }

      // Create a map of company key to company ID
      const companyKeyToIdMap = new Map();
      companies?.forEach(company => {
        const companyKey = company.cnpj ? company.cnpj : `company_${company.name.toLowerCase().replace(/\s+/g, '_')}`;
        companyKeyToIdMap.set(companyKey, company.id);
      });

      // Prepare fiscal data with null/0 handling
      const fiscalDataRows = validRows.map(row => {
        const companyKey = row.cnpj && row.cnpj.trim() ? row.cnpj.trim() : `company_${row.empresa.trim().toLowerCase().replace(/\s+/g, '_')}`;
        return {
          company_id: companyKeyToIdMap.get(companyKey),
          period: row.periodo || 'Não informado',
          rbt12: row.rbt12 || 0,
          entrada: row.entrada || 0,
          saida: row.saida || 0,
          imposto: row.imposto || 0,
        };
      });

      // Insert fiscal data (using upsert to handle duplicates)
      const { error: fiscalError } = await supabase
        .from('fiscal_data')
        .upsert(fiscalDataRows, { onConflict: 'company_id,period' });

      if (fiscalError) throw fiscalError;

      return { 
        importedRecords: validRows.length,
        skippedRecords: data.length - validRows.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      let description = `${result.importedRecords} registros importados com sucesso.`;
      if (result.skippedRecords > 0) {
        description += ` ${result.skippedRecords} registros foram ignorados por falta de dados essenciais.`;
      }
      
      toast({
        title: 'Importação concluída',
        description,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao importar os dados. Verifique o arquivo e tente novamente.',
        variant: 'destructive',
      });
      console.error('Import error:', error);
    },
  });
};