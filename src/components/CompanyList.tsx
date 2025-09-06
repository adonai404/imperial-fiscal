import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCompanies } from '@/hooks/useFiscalData';
import { Search, Building2, FileText } from 'lucide-react';

interface CompanyListProps {
  onSelectCompany: (companyId: string) => void;
  selectedCompanyId?: string;
}

export const CompanyList = ({ onSelectCompany, selectedCompanyId }: CompanyListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: companies, isLoading } = useCompanies();

  const filteredCompanies = companies?.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Empresas ({companies?.length || 0})
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por empresa ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredCompanies?.map((company) => (
            <Button
              key={company.id}
              variant={selectedCompanyId === company.id ? "default" : "ghost"}
              className="w-full justify-start h-auto p-4"
              onClick={() => onSelectCompany(company.id)}
            >
              <div className="flex flex-col items-start w-full">
                <div className="flex items-center gap-2 w-full">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium truncate">{company.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  CNPJ: {company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                </span>
              </div>
            </Button>
          ))}
          {filteredCompanies?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhuma empresa encontrada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};