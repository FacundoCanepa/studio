
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
  default: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [csrfToken, setCsrfToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  const getCsrfToken = React.useCallback(async () => {
    try {
      const res = await fetch('/api/csrf');
      const data = await res.json();
      if (data.token) {
        setCsrfToken(data.token);
        return data.token;
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token', error);
    }
    return null;
  }, []);

  const fetchUser = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/session/me', { cache: 'no-store' });
      if (res.ok) {
        const { data } = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    getCsrfToken();
    fetchUser();
  }, [getCsrfToken, fetchUser]);

  const performRequest = async (url: string, options: RequestInit = {}, requiresCsrf = false) => {
    let currentCsrfToken = csrfToken;
    if (requiresCsrf && !currentCsrfToken) {
      currentCsrfToken = await getCsrfToken();
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (requiresCsrf && currentCsrfToken) {
      headers['x-csrf-token'] = currentCsrfToken;
    }
    
    const res = await fetch(url, { ...options, headers });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error("Failed to parse JSON response:", await res.text());
      throw new Error("El servicio de autenticación no está disponible en este momento.");
    }
    
    if (!res.ok) {
      const code = data.error?.code || 'default';
      const message = errorMessages[code as keyof typeof errorMessages] || data.error?.message || errorMessages.default;
      throw new Error(message);
    }

    return data.data;
  };

  const login = (identifier: string, password: string) => {
    return performRequest('/api/session/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }, true).then(data => {
        setUser(data);
        return data;
    });
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
       console.error("Logout failed but clearing session on client.", error);
    } finally {
      setUser(null);
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
    const data = await performRequest('/api/session/set', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }, true);
    setUser(data);
    router.refresh(); // Refresh to update server-side state if needed
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
