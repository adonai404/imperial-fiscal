import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCompanyWithData, useAddFiscalData, useImportCompanyExcel, useUpdateFiscalData, useDeleteFiscalData } from '@/hooks/useFiscalData';
import { Download, ArrowUpDown, Building2, Calculator, Plus, Upload, FileDown, X, Edit3, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';

// Helper function to parse fiscal period to Date for comparison
const parsePeriodToDate = (period: string): Date => {
  if (!period || period.trim() === '') {
    return new Date(0);
  }

  const periodStr = period.toLowerCase().trim();
  
  const monthNames: { [key: string]: number } = {
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'marco': 2, 'abril': 3,
    'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
    'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11,
    'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
  };

  const patterns = [
    /^([a-zç]+)\/(\d{4})$/,
    /^([a-zç]+)\/(\d{4})$/,
    /^(\d{1,2})\/(\d{4})$/,
    /^(\d{4})-(\d{1,2})$/,
    /^([a-zç]+)\s+(\d{4})$/,
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

      if (monthNames[match[1]]) {
        month = monthNames[match[1]];
      } else {
        const numericMonth = parseInt(match[1], 10);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          month = numericMonth - 1;
        } else {
          continue;
        }
      }

      return new Date(year, month, 1);
    }
  }

  const fallbackDate = new Date(period);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }

  return new Date(0);
};

interface CompanyDetailsProps {
  companyId: string;
}

interface AddFiscalDataForm {
  period: string;
  rbt12: string;
  entrada: string;
  saida: string;
  imposto: string;
}

interface EditFiscalDataForm {
  period: string;
  rbt12: string;
  entrada: string;
  saida: string;
  imposto: string;
}

