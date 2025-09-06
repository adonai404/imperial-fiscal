import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFiscalStats } from '@/hooks/useFiscalData';
import { Building2, FileText, TrendingUp, TrendingDown, Calculator, Activity, Upload } from 'lucide-react';

export const Dashboard = () => {
  const { data: stats, isLoading, error } = useFiscalStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Erro ao carregar estatísticas</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const saldoLiquido = (stats?.entrada || 0) - (stats?.saida || 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div>
            <p className="text-xs text-muted-foreground">
              empresas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRecords || 0}</div>
            <p className="text-xs text-muted-foreground">
              períodos fiscais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.entrada || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              receitas acumuladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats?.saida || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              despesas acumuladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impostos</CardTitle>
            <Calculator className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats?.imposto || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              impostos pagos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saldo Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoLiquido)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {saldoLiquido >= 0 ? 'Resultado positivo' : 'Resultado negativo'} (Entradas - Saídas)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-sm text-green-600 font-medium">Ativo</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Última importação:</span>
              <span className="text-sm text-muted-foreground">
                {stats?.totalRecords ? 'Dados disponíveis' : 'Nenhuma importação'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cobertura fiscal:</span>
              <span className="text-sm text-muted-foreground">
                {stats?.totalRecords} períodos
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats?.totalRecords === 0 && (
        <Card className="border-dashed">
          <CardContent className="text-center py-8">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Bem-vindo ao Sistema Fiscal</h3>
            <p className="text-muted-foreground mb-4">
              Para começar, importe seus dados fiscais através da aba "Importação"
            </p>
            <p className="text-sm text-muted-foreground">
              Aceita arquivos Excel com dados de empresas, CNPJ, períodos e valores fiscais
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};