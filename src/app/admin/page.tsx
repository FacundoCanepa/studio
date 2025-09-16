
import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // Redirige a la página principal del dashboard por defecto
  redirect('/admin/dashboard');
}
