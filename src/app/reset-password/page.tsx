
import * as React from 'react';
import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Restablecer Contraseña',
  description: 'Crea una nueva contraseña para tu cuenta de Vestigio Magazine.',
};

export default function ResetPasswordPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[70vh] px-4">
      <ResetPasswordForm />
    </div>
  );
}
