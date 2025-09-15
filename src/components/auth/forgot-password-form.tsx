
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
import { AuthContext } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
});

type FormData = z.infer<typeof formSchema>;

export const ForgotPasswordForm = () => {
  const { forgotPassword } = React.useContext(AuthContext);
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await forgotPassword(data.email);
      setSubmitted(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar el email de recuperación.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (submitted) {
    return (
        <AuthCard
            title="Revisa tu Correo"
            description="Hemos enviado las instrucciones para restablecer tu contraseña."
        >
            <p className="text-center text-sm text-muted-foreground">
                Si el correo electrónico que proporcionaste está asociado con una cuenta, recibirás un enlace para continuar.
            </p>
        </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Recuperar Contraseña"
      description="Ingresa tu email para recibir un enlace de recuperación."
      footerContent={
        <div className="text-center text-sm w-full">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
                Inicia sesión
            </Link>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar enlace
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
};
