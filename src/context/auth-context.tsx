
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<any>;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (code: string, password: string, passwordConfirmation: string) => Promise<any>;
  setSessionFromToken: (token: string) => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  setSessionFromToken: async () => {},
});

const errorMessages: { [key: string]: string } = {
  validation_error: 'Por favor revisa los datos ingresados.',
  invalid_credentials: 'Email o contraseña incorrectos.',
  unauthorized: 'No estás autorizado para realizar esta acción.',
  email_in_use: 'Este correo electrónico ya está en uso.',
  username_in_use: 'Este nombre de usuario ya está en uso.',
  internal_server_error: 'Ocurrió un error inesperado en el servidor.',
  unknown_strapi_error: 'Error inesperado del servicio de autenticación.',
  csrf_token_invalid: 'El token de seguridad no es válido. Recarga la página.',
  csrf_token_missing: 'El token de seguridad falta. Recarga la página.',
  csrf_token_mismatch: 'El token de seguridad no coincide. Recarga la página.',
  rate_limit_exceeded: 'Demasiados intentos. Por favor, espera un momento.',
  cors_denied: 'Tu solicitud fue bloqueada por políticas de seguridad.',
  default: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const csrfTokenRef = React.useRef<string | null>(null);
  const csrfPromiseRef = React.useRef<Promise<string | null> | null>(null);
  const router = useRouter();

  const getCsrfToken = React.useCallback(async () => {
    console.log('[CSRF] Requesting token...');
    if (csrfTokenRef.current) {
        console.log('[CSRF] Returning cached token.');
        return csrfTokenRef.current;
    }
    if (csrfPromiseRef.current) {
        console.log('[CSRF] Waiting for in-flight token request.');
        return await csrfPromiseRef.current;
    }

    csrfPromiseRef.current = (async () => {
        try {
            const res = await fetch('/api/csrf', { credentials: 'include' });
            if (!res.ok) throw new Error(`Failed to fetch CSRF token. Status: ${res.status}`);
            const data = await res.json();
            if (data.data?.token) {
                console.log('[CSRF] Token fetched and cached successfully.');
                csrfTokenRef.current = data.data.token;
                return data.data.token;
            }
            console.error('[CSRF] Token not found in response body:', data);
            return null;
        } catch (error) {
            console.error('[CSRF] Critical error fetching token:', error);
            return null;
        } finally {
            csrfPromiseRef.current = null;
        }
    })();
    
    return await csrfPromiseRef.current;
  }, []);

  const fetchUser = React.useCallback(async () => {
    try {
      const res = await fetch('/api/session/me', { cache: 'no-store', credentials: 'include' });
      if (res.ok) {
        const { data } = await res.json();
        setUser(data);
        console.log('[AUTH_PROVIDER] User fetched successfully:', data);
      } else {
        setUser(null);
        console.log('[AUTH_PROVIDER] No active session found.');
      }
    } catch (error) {
      console.error('[AUTH_PROVIDER] Fetch user error:', error);
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    const initializeSession = async () => {
        console.log('[AUTH_PROVIDER] Initializing session...');
        setIsLoading(true);
        await Promise.all([getCsrfToken(), fetchUser()]);
        setIsLoading(false);
        console.log('[AUTH_PROVIDER] Session initialization complete.');
    }
    initializeSession();
  }, [getCsrfToken, fetchUser]);

  const performRequest = async (url: string, options: RequestInit = {}, requiresCsrf = false) => {
    console.log(`[PERFORM_REQUEST] Starting request to ${url}`, { requiresCsrf });
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (requiresCsrf) {
      const token = await getCsrfToken();
      if (!token) {
          console.error(`[PERFORM_REQUEST] CSRF token is missing for protected route ${url}.`);
          throw new Error("El token de seguridad no está disponible. Por favor, recarga la página.");
      }
      headers['x-csrf-token'] = token;
      console.log(`[PERFORM_REQUEST] Attached CSRF token to header for ${url}.`);
    }
    
    let res: Response;
    try {
        res = await fetch(url, { ...options, headers, credentials: 'include' });
    } catch(networkError) {
        console.error(`[PERFORM_REQUEST] Network error for ${url}:`, networkError);
        throw new Error("No se pudo conectar con el servicio. Revisa tu conexión a internet.");
    }
    
    console.log(`[PERFORM_REQUEST] Response from ${url} - Status: ${res.status}`);

    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        data = await res.json();
    } else {
        const textResponse = await res.text();
        console.error(`[PERFORM_REQUEST] Non-JSON response from ${url}:`, { status: res.status, body: textResponse });
        throw new Error("El servicio de autenticación no respondió correctamente.");
    }
    
    console.log(`[PERFORM_REQUEST] JSON Response body from ${url}:`, data);

    if (!res.ok || data.ok === false) {
      const code = data.error?.code || 'default';
      const message = errorMessages[code as keyof typeof errorMessages] || data.error?.message || errorMessages.default;
      console.error(`[PERFORM_REQUEST] API error from ${url}:`, { code, message, originalError: data.error });
      throw new Error(message);
    }

    return data.data;
  };

  const login = async (identifier: string, password: string) => {
    const data = await performRequest('/api/session/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }, true);
    setUser(data);
    return data;
  };
  
  const register = (username: string, email: string, password: string) => {
    return performRequest('/api/session/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
    }, true);
  };
  
  const logout = async () => {
    try {
      await performRequest('/api/session/logout', { method: 'POST' }, true);
    } catch (error) {
       console.error("[AUTH_PROVIDER] Logout failed server-side, but clearing client session anyway.", error);
    } finally {
      setUser(null);
      csrfTokenRef.current = null;
      console.log('[AUTH_PROVIDER] User logged out, session cleared.');
      router.push('/');
      router.refresh();
    }
  };

  const forgotPassword = (email: string) => {
    return performRequest('/api/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, true);
  };

  const resetPassword = (code: string, password: string, passwordConfirmation: string) => {
    return performRequest('/api/password/reset', {
      method: 'POST',
      body: JSON.stringify({ code, password, passwordConfirmation }),
    }, true);
  };
  
  const setSessionFromToken = async (token: string) => {
    console.log('[AUTH_PROVIDER] Attempting to set session from social token.');
    const data = await performRequest('/api/session/set', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }, true);
    setUser(data);
    console.log('[AUTH_PROVIDER] Session set successfully from social token. User:', data);
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        setSessionFromToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
