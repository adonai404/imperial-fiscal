import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Helper function to parse fiscal period to Date for comparison
const parsePeriodToDate = (period: string): Date => {
  if (!period || period.trim() === '') {
    return new Date(0); // Return epoch for invalid periods
  }

  const periodStr = period.toLowerCase().trim();
  
  // Month names mapping
  const monthNames: { [key: string]: number } = {
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'marco': 2, 'abril': 3,
    'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
    'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11,
    'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
  };

  // Try different patterns
  const patterns = [
    // "Janeiro/2024", "Dezembro/2023"
    /^([a-zç]+)\/(\d{4})$/,
    // "Jan/2024", "Dez/2023"
    /^([a-zç]+)\/(\d{4})$/,
    // "01/2024", "12/2023"
    /^(\d{1,2})\/(\d{4})$/,
    // "2024-01", "2023-12"
    /^(\d{4})-(\d{1,2})$/,
    // "Janeiro 2024", "Dezembro 2023"
    /^([a-zç]+)\s+(\d{4})$/,
    // "Jan 2024", "Dez 2023"
    /^([a-zç]+)\s+(\d{4})$/
  ];

  for (const pattern of patterns) {
    const match = periodStr.match(pattern);
    if (match) {
      let month: number;
      const year = parseInt(match[2], 10);

      if (isNaN(year) || year < 1900 || year > 2100) {
        continue;
      }

      // Check if first group is a month name
      if (monthNames[match[1]]) {
        month = monthNames[match[1]];
      } else {
        // Check if it's a numeric month
        const numericMonth = parseInt(match[1], 10);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          month = numericMonth - 1; // JavaScript months are 0-based
        } else {
          continue;
        }
      }

      return new Date(year, month, 1);
    }
  }

  // If no pattern matches, try to parse as a regular date
  const fallbackDate = new Date(period);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }

  // Return epoch for unparseable periods
  return new Date(0);
};

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  sem_movimento?: boolean;
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
          fiscal_data(rbt12, entrada, saida, imposto, period, created_at)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Process to get only the latest fiscal data for each company
      const companiesWithLatestData: CompanyWithLatestData[] = data?.map(company => {
        if (company.fiscal_data && company.fiscal_data.length > 0) {
          // Sort by fiscal period to get the most recent
          const sortedFiscalData = company.fiscal_data.sort((a: any, b: any) => {
            const dateA = parsePeriodToDate(a.period);
            const dateB = parsePeriodToDate(b.period);
            return dateB.getTime() - dateA.getTime();
          });
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
        supabase.from('companies').select('id, sem_movimento', { count: 'exact' }),
        supabase.from('fiscal_data').select('entrada, saida, imposto'),
      ]);

      if (companiesResult.error) throw companiesResult.error;
      if (fiscalDataResult.error) throw fiscalDataResult.error;

      const totalCompanies = companiesResult.count || 0;
      const totalRecords = fiscalDataResult.data?.length || 0;
      
      // Calcular empresas ativas vs inativas
      const empresasAtivas = companiesResult.data?.filter(company => !company.sem_movimento).length || 0;
      const empresasInativas = companiesResult.data?.filter(company => company.sem_movimento).length || 0;
      
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
        empresasAtivas,
        empresasInativas,
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
    mutationFn: async (companyData: { name: string; cnpj?: string; sem_movimento?: boolean }) => {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: companyData.name.trim(),
          cnpj: companyData.cnpj?.trim() || null,
          sem_movimento: companyData.sem_movimento || false,
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

export const useAddFiscalData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      company_id: string;
      period: string;
      rbt12: number;
      entrada: number;
      saida: number;
      imposto: number;
    }) => {
      const { data: result, error } = await supabase
        .from('fiscal_data')
        .insert({
          company_id: data.company_id,
          period: data.period.trim(),
          rbt12: data.rbt12 || 0,
          entrada: data.entrada || 0,
          saida: data.saida || 0,
          imposto: data.imposto || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      toast({
        title: 'Dados fiscais adicionados',
        description: 'Os dados fiscais foram cadastrados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar dados fiscais',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao cadastrar os dados fiscais.',
        variant: 'destructive',
      });
    },
  });
};

export const useImportCompanyExcel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, data }: {
      companyId: string;
      data: Array<{
        periodo: string;
        rbt12: number | null;
        entrada: number | null;
        saida: number | null;
        imposto: number | null;
      }>
    }) => {
      // Filter out rows without essential data
      const validRows = data.filter(row => 
        row.periodo && row.periodo.trim()
      );

      if (validRows.length === 0) {
        throw new Error('Nenhum registro válido encontrado. Verifique se a coluna Período está preenchida.');
      }

      // Prepare fiscal data
      const fiscalDataRows = validRows.map(row => ({
        company_id: companyId,
        period: row.periodo.trim(),
        rbt12: row.rbt12 || 0,
        entrada: row.entrada || 0,
        saida: row.saida || 0,
        imposto: row.imposto || 0,
      }));

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
      queryClient.invalidateQueries({ queryKey: ['company'] });
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

export const useUpdateCompanyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, sem_movimento }: { companyId: string; sem_movimento: boolean }) => {
      const { data, error } = await supabase
        .from('companies')
        .update({ sem_movimento })
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      
      toast({
        title: 'Situação atualizada',
        description: 'A situação da empresa foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar situação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar a situação da empresa.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, name, cnpj }: { companyId: string; name: string; cnpj?: string }) => {
      const { data, error } = await supabase
        .from('companies')
        .update({ 
          name: name.trim(),
          cnpj: cnpj?.trim() || null
        })
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      
      toast({
        title: 'Empresa atualizada',
        description: 'Os dados da empresa foram atualizados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar empresa',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar a empresa.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateFiscalData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      period: string;
      rbt12: number;
      entrada: number;
      saida: number;
      imposto: number;
    }) => {
      const { data: result, error } = await supabase
        .from('fiscal_data')
        .update({
          period: data.period.trim(),
          rbt12: data.rbt12 || 0,
          entrada: data.entrada || 0,
          saida: data.saida || 0,
          imposto: data.imposto || 0,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      toast({
        title: 'Dados fiscais atualizados',
        description: 'Os dados fiscais foram atualizados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar dados fiscais',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar os dados fiscais.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteFiscalData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fiscalDataId: string) => {
      const { error } = await supabase
        .from('fiscal_data')
        .delete()
        .eq('id', fiscalDataId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      toast({
        title: 'Dados fiscais excluídos',
        description: 'Os dados fiscais foram removidos com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir dados fiscais',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao excluir os dados fiscais.',
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
      sem_movimento?: boolean;
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
            sem_movimento: row.sem_movimento || false,
            id: null // Will be filled after insert
          });
          uniqueCompanies.push({
            name: row.empresa.trim(),
            cnpj: row.cnpj && row.cnpj.trim() ? row.cnpj.trim() : null,
            sem_movimento: row.sem_movimento || false,
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
          // Update existing company with new data (including situation)
          const { data: updatedCompany, error: updateError } = await supabase
            .from('companies')
            .update({
              name: company.name,
              cnpj: company.cnpj,
              sem_movimento: company.sem_movimento
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) throw updateError;
          companies.push(updatedCompany);
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