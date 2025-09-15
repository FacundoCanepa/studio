
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AuthCard } from './auth-card';
import { AuthContext } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
    message: "Las contraseñas no coinciden.",
    path: ["passwordConfirmation"],
});

type FormData = z.infer<typeof formSchema>;

export const ResetPasswordForm = () => {
  const { resetPassword } = React.useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const code = searchParams.get('code');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      passwordConfirmation: '',
    },
  });

  React.useEffect(() => {
    if (!code) {
        setError('El código de restablecimiento no es válido o ha expirado.');
        toast({
            title: 'Error',
            description: 'Falta el código de restablecimiento en la URL.',
            variant: 'destructive',
        });
    }
  }, [code, toast]);

  const onSubmit = async (data: FormData) => {
    if (!code) return;

    setLoading(true);
    try {
      await resetPassword(code, data.password, data.passwordConfirmation);
      toast({
        title: '¡Contraseña Actualizada!',
        description: 'Ya puedes iniciar sesión con tu nueva contraseña.',
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        title: 'Error al restablecer',
        description: error.message || 'No se pudo cambiar la contraseña.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
         <AuthCard
            title="Error de Restablecimiento"
            description={error}
        >
             <div className="text-center">
                <Button asChild variant="outline">
                    <Link href="/forgot-password">Solicitar un nuevo enlace</Link>
                </Button>
            </div>
        </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Restablecer Contraseña"
      description="Crea una nueva contraseña para tu cuenta."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
           <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="passwordConfirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading || !code}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar contraseña
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
};
