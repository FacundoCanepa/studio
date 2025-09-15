import {NextResponse} from 'next/server';
import {clearSessionCookie} from '@/lib/api-utils';

export async function POST() {
  try {
    const cookie = clearSessionCookie();
    const response = NextResponse.json({message: 'Cierre de sesión exitoso.'});
    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error('[API_LOGOUT_ERROR]', error);
    return NextResponse.json(
      {error: 'Ocurrió un error en el servidor.'},
      {status: 500}
    );
  }
}
