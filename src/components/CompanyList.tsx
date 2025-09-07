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
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Empresas ({companies?.length || 0})
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
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
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por empresa ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 backdrop-blur-sm">
                <TableHead className="border-r border-border font-semibold text-foreground w-8 text-center">#</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground min-w-0 flex-1">Nome da Empresa</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden sm:table-cell">CNPJ</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden md:table-cell">RBT12</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden lg:table-cell">Entrada</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden lg:table-cell">Saída</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">Imposto</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden xl:table-cell">Período</TableHead>
                <TableHead className="w-12 font-semibold text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies?.map((company, index) => (
                <TableRow 
                  key={company.id}
                  className="cursor-pointer hover:bg-accent transition-colors border-b border-border bg-muted/30"
                  onClick={() => onSelectCompany(company.id)}
                >
                  <TableCell className="border-r border-border text-center text-muted-foreground font-mono text-sm w-8">
                    {index + 1}
                  </TableCell>
                  <TableCell className="border-r border-border font-medium text-foreground min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{company.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-border text-foreground w-24 hidden sm:table-cell">
                    <span className="truncate block text-xs">
                      {company.cnpj 
                        ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                        : 'N/A'
                      }
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-right text-foreground w-20 hidden md:table-cell">
                    <span className="truncate block text-xs">
                      {company.latest_fiscal_data?.rbt12 ? 
                        company.latest_fiscal_data.rbt12.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }) : 'N/A'
                      }
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-right text-green-600 dark:text-green-400 font-medium w-20 hidden lg:table-cell">
                    <span className="truncate block text-xs">
                      {company.latest_fiscal_data?.entrada ? 
                        company.latest_fiscal_data.entrada.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }) : 'N/A'
                      }
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-right text-red-600 dark:text-red-400 font-medium w-20 hidden lg:table-cell">
                    <span className="truncate block text-xs">
                      {company.latest_fiscal_data?.saida ? 
                        company.latest_fiscal_data.saida.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }) : 'N/A'
                      }
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-right text-orange-600 dark:text-orange-400 font-medium w-20 hidden xl:table-cell">
                    <span className="truncate block text-xs">
                      {company.latest_fiscal_data?.imposto ? 
                        company.latest_fiscal_data.imposto.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }) : 'N/A'
                      }
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-foreground w-24 hidden xl:table-cell">
                    <span className="truncate block text-xs">
                      {company.latest_fiscal_data?.period || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center w-12">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-3 w-3" />
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
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground border-b border-border">
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