import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFiscalEvolutionData } from '@/hooks/useFiscalData';
import { TrendingUp, TrendingDown, DollarSign, Filter, X } from 'lucide-react';

const chartConfig = {
  entrada: {
    label: 'Entradas',
    color: 'hsl(var(--chart-1))',
    theme: {
      light: 'hsl(142, 76%, 36%)',
      dark: 'hsl(142, 70%, 45%)',
    },
  },
  saida: {
    label: 'Saídas',
    color: 'hsl(var(--chart-2))',
    theme: {
      light: 'hsl(0, 84%, 60%)',
      dark: 'hsl(0, 84%, 60%)',
    },
  },
  imposto: {
    label: 'Impostos',
    color: 'hsl(var(--chart-3))',
    theme: {
      light: 'hsl(38, 92%, 50%)',
      dark: 'hsl(38, 92%, 50%)',
    },
  },
};

interface FiscalEvolutionChartProps {
  className?: string;
}

export const FiscalEvolutionChart = ({ className }: FiscalEvolutionChartProps) => {
  const { data: evolutionData, isLoading, error } = useFiscalEvolutionData();
  const [yearFilter, setYearFilter] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);

  const availableYears = useMemo(() => {
    if (!evolutionData) return [];
    
    const years = new Set<string>();
    evolutionData.forEach(item => {
      const year = item.period.split('/').pop() || item.period.split('-')[0];
      if (year && year.length === 4) {
        years.add(year);
      }
    });
    
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [evolutionData]);

  const chartData = useMemo(() => {
    if (!evolutionData) return [];

    let filteredData = evolutionData;
    
    if (yearFilter !== 'todos') {
      filteredData = evolutionData.filter(item => 
        item.period.includes(yearFilter)
      );
    }

    return filteredData.map(item => ({
      period: item.period,
      entrada: item.entrada,
      saida: item.saida,
      imposto: item.imposto,
      saldo: item.entrada - item.saida,
    }));
  }, [evolutionData, yearFilter]);

  const totals = useMemo(() => {
    if (!chartData.length) return { entrada: 0, saida: 0, imposto: 0, saldo: 0 };
    
    return chartData.reduce(
      (acc, curr) => ({
        entrada: acc.entrada + curr.entrada,
        saida: acc.saida + curr.saida,
        imposto: acc.imposto + curr.imposto,
        saldo: acc.saldo + curr.saldo,
      }),
      { entrada: 0, saida: 0, imposto: 0, saldo: 0 }
    );
  }, [chartData]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-destructive">Erro ao carregar dados do gráfico</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Nenhum dado disponível para exibir</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Fiscal
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {(yearFilter !== 'todos') && (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full"></div>
              )}
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filtrar por Ano</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os anos</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setYearFilter('todos');
                    setShowFilters(false);
                  }}
                  className="h-10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Total Entradas
            </div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {totals.entrada.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              Total Saídas
            </div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {totals.saida.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              Total Impostos
            </div>
            <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {totals.imposto.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Saldo Líquido
            </div>
            <div className={`text-lg font-semibold ${totals.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totals.saldo.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              className="text-xs fill-muted-foreground"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tickFormatter={(value) => 
                value.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })
              }
            />
            <ChartTooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [
                  (value as number).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }),
                  chartConfig[name as keyof typeof chartConfig]?.label || name
                ]}
              />} 
            />
            <ChartLegend 
              content={<ChartLegendContent nameKey="dataKey" />}
              className="mt-4"
            />
            <Line
              type="monotone"
              dataKey="entrada"
              stroke="var(--color-entrada)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-entrada)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--color-entrada)', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="saida"
              stroke="var(--color-saida)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-saida)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--color-saida)', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="imposto"
              stroke="var(--color-imposto)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-imposto)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--color-imposto)', strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
