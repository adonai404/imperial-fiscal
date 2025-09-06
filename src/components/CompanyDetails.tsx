import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompanyWithData } from '@/hooks/useFiscalData';
import { Download, ArrowUpDown, Building2, Calculator } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CompanyDetailsProps {
  companyId: string;
}

export const CompanyDetails = ({ companyId }: CompanyDetailsProps) => {
  const { data: company, isLoading } = useCompanyWithData(companyId);
  const [sortField, setSortField] = useState<'period' | 'entrada' | 'saida' | 'imposto'>('period');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterPeriod, setFilterPeriod] = useState('');

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
            <Button onClick={exportToExcel} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            CNPJ: {company.cnpj 
              ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
              : 'N/A'
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Total RBT12</p>
              <p className="text-lg font-bold">{formatCurrency(totals.rbt12)}</p>
            </div>
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