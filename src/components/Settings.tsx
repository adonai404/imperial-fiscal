import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCompaniesWithLatestFiscalData, useSetCompanyPassword, useRemoveCompanyPassword } from '@/hooks/useFiscalData';
import { Settings as SettingsIcon, Lock, Key, Building2, Trash2, Shield, Search, Filter, Eye, EyeOff, AlertTriangle, Users, Database } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';

interface SettingsProps {}

interface PasswordForm {
  password: string;
  confirmPassword: string;
}

export const Settings = ({}: SettingsProps) => {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'protected' | 'unprotected'>('all');
  const [showPassword, setShowPassword] = useState(false);
  const { data: companies, isLoading } = useCompaniesWithLatestFiscalData();
  const setPasswordMutation = useSetCompanyPassword();
  const removePasswordMutation = useRemoveCompanyPassword();
  
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<PasswordForm>();
  const password = watch('password');

  const handleSetPassword = (company: any) => {
    setSelectedCompany({ id: company.id, name: company.name });
    setIsPasswordDialogOpen(true);
  };

  const handleRemovePassword = (company: any) => {
    removePasswordMutation.mutate(company.id);
  };

  const onSubmitPassword = (data: PasswordForm) => {
    if (!selectedCompany) return;

    if (data.password !== data.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setPasswordMutation.mutate({
      companyId: selectedCompany.id,
      password: data.password
    }, {
      onSuccess: () => {
        setIsPasswordDialogOpen(false);
        setSelectedCompany(null);
        reset();
      }
    });
  };


  const hasPassword = (company: any) => {
    return company.company_passwords && company.company_passwords.id !== null;
  };

  // Filtrar empresas
  const filteredCompanies = companies?.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.cnpj && company.cnpj.includes(searchTerm));
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'protected' && hasPassword(company)) ||
                         (filterStatus === 'unprotected' && !hasPassword(company));
    
    return matchesSearch && matchesFilter;
  }) || [];

  // Calcular estatísticas
  const totalCompanies = companies?.length || 0;
  const protectedCompanies = companies?.filter(hasPassword).length || 0;
  const unprotectedCompanies = totalCompanies - protectedCompanies;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Configurações
          </CardTitle>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie as configurações de segurança e acesso do sistema
        </p>
      </div>

      {/* Estatísticas de Segurança */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Empresas</p>
                <p className="text-2xl font-bold">{totalCompanies}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empresas Protegidas</p>
                <p className="text-2xl font-bold text-green-600">{protectedCompanies}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sem Proteção</p>
                <p className="text-2xl font-bold text-orange-600">{unprotectedCompanies}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Gerenciamento de Senhas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Gerenciamento de Senhas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure senhas de acesso para proteger os dados das empresas. Empresas com senha definida 
            exigirão autenticação para visualizar seus dados.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Todas ({totalCompanies})
              </Button>
              <Button
                variant={filterStatus === 'protected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('protected')}
                className="text-green-600"
              >
                Protegidas
              </Button>
              <Button
                variant={filterStatus === 'unprotected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('unprotected')}
                className="text-orange-600"
              >
                Sem Proteção
              </Button>
            </div>
          </div>

          <Separator />

          {/* Tabela de Empresas */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold">CNPJ</TableHead>
                  <TableHead className="font-semibold">Status de Segurança</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {company.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {company.cnpj 
                          ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                          : 'N/A'
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      {hasPassword(company) ? (
                        <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                          <Lock className="h-3 w-3" />
                          Protegida
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-200">
                          <Key className="h-3 w-3" />
                          Sem senha
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPassword(company)}
                          className="text-xs"
                        >
                          {hasPassword(company) ? 'Alterar Senha' : 'Definir Senha'}
                        </Button>
                        {hasPassword(company) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remover
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover senha</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover a senha da empresa "{company.name}"? 
                                  Após a remoção, os dados da empresa ficarão acessíveis sem autenticação.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemovePassword(company)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover Senha
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Não há empresas cadastradas no sistema.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para definir/alterar senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {selectedCompany?.name && hasPassword(companies?.find(c => c.id === selectedCompany.id))
                ? 'Alterar Senha' 
                : 'Definir Senha'
              }
            </DialogTitle>
            <DialogDescription>
              {selectedCompany?.name && hasPassword(companies?.find(c => c.id === selectedCompany.id))
                ? `Altere a senha de acesso para a empresa "${selectedCompany.name}".`
                : `Defina uma senha de acesso para a empresa "${selectedCompany?.name}".`
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-6">
            {/* Informações da Empresa */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedCompany?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCompany?.id ? `ID: ${selectedCompany.id.slice(0, 8)}...` : ''}
                </p>
              </div>
            </div>

            {/* Campos de Senha */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register('password', { 
                      required: 'Senha é obrigatória',
                      minLength: { value: 4, message: 'Senha deve ter pelo menos 4 caracteres' },
                      maxLength: { value: 50, message: 'Senha deve ter no máximo 50 caracteres' }
                    })}
                    placeholder="Digite a senha"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  {...register('confirmPassword', { 
                    required: 'Confirmação de senha é obrigatória',
                    validate: value => value === password || 'As senhas não coincidem'
                  })}
                  placeholder="Confirme a senha"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Informações de Segurança */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Importante:</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Após definir a senha, os dados desta empresa ficarão protegidos e será necessário 
                    inserir a senha sempre que quiser visualizar os dados.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  setSelectedCompany(null);
                  reset();
                  setShowPassword(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={setPasswordMutation.isPending}
                className="min-w-[120px]"
              >
                {setPasswordMutation.isPending ? 'Salvando...' : 'Salvar Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
