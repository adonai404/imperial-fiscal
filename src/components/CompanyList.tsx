import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCompaniesWithLatestFiscalData, useDeleteCompany, useAddCompany, useUpdateCompanyStatus, useUpdateCompany } from '@/hooks/useFiscalData';
import { Search, Building2, FileText, Plus, Trash2, Edit3, CheckCircle, AlertCircle, PauseCircle, Filter, X, ArrowUpDown, Calendar, DollarSign, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { CompanyPasswordAuth } from './CompanyPasswordAuth';

interface CompanyListProps {
  onSelectCompany: (companyId: string) => void;
}

interface AddCompanyForm {
  name: string;
  cnpj: string;
  segmento: string;
}

interface EditCompanyForm {
  name: string;
  cnpj: string;
  segmento: string;
}

interface FilterState {
  search: string;
  status: string;
  rbt12Min: string;
  rbt12Max: string;
  periodo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const CompanyList = ({ onSelectCompany }: CompanyListProps) => {
  const [selectedRegime, setSelectedRegime] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'todas',
    rbt12Min: '',
    rbt12Max: '',
    periodo: 'todos',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<{ id: string; name: string; cnpj: string; segmento: string } | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string; currentStatus: boolean } | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [passwordAuthCompany, setPasswordAuthCompany] = useState<{ id: string; name: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { data: companies, isLoading } = useCompaniesWithLatestFiscalData();
  const deleteCompanyMutation = useDeleteCompany();
  const addCompanyMutation = useAddCompany();
  const updateCompanyMutation = useUpdateCompany();
  const updateStatusMutation = useUpdateCompanyStatus();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddCompanyForm>({
    mode: 'onChange'
  });
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue, formState: { errors: editErrors } } = useForm<EditCompanyForm>({
    mode: 'onChange'
  });

  // Primeiro filtrar por regime se selecionado
  const regimeFilteredCompanies = selectedRegime ? getRegimeCompanies(selectedRegime) : companies || [];
  
  const filteredAndSortedCompanies = regimeFilteredCompanies.filter(company => {
    // Filtro de busca
    const matchesSearch = filters.search === '' || 
      company.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (company.cnpj && company.cnpj.includes(filters.search));
    
    // Filtro de status
    const matchesStatus = filters.status === 'todas' || 
      (filters.status === 'ativa' && !company.sem_movimento) ||
      (filters.status === 'paralizada' && company.sem_movimento) ||
      (filters.status === 'sem_movimento' && company.sem_movimento);
    
    // Filtro de RBT12
    const rbt12 = company.latest_fiscal_data?.rbt12 || 0;
    const matchesRbt12Min = filters.rbt12Min === '' || rbt12 >= parseFloat(filters.rbt12Min);
    const matchesRbt12Max = filters.rbt12Max === '' || rbt12 <= parseFloat(filters.rbt12Max);
    
    // Filtro de período
    const matchesPeriodo = filters.periodo === 'todos' || 
      (company.latest_fiscal_data?.period === filters.periodo);
    
    return matchesSearch && matchesStatus && matchesRbt12Min && matchesRbt12Max && matchesPeriodo;
  }).sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (filters.sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'cnpj':
        aValue = a.cnpj || '';
        bValue = b.cnpj || '';
        break;
      case 'rbt12':
        aValue = a.latest_fiscal_data?.rbt12 || 0;
        bValue = b.latest_fiscal_data?.rbt12 || 0;
        break;
      case 'entrada':
        aValue = a.latest_fiscal_data?.entrada || 0;
        bValue = b.latest_fiscal_data?.entrada || 0;
        break;
      case 'saida':
        aValue = a.latest_fiscal_data?.saida || 0;
        bValue = b.latest_fiscal_data?.saida || 0;
        break;
      case 'imposto':
        aValue = a.latest_fiscal_data?.imposto || 0;
        bValue = b.latest_fiscal_data?.imposto || 0;
        break;
      case 'periodo':
        aValue = a.latest_fiscal_data?.period || '';
        bValue = b.latest_fiscal_data?.period || '';
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (filters.sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleDeleteCompany = (companyId: string, companyName: string) => {
    deleteCompanyMutation.mutate(companyId);
  };

  const handleAddCompany = (data: AddCompanyForm) => {
    addCompanyMutation.mutate({
      name: data.name,
      cnpj: data.cnpj || undefined,
      segmento: data.segmento || undefined,
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
      segmento: data.segmento || undefined,
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingCompany(null);
        resetEdit();
      }
    });
  };

  const openEditDialog = (company: any) => {
    setEditingCompany({ id: company.id, name: company.name, cnpj: company.cnpj || '', segmento: company.segmento || '' });
    setValue('name', company.name);
    setValue('cnpj', company.cnpj || '');
    setValue('segmento', company.segmento || '');
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

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'todas',
      rbt12Min: '',
      rbt12Max: '',
      periodo: 'todos',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search !== '') count++;
    if (filters.status !== 'todas') count++;
    if (filters.rbt12Min !== '' || filters.rbt12Max !== '') count++;
    if (filters.periodo !== 'todos') count++;
    return count;
  };

  const getPeriodos = () => {
    const periodos = companies?.map(c => c.latest_fiscal_data?.period).filter(Boolean) || [];
    return [...new Set(periodos)].sort();
  };


  const hasPassword = (company: any) => {
    return company.company_passwords && company.company_passwords.id !== null;
  };

  const handleCompanyClick = (company: any) => {
    // Se a empresa tem senha, sempre abrir modal de autenticação
    if (hasPassword(company)) {
      setPasswordAuthCompany({ id: company.id, name: company.name });
      setIsAuthModalOpen(true);
      return;
    }
    
    // Prosseguir normalmente (empresa sem senha)
    onSelectCompany(company.id);
  };

  const handlePasswordSuccess = () => {
    if (passwordAuthCompany) {
      onSelectCompany(passwordAuthCompany.id);
    }
    setPasswordAuthCompany(null);
    setIsAuthModalOpen(false);
  };

  const handlePasswordCancel = () => {
    setPasswordAuthCompany(null);
    setIsAuthModalOpen(false);
  };

  const clearAuthentication = (companyName: string) => {
    localStorage.removeItem(`company_auth_${companyName}`);
    // Recarregar a página para atualizar o estado
    window.location.reload();
  };

  // Funções para gerenciar regimes
  const getRegimeLabel = (regime: string) => {
    const labels = {
      'todas': 'Todas as empresas',
      'lucro_real': 'Lucro Real',
      'lucro_presumido': 'Lucro Presumido',
      'simples_nacional': 'Simples Nacional',
      'normais': 'Normais (Lucro Real + Lucro Presumido)'
    };
    return labels[regime as keyof typeof labels] || regime;
  };

  const getRegimeCompanies = (regime: string) => {
    if (!companies) return [];
    
    // Para simular a integração com os dados da aba "Definir Regime das Empresas"
    // Aqui você pode integrar com o estado global ou contexto que armazena os regimes
    // Por enquanto, vou usar uma lógica de exemplo baseada no CNPJ
    
    switch (regime) {
      case 'todas':
        return companies;
      case 'lucro_real':
        // Exemplo: empresas com CNPJ terminando em 1, 2, 3
        return companies.filter(company => 
          company.cnpj && ['1', '2', '3'].includes(company.cnpj.slice(-1))
        );
      case 'lucro_presumido':
        // Exemplo: empresas com CNPJ terminando em 4, 5, 6
        return companies.filter(company => 
          company.cnpj && ['4', '5', '6'].includes(company.cnpj.slice(-1))
        );
      case 'simples_nacional':
        // Exemplo: empresas com CNPJ terminando em 7, 8, 9
        return companies.filter(company => 
          company.cnpj && ['7', '8', '9'].includes(company.cnpj.slice(-1))
        );
      case 'normais':
        // Lucro Real + Lucro Presumido
        return companies.filter(company => 
          company.cnpj && ['1', '2', '3', '4', '5', '6'].includes(company.cnpj.slice(-1))
        );
      default:
        return companies;
    }
  };

  const handleRegimeSelection = (regime: string) => {
    setSelectedRegime(regime);
  };

  const handleBackToRegimeSelection = () => {
    setSelectedRegime(null);
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

  // Tela inicial de seleção de regime
  if (!selectedRegime) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Empresas
          </h1>
          <p className="text-muted-foreground">
            Selecione o regime tributário para visualizar as empresas correspondentes
          </p>
        </div>

        {/* Cards de seleção de regime */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'todas', label: 'Todas as empresas', description: 'Visualizar todas as empresas cadastradas', icon: Building2, color: 'blue' },
            { id: 'lucro_real', label: 'Lucro Real', description: 'Empresas do regime de Lucro Real', icon: FileText, color: 'green' },
            { id: 'lucro_presumido', label: 'Lucro Presumido', description: 'Empresas do regime de Lucro Presumido', icon: FileText, color: 'orange' },
            { id: 'simples_nacional', label: 'Simples Nacional', description: 'Empresas do regime Simples Nacional', icon: FileText, color: 'purple' },
            { id: 'normais', label: 'Normais', description: 'Lucro Real + Lucro Presumido', icon: FileText, color: 'indigo' }
          ].map((regime) => {
            const IconComponent = regime.icon;
            const companyCount = getRegimeCompanies(regime.id).length;
            
            return (
              <Card 
                key={regime.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/50"
                onClick={() => handleRegimeSelection(regime.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg bg-${regime.color}-100 dark:bg-${regime.color}-900/20`}>
                      <IconComponent className={`h-6 w-6 text-${regime.color}-600 dark:text-${regime.color}-400`} />
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {companyCount} empresa{companyCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-2">{regime.label}</h3>
                  <p className="text-sm text-muted-foreground">{regime.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Estatísticas gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumo Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{companies?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{getRegimeCompanies('lucro_real').length}</p>
                <p className="text-sm text-muted-foreground">Lucro Real</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{getRegimeCompanies('lucro_presumido').length}</p>
                <p className="text-sm text-muted-foreground">Lucro Presumido</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{getRegimeCompanies('simples_nacional').length}</p>
                <p className="text-sm text-muted-foreground">Simples Nacional</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{getRegimeCompanies('normais').length}</p>
                <p className="text-sm text-muted-foreground">Normais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToRegimeSelection}
                className="flex items-center gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                Voltar
              </Button>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                {getRegimeLabel(selectedRegime)} ({filteredAndSortedCompanies?.length || 0})
              </CardTitle>
            </div>
          </div>
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
                <div className="space-y-2">
                  <Label htmlFor="segmento">Segmento</Label>
                  <Input
                    id="segmento"
                    {...register('segmento')}
                    placeholder="Ex: Tecnologia, Varejo, Serviços (opcional)"
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
        
        <div className="flex flex-col gap-4">
          {/* Barra de busca e filtros principais */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por empresa ou CNPJ..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as situações</SelectItem>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="paralizada">Paralizadas</SelectItem>
                  <SelectItem value="sem_movimento">Sem Movimento</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="rbt12">RBT12</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="imposto">Imposto</SelectItem>
                  <SelectItem value="periodo">Período</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros Avançados</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8 px-2 text-xs"
                      >
                        Limpar tudo
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">RBT12 (R$)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            placeholder="Mínimo"
                            value={filters.rbt12Min}
                            onChange={(e) => updateFilter('rbt12Min', e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Máximo"
                            value={filters.rbt12Max}
                            onChange={(e) => updateFilter('rbt12Max', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Período</Label>
                        <Select value={filters.periodo} onValueChange={(value) => updateFilter('periodo', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecionar período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos os períodos</SelectItem>
                            {getPeriodos().map(periodo => (
                              <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Indicadores de filtros ativos */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Busca: {filters.search}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('search', '')}
                  />
                </Badge>
              )}
              {filters.status !== 'todas' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {
                    filters.status === 'ativa' ? 'Ativas' : 
                    filters.status === 'paralizada' ? 'Paralizadas' : 
                    'Sem Movimento'
                  }
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('status', 'todas')}
                  />
                </Badge>
              )}
              {(filters.rbt12Min || filters.rbt12Max) && (
                <Badge variant="secondary" className="gap-1">
                  RBT12: {filters.rbt12Min || '0'} - {filters.rbt12Max || '∞'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      updateFilter('rbt12Min', '');
                      updateFilter('rbt12Max', '');
                    }}
                  />
                </Badge>
              )}
              {filters.periodo !== 'todos' && (
                <Badge variant="secondary" className="gap-1">
                  Período: {filters.periodo}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('periodo', 'todos')}
                  />
                </Badge>
              )}
            </div>
          )}
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
                <TableHead className="border-r border-border font-semibold text-foreground w-28 hidden sm:table-cell">Segmento</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden sm:table-cell">Período</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden md:table-cell">RBT12</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden lg:table-cell">Entrada</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden lg:table-cell">Saída</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">Imposto</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-24">Situação</TableHead>
                <TableHead className="w-12 font-semibold text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCompanies?.map((company, index) => (
                <TableRow 
                  key={company.id}
                  className="cursor-pointer hover:bg-accent transition-colors border-b border-border bg-muted/30"
                  onClick={() => handleCompanyClick(company)}
                >
                  <TableCell className="border-r border-border text-center text-muted-foreground font-mono text-sm w-8">
                    {index + 1}
                  </TableCell>
                  <TableCell className="border-r border-border font-medium text-foreground min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{company.name}</span>
                      {hasPassword(company) && (
                        <div className="flex items-center gap-1">
                          <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" title="Empresa protegida por senha" />
                        </div>
                      )}
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
                  <TableCell className="border-r border-border text-foreground w-28 hidden sm:table-cell">
                    <span className="truncate block text-xs">
                      {company.segmento || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-foreground w-24 hidden sm:table-cell">
                    <span className="truncate block text-xs">
                      {hasPassword(company) ? (
                        <span className="text-muted-foreground">***</span>
                      ) : company.latest_fiscal_data?.period || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-right text-foreground w-20 hidden md:table-cell">
                    <span className="truncate block text-xs">
                      {hasPassword(company) ? (
                        <span className="text-muted-foreground">***</span>
                      ) : company.latest_fiscal_data?.rbt12 ? 
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
                      {hasPassword(company) ? (
                        <span className="text-muted-foreground">***</span>
                      ) : company.latest_fiscal_data?.entrada ? 
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
                      {hasPassword(company) ? (
                        <span className="text-muted-foreground">***</span>
                      ) : company.latest_fiscal_data?.saida ? 
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
                      {hasPassword(company) ? (
                        <span className="text-muted-foreground">***</span>
                      ) : company.latest_fiscal_data?.imposto ? 
                        company.latest_fiscal_data.imposto.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }) : 'N/A'
                      }
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
              {filteredAndSortedCompanies?.length === 0 && (
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
          <div className="space-y-2">
            <Label htmlFor="edit-segmento">Segmento</Label>
            <Input
              id="edit-segmento"
              {...registerEdit('segmento')}
              placeholder="Ex: Tecnologia, Varejo, Serviços (opcional)"
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

    {/* Modal de autenticação por senha */}
    <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Acesso Restrito
          </DialogTitle>
          <DialogDescription>
            Esta empresa requer senha para visualizar os dados
          </DialogDescription>
        </DialogHeader>
        {passwordAuthCompany && (
          <CompanyPasswordAuth
            companyName={passwordAuthCompany.name}
            companyId={passwordAuthCompany.id}
            onSuccess={handlePasswordSuccess}
            onCancel={handlePasswordCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  </div>
  );
};