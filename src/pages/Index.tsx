import { useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { ExcelUpload } from '@/components/ExcelUpload';
import { CompanyList } from '@/components/CompanyList';
import { CompanyDetails } from '@/components/CompanyDetails';

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

        <Dashboard />
        <ExcelUpload />

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
                <p className="text-lg text-muted-foreground">
                  Selecione uma empresa para visualizar os detalhes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
