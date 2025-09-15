
import * as React from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Ingresa a tu cuenta de Vestigio Magazine.',
};

export default function LoginPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[70vh] px-4">
      <LoginForm />
    </div>
  );
}