export const CompanyDetails = ({ companyId }: CompanyDetailsProps) => {
  const { data: company, isLoading } = useCompanyWithData(companyId);
  const [sortField, setSortField] = useState<'period' | 'entrada' | 'saida' | 'imposto'>('period');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFiscalData, setEditingFiscalData] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addFiscalDataMutation = useAddFiscalData();
  const updateFiscalDataMutation = useUpdateFiscalData();
  const deleteFiscalDataMutation = useDeleteFiscalData();
  const importExcelMutation = useImportCompanyExcel();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddFiscalDataForm>();
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue, formState: { errors: editErrors } } = useForm<EditFiscalDataForm>();

  const availableYears = useMemo(() => {
    if (!company?.fiscal_data) return [];
    
    const years = new Set<string>();
    company.fiscal_data.forEach(item => {
      const yearMatch = item.period.match(/\d{4}/);
      if (yearMatch) {
        years.add(yearMatch[0]);
      }
    });
    
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [company?.fiscal_data]);

  const sortedAndFilteredData = useMemo(() => {
    if (!company?.fiscal_data) return [];

    let filtered = company.fiscal_data;
    
    if (filterPeriod) {
      filtered = filtered.filter(item => 
        item.period.toLowerCase().includes(filterPeriod.toLowerCase())
      );
    }
    
    if (filterYear) {
      filtered = filtered.filter(item => 
        item.period.includes(filterYear)
      );
    }

    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'period':
          aValue = parsePeriodToDate(a.period).getTime();
          bValue = parsePeriodToDate(b.period).getTime();
          break;
        case 'entrada':
          aValue = a.entrada || 0;
          bValue = b.entrada || 0;
          break;
        case 'saida':
          aValue = a.saida || 0;
          bValue = b.saida || 0;
          break;
        case 'imposto':
          aValue = a.imposto || 0;
          bValue = b.imposto || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [company?.fiscal_data, sortField, sortDirection, filterPeriod, filterYear]);

  const totals = useMemo(() => {
    if (!sortedAndFilteredData) return { entrada: 0, saida: 0, imposto: 0, rbt12: 0 };
    
    return sortedAndFilteredData.reduce(
      (acc, curr) => ({
        entrada: acc.entrada + (curr.entrada || 0),
        saida: acc.saida + (curr.saida || 0),
        imposto: acc.imposto + (curr.imposto || 0),
        rbt12: acc.rbt12 + (curr.rbt12 || 0),
      }),
      { entrada: 0, saida: 0, imposto: 0, rbt12: 0 }
    );
  }, [sortedAndFilteredData]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleAddFiscalData = (data: AddFiscalDataForm) => {
    addFiscalDataMutation.mutate({
      company_id: companyId,
      period: data.period,
      rbt12: parseFloat(data.rbt12) || 0,
      entrada: parseFloat(data.entrada) || 0,
      saida: parseFloat(data.saida) || 0,
      imposto: parseFloat(data.imposto) || 0,
    }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        reset();
      }
    });
  };

  const handleEditFiscalData = (data: EditFiscalDataForm) => {
    if (!editingFiscalData) return;
    
    updateFiscalDataMutation.mutate({
      id: editingFiscalData.id,
      period: data.period,
      rbt12: parseFloat(data.rbt12) || 0,
      entrada: parseFloat(data.entrada) || 0,
      saida: parseFloat(data.saida) || 0,
      imposto: parseFloat(data.imposto) || 0,
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingFiscalData(null);
        resetEdit();
      }
    });
  };

  const openEditDialog = (fiscalData: any) => {
    setEditingFiscalData(fiscalData);
    setValue('period', fiscalData.period);
    setValue('rbt12', fiscalData.rbt12?.toString() || '');
    setValue('entrada', fiscalData.entrada?.toString() || '');
    setValue('saida', fiscalData.saida?.toString() || '');
    setValue('imposto', fiscalData.imposto?.toString() || '');
    setIsEditDialogOpen(true);
  };

  const handleDeleteFiscalData = (fiscalDataId: string) => {
    deleteFiscalDataMutation.mutate(fiscalDataId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>Empresa não encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {company.name}
            </div>
            <div className="flex gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Dados
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Dados Fiscais</DialogTitle>
                    <DialogDescription>
                      Preencha os dados fiscais para {company.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(handleAddFiscalData)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="period">Período *</Label>
                      <Input
                        id="period"
                        {...register('period', { required: 'Período é obrigatório' })}
                        placeholder="Ex: Janeiro/2024"
                      />
                      {errors.period && (
                        <p className="text-sm text-destructive">{errors.period.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rbt12">RBT12</Label>
                        <Input
                          id="rbt12"
                          type="number"
                          step="0.01"
                          {...register('rbt12')}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entrada">Entrada</Label>
                        <Input
                          id="entrada"
                          type="number"
                          step="0.01"
                          {...register('entrada')}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="saida">Saída</Label>
                        <Input
                          id="saida"
                          type="number"
                          step="0.01"
                          {...register('saida')}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="imposto">Imposto</Label>
                        <Input
                          id="imposto"
                          type="number"
                          step="0.01"
                          {...register('imposto')}
                          placeholder="0.00"
                        />
                      </div>
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
                        disabled={addFiscalDataMutation.isPending}
                      >
                        {addFiscalDataMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">RBT12</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                  <TableHead className="text-right">Saída</TableHead>
                  <TableHead className="text-right">Imposto</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.period}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.rbt12 || 0)}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400">
                      {formatCurrency(item.entrada || 0)}
                    </TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">
                      {formatCurrency(item.saida || 0)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600 dark:text-orange-400">
                      {formatCurrency(item.imposto || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                          onClick={() => openEditDialog(item)}
                          title="Editar dados fiscais"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              title="Excluir dados fiscais"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir os dados fiscais do período "{item.period}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFiscalData(item.id)}
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
                {sortedAndFilteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Calculator className="h-12 w-12 mx-auto mb-4" />
                      <p>Nenhum dado fiscal encontrado</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal de Edição dos Dados Fiscais */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Dados Fiscais</DialogTitle>
            <DialogDescription>
              Altere os dados fiscais de {company?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(handleEditFiscalData)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-period">Período *</Label>
              <Input
                id="edit-period"
                {...registerEdit('period', { required: 'Período é obrigatório' })}
                placeholder="Ex: Janeiro/2024"
              />
              {editErrors.period && (
                <p className="text-sm text-destructive">{editErrors.period.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-rbt12">RBT12</Label>
                <Input
                  id="edit-rbt12"
                  type="number"
                  step="0.01"
                  {...registerEdit('rbt12')}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-entrada">Entrada</Label>
                <Input
                  id="edit-entrada"
                  type="number"
                  step="0.01"
                  {...registerEdit('entrada')}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-saida">Saída</Label>
                <Input
                  id="edit-saida"
                  type="number"
                  step="0.01"
                  {...registerEdit('saida')}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-imposto">Imposto</Label>
                <Input
                  id="edit-imposto"
                  type="number"
                  step="0.01"
                  {...registerEdit('imposto')}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingFiscalData(null);
                  resetEdit();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateFiscalDataMutation.isPending}
              >
                {updateFiscalDataMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
