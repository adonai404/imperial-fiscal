import { useState } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Dashboard } from '@/components/Dashboard';
import { ExcelUpload } from '@/components/ExcelUpload';
import { CompanyList } from '@/components/CompanyList';
import { CompanyDetails } from '@/components/CompanyDetails';
import { Building2 } from 'lucide-react';
const Index = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>();
  const [activeSection, setActiveSection] = useState('dashboard');
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'import':
        return <div>
            <ExcelUpload />
            
          </div>;
      case 'companies':
        return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <CompanyList onSelectCompany={setSelectedCompanyId} selectedCompanyId={selectedCompanyId} />
            </div>
            <div className="lg:col-span-2">
              {selectedCompanyId ? <CompanyDetails companyId={selectedCompanyId} /> : <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    Selecione uma empresa para visualizar os detalhes
                  </p>
                </div>}
            </div>
          </div>;
      default:
        return <Dashboard />;
    }
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">
                {activeSection === 'dashboard' && 'Dashboard'}
                {activeSection === 'import' && 'Importação de Dados'}
                {activeSection === 'companies' && 'Gestão de Empresas'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeSection === 'dashboard' && 'Visualize estatísticas gerais do sistema'}
                {activeSection === 'import' && 'Importe dados de planilhas Excel'}
                {activeSection === 'companies' && 'Gerencie e visualize dados das empresas'}
              </p>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default Index;