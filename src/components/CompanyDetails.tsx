import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCompanyWithData, useAddFiscalData, useImportCompanyExcel } from '@/hooks/useFiscalData';
import { Download, ArrowUpDown, Building2, Calculator, Plus, Upload, FileDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';

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

export const CompanyDetails = ({ companyId }: CompanyDetailsProps) => {
  const { data: company, isLoading } = useCompanyWithData(companyId);
  const [sortField, setSortField] = useState<'period' | 'entrada' | 'saida' | 'imposto'>('period');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addFiscalDataMutation = useAddFiscalData();
  const importExcelMutation = useImportCompanyExcel();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddFiscalDataForm>();

  const sortedAndFilteredData = useMemo(() => {
    if (!company?.fiscal_data) return [];

    let filtered = company.fiscal_data;
    if (filterPeriod) {
      filtered = filtered.filter(item => 
        item.period.toLowerCase().includes(filterPeriod.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'period':
          aValue = a.period;
          bValue = b.period;
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
  }, [company?.fiscal_data, sortField, sortDirection, filterPeriod]);

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

  const exportToExcel = () => {
    if (!company || !sortedAndFilteredData) return;

    const exportData = sortedAndFilteredData.map(item => ({
      'Empresa': company.name,
      'CNPJ': company.cnpj || 'N/A',
      'Período': item.period,
      'RBT12': item.rbt12,
      'Entrada': item.entrada,
      'Saída': item.saida,
      'Imposto': item.imposto,
    }));

    // Add totals row
    exportData.push({
      'Empresa': 'TOTAL',
      'CNPJ': '',
      'Período': '',
      'RBT12': totals.rbt12,
      'Entrada': totals.entrada,
      'Saída': totals.saida,
      'Imposto': totals.imposto,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados Fiscais');
    
    const fileName = `${company.name.replace(/[^\w\s]/gi, '')}_dados_fiscais.xlsx`;
    XLSX.writeFile(workbook, fileName);
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

  const downloadTemplate = () => {
    const template = [
      {
        'Período': 'Janeiro/2024',
        'RBT12': 1000000,
        'Entrada': 500000,
        'Saída': 300000,
        'Imposto': 50000,
      },
      {
        'Período': 'Fevereiro/2024',
        'RBT12': 1100000,
        'Entrada': 550000,
        'Saída': 320000,
        'Imposto': 55000,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    XLSX.writeFile(workbook, 'template_dados_fiscais.xlsx');
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const mappedData = jsonData.map((row: any) => ({
          periodo: row['Período'] || row['periodo'] || row['Period'] || '',
          rbt12: parseFloat(row['RBT12'] || row['rbt12'] || '0') || null,
          entrada: parseFloat(row['Entrada'] || row['entrada'] || row['Entry'] || '0') || null,
          saida: parseFloat(row['Saída'] || row['saida'] || row['Exit'] || '0') || null,
          imposto: parseFloat(row['Imposto'] || row['imposto'] || row['Tax'] || '0') || null,
        }));

        importExcelMutation.mutate({ companyId, data: mappedData });
      } catch (error) {
        console.error('Error reading file:', error);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsArrayBuffer(file);
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
              <Button onClick={downloadTemplate} variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                Baixar Template
              </Button>
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline" 
                size="sm"
                disabled={isImporting}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Importando...' : 'Importar Excel'}
              </Button>
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
              <Button onClick={exportToExcel} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </CardTitle>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
          <p className="text-sm text-muted-foreground">
            CNPJ: {company.cnpj 
              ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
              : 'N/A'
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-700">Total Entradas</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totals.entrada)}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-700">Total Saídas</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totals.saida)}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-700">Total Impostos</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(totals.imposto)}</p>
            </div>
          </div>

          {sortedAndFilteredData.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Evolução das Entradas e Saídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sortedAndFilteredData.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => 
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(value)
                        }
                      />
                      <Tooltip 
                        formatter={(value: number) => [
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(value)
                        ]}
                        labelFormatter={(label) => `Período: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="entrada" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Entradas"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="saida" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Saídas"
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="Filtrar por período..."
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="max-w-xs"
            />
            <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
              const [field, direction] = value.split('-') as [typeof sortField, typeof sortDirection];
              setSortField(field);
              setSortDirection(direction);
            }}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="period-desc">Período (Mais recente)</SelectItem>
                <SelectItem value="period-asc">Período (Mais antigo)</SelectItem>
                <SelectItem value="entrada-desc">Entrada (Maior)</SelectItem>
                <SelectItem value="entrada-asc">Entrada (Menor)</SelectItem>
                <SelectItem value="saida-desc">Saída (Maior)</SelectItem>
                <SelectItem value="saida-asc">Saída (Menor)</SelectItem>
                <SelectItem value="imposto-desc">Imposto (Maior)</SelectItem>
                <SelectItem value="imposto-asc">Imposto (Menor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('period')}
                      className="h-auto p-0 font-semibold"
                    >
                      Período
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">RBT12</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('entrada')}
                      className="h-auto p-0 font-semibold"
                    >
                      Entrada
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('saida')}
                      className="h-auto p-0 font-semibold"
                    >
                      Saída
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('imposto')}
                      className="h-auto p-0 font-semibold"
                    >
                      Imposto
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.period}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.rbt12 || 0)}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(item.entrada || 0)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(item.saida || 0)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatCurrency(item.imposto || 0)}
                    </TableCell>
                  </TableRow>
                ))}
                {sortedAndFilteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
    </div>
  );
};