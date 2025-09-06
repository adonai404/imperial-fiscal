import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dashboard } from '@/components/Dashboard';
import { ExcelUpload } from '@/components/ExcelUpload';
import { CompanyList } from '@/components/CompanyList';
import { CompanyDetails } from '@/components/CompanyDetails';
import { BarChart3, Upload, Building2 } from 'lucide-react';

const Index = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sistema Fiscal Empresarial</h1>
          <p className="text-muted-foreground">
            Gerencie e visualize dados fiscais de empresas importados de planilhas Excel
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importação
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <Dashboard />
          </TabsContent>

          <TabsContent value="import" className="mt-0">
            <ExcelUpload />
            <div className="mt-6 p-6 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Instruções de Importação</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Formato esperado:</strong> Arquivo Excel (.xlsx ou .xls)</p>
                <p><strong>Colunas aceitas:</strong> Empresa, CNPJ, Período, RBT12, entrada, saída, imposto</p>
                <p><strong>Flexibilidade:</strong> O sistema aceita planilhas com valores em branco ou incompletos</p>
                <p><strong>Tratamento:</strong> Valores ausentes são armazenados como 0, não impedindo a importação</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="companies" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <CompanyList
                  onSelectCompany={setSelectedCompanyId}
                  selectedCompanyId={selectedCompanyId}
                />
              </div>
              <div className="lg:col-span-2">
                {selectedCompanyId ? (
                  <CompanyDetails companyId={selectedCompanyId} />
                ) : (
                  <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">
                      Selecione uma empresa para visualizar os detalhes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
