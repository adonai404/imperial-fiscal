import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useCompaniesWithLatestFiscalData, useDeleteCompany, useAddCompany } from '@/hooks/useFiscalData';
import { Search, Building2, FileText, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface CompanyListProps {
  onSelectCompany: (companyId: string) => void;
}

interface AddCompanyForm {
  name: string;
  cnpj: string;
}

export const CompanyList = ({ onSelectCompany }: CompanyListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { data: companies, isLoading } = useCompaniesWithLatestFiscalData();
  const deleteCompanyMutation = useDeleteCompany();
  const addCompanyMutation = useAddCompany();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddCompanyForm>();

  const filteredCompanies = companies?.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.cnpj && company.cnpj.includes(searchTerm))
  );

  const handleDeleteCompany = (companyId: string, companyName: string) => {
    deleteCompanyMutation.mutate(companyId);
  };

  const handleAddCompany = (data: AddCompanyForm) => {
    addCompanyMutation.mutate({
      name: data.name,
      cnpj: data.cnpj || undefined,
    }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        reset();
      }
    });
  };

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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Empresas ({companies?.length || 0})
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Empresa</DialogTitle>
                <DialogDescription>
                  Preencha os dados da empresa que deseja cadastrar.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(handleAddCompany)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Nome da empresa é obrigatório' })}
                    placeholder="Digite o nome da empresa"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    {...register('cnpj')}
                    placeholder="00.000.000/0000-00 (opcional)"
                    maxLength={18}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={addCompanyMutation.isPending}
                  >
                    {addCompanyMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>RBT12</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Imposto</TableHead>
                <TableHead>Período Mais Recente</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies?.map((company) => (
                <TableRow 
                  key={company.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onSelectCompany(company.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {company.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.cnpj 
                      ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {company.latest_fiscal_data?.rbt12 ? 
                      company.latest_fiscal_data.rbt12.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }) : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {company.latest_fiscal_data?.entrada ? 
                      company.latest_fiscal_data.entrada.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }) : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {company.latest_fiscal_data?.saida ? 
                      company.latest_fiscal_data.saida.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }) : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {company.latest_fiscal_data?.imposto ? 
                      company.latest_fiscal_data.imposto.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }) : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {company.latest_fiscal_data?.period || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a empresa "{company.name}"? 
                            Esta ação também removerá todos os dados fiscais associados e não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCompany(company.id, company.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCompanies?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhuma empresa encontrada</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};