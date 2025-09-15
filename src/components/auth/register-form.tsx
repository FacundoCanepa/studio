
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AuthCard } from './auth-card';
import { SocialButtons } from './social-buttons';
import { AuthContext } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  username: z.string().min(3, { message: 'El usuario debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
});

type FormData = z.infer<typeof formSchema>;

export const RegisterForm = () => {
  const { register } = React.useContext(AuthContext);
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await register(data.username, data.email, data.password);
      // Asumimos que la confirmación por email está activada en Strapi
      if (response?.user?.confirmed === false) {
        setSuccess(true); // Muestra mensaje de "revisa tu correo"
      } else {
         toast({
            title: '¡Registro Exitoso!',
            description: 'Ahora puedes iniciar sesión con tus credenciales.',
        });
        router.push('/login');
      }
    } catch (error: any) {
      toast({
        title: 'Error en el registro',
        description: error.message || 'No se pudo completar el registro.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard
        title="¡Último paso!"
        description="Hemos enviado un enlace de confirmación a tu correo."
      >
        <p className="text-sm text-muted-foreground text-center">
          Por favor, revisa tu bandeja de entrada (y la carpeta de spam) para activar tu cuenta.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Crear una Cuenta"
      description="Únete a la comunidad de Vestigio."
      footerContent={
        <div className="text-center text-sm w-full">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
                Inicia sesión
            </Link>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de Usuario</FormLabel>
                <FormControl>
                  <Input placeholder="tu_usuario" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
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
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear cuenta
          </Button>
        </form>
      </Form>
      <SocialButtons disabled={loading} />
    </AuthCard>
  );
};
