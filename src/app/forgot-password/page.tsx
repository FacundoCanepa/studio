
import * as React from 'react';
import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Recuperar Contraseña',
  description: 'Recupera el acceso a tu cuenta de Vestigio Magazine.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[70vh] px-4">
      <ForgotPasswordForm />
    </div>
  );
}
