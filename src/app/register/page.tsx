
import * as React from 'react';
import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Crear Cuenta',
  description: 'Únete a la comunidad de Vestigio Magazine.',
};

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[70vh] px-4">
      <RegisterForm />
    </div>
  );
}
