
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AuthCard } from './auth-card';
import { AuthContext } from '@/context/auth-context';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  identifier: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(1, { message: 'La contraseña es requerida.' }),
});

type FormData = z.infer<typeof formSchema>;

export const LoginForm = () => {
  const { login } = React.useContext(AuthContext);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.identifier, data.password);
      toast({
        title: '¡Bienvenido de vuelta!',
      });
      // Redirect to home page, the context will handle the user state update.
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Error al iniciar sesión',
        description: error.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Iniciar Sesión"
      description="Ingresa a tu cuenta para continuar."
      footerContent={
        <div className="text-center text-sm w-full">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
                Crea una
            </Link>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="tu@email.com" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                 <div className="flex items-center justify-between">
                    <FormLabel>Contraseña</FormLabel>
                    <Link href="/forgot-password" passHref>
                        <span className="text-sm font-medium text-primary hover:underline">
                            ¿Olvidaste?
                        </span>
                    </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="********" 
                      {...field} 
                      disabled={loading} 
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
};
