import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompaniesWithLatestFiscalData, useDeleteCompany, useAddCompany, useUpdateCompanyStatus, useUpdateCompany } from '@/hooks/useFiscalData';
import { Search, Building2, FileText, Plus, Trash2, Edit3, CheckCircle, AlertCircle, PauseCircle, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface CompanyListProps {
  onSelectCompany: (companyId: string) => void;
}

interface AddCompanyForm {
  name: string;
  cnpj: string;
}

interface EditCompanyForm {
  name: string;
  cnpj: string;
}

export const CompanyList = ({ onSelectCompany }: CompanyListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<{ id: string; name: string; cnpj: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string; currentStatus: boolean } | null>(null);
  const { data: companies, isLoading } = useCompaniesWithLatestFiscalData();
  const deleteCompanyMutation = useDeleteCompany();
  const addCompanyMutation = useAddCompany();
  const updateCompanyMutation = useUpdateCompany();
  const updateStatusMutation = useUpdateCompanyStatus();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddCompanyForm>();
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue, formState: { errors: editErrors } } = useForm<EditCompanyForm>();

  const filteredCompanies = companies?.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.cnpj && company.cnpj.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'todas' || 
      (statusFilter === 'ativa' && !company.sem_movimento) ||
      (statusFilter === 'sem_movimento' && company.sem_movimento);
    
    return matchesSearch && matchesStatus;
  });

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

  const handleEditCompany = (data: EditCompanyForm) => {
    if (!editingCompany) return;
    
    updateCompanyMutation.mutate({
      companyId: editingCompany.id,
      name: data.name,
      cnpj: data.cnpj || undefined,
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingCompany(null);
        resetEdit();
      }
    });
  };

  const openEditDialog = (company: any) => {
    setEditingCompany({ id: company.id, name: company.name, cnpj: company.cnpj || '' });
    setValue('name', company.name);
    setValue('cnpj', company.cnpj || '');
    setIsEditDialogOpen(true);
  };

  const handleStatusClick = (company: any) => {
    setSelectedCompany({
      id: company.id,
      name: company.name,
      currentStatus: company.sem_movimento || false
    });
    setStatusModalOpen(true);
  };

  const handleStatusChange = (newStatus: 'ativa' | 'paralizada' | 'sem_movimento') => {
    if (!selectedCompany) return;

    const sem_movimento = newStatus === 'sem_movimento' || newStatus === 'paralizada';
    
    updateStatusMutation.mutate({
      companyId: selectedCompany.id,
      sem_movimento
    }, {
      onSuccess: () => {
        setStatusModalOpen(false);
        setSelectedCompany(null);
      }
    });
  };

  const getStatusDisplay = (sem_movimento: boolean) => {
    return sem_movimento ? 'SM' : 'Ativa';
  };

  const getStatusColor = (sem_movimento: boolean) => {
    return sem_movimento 
      ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20' 
      : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
  };

  const getStatusIcon = (sem_movimento: boolean) => {
    return sem_movimento ? PauseCircle : CheckCircle;
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
    <div className="space-y-6">
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
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por empresa ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as situações</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="sem_movimento">Sem Movimento</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                <TableHead className="border-r border-border font-semibold text-foreground w-24">Situação</TableHead>
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
                  <TableCell className="border-r border-border text-center w-24">
                    <div
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 ${getStatusColor(company.sem_movimento || false)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusClick(company);
                      }}
                      title="Clique para alterar a situação (SM = Sem Movimento)"
                    >
                      {(() => {
                        const IconComponent = getStatusIcon(company.sem_movimento || false);
                        return <IconComponent className="h-3 w-3 mr-1.5" />;
                      })()}
                      {getStatusDisplay(company.sem_movimento || false)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center w-12">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(company);
                        }}
                        title="Editar empresa"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCompanies?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground border-b border-border">
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

    {/* Modal de Seleção de Situação */}
    <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Alterar Situação da Empresa
          </DialogTitle>
          <DialogDescription>
            Selecione a nova situação para <strong>{selectedCompany?.name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {/* Opção Ativa */}
          <div
            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCompany?.currentStatus === false
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
            }`}
            onClick={() => handleStatusChange('ativa')}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${selectedCompany?.currentStatus === false ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <CheckCircle className={`h-5 w-5 ${selectedCompany?.currentStatus === false ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
              </div>
              <div>
                <h4 className="font-medium text-green-700 dark:text-green-300">Ativa</h4>
                <p className="text-sm text-green-600 dark:text-green-400">Empresa em funcionamento normal</p>
              </div>
            </div>
          </div>

          {/* Opção Paralisada */}
          <div
            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCompany?.currentStatus === true
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
            }`}
            onClick={() => handleStatusChange('paralizada')}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${selectedCompany?.currentStatus === true ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <AlertCircle className={`h-5 w-5 ${selectedCompany?.currentStatus === true ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`} />
              </div>
              <div>
                <h4 className="font-medium text-orange-700 dark:text-orange-300">Paralisada</h4>
                <p className="text-sm text-orange-600 dark:text-orange-400">Empresa temporariamente paralisada</p>
              </div>
            </div>
          </div>

          {/* Opção Sem Movimento */}
          <div
            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCompany?.currentStatus === true
                ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
            }`}
            onClick={() => handleStatusChange('sem_movimento')}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${selectedCompany?.currentStatus === true ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <PauseCircle className={`h-5 w-5 ${selectedCompany?.currentStatus === true ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`} />
              </div>
              <div>
                <h4 className="font-medium text-red-700 dark:text-red-300">Sem Movimento</h4>
                <p className="text-sm text-red-600 dark:text-red-400">Empresa sem atividade fiscal</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setStatusModalOpen(false)}
            disabled={updateStatusMutation.isPending}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de Edição da Empresa */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>
            Altere os dados da empresa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleEditSubmit(handleEditCompany)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome da Empresa *</Label>
            <Input
              id="edit-name"
              {...registerEdit('name', { required: 'Nome da empresa é obrigatório' })}
              placeholder="Digite o nome da empresa"
            />
            {editErrors.name && (
              <p className="text-sm text-destructive">{editErrors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-cnpj">CNPJ</Label>
            <Input
              id="edit-cnpj"
              {...registerEdit('cnpj')}
              placeholder="00.000.000/0000-00 (opcional)"
              maxLength={18}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingCompany(null);
                resetEdit();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateCompanyMutation.isPending}
            >
              {updateCompanyMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
  );
};