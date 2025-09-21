import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { useVerifyCompanyPassword } from '@/hooks/useFiscalData';

interface CompanyPasswordAuthProps {
  companyName: string;
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PasswordForm {
  password: string;
}

export const CompanyPasswordAuth = ({ companyName, companyId, onSuccess, onCancel }: CompanyPasswordAuthProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordForm>();
  const verifyPasswordMutation = useVerifyCompanyPassword();

  const onSubmit = async (data: PasswordForm) => {
    setError(null);
    
    verifyPasswordMutation.mutate({
      companyId,
      password: data.password
    }, {
      onSuccess: (isValid) => {
        if (isValid) {
          // Senha correta - não salvar no localStorage para sempre exigir senha
          onSuccess();
          toast({
            title: "Acesso autorizado",
            description: `Acesso aos dados da empresa ${companyName} foi liberado.`,
          });
        } else {
          setError('Senha incorreta. Verifique a senha e tente novamente.');
        }
      },
      onError: () => {
        setError('Erro ao verificar senha. Tente novamente.');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="font-medium">{companyName}</span>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Senha de Acesso</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register('password', { 
                required: 'Senha é obrigatória',
                minLength: { value: 1, message: 'Senha não pode estar vazia' }
              })}
              placeholder="Digite a senha da empresa"
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

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={verifyPasswordMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={verifyPasswordMutation.isPending}
          >
            {verifyPasswordMutation.isPending ? 'Verificando...' : 'Acessar'}
          </Button>
        </div>
      </form>
    </div>
  );
};
