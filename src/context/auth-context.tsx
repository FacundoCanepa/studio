
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
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (code: string, password: string, passwordConfirmation: string) => Promise<void>;
  setSessionFromToken: (token: string) => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => { return {} },
  logout: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  setSessionFromToken: async () => {},
});

const errorMessages: { [key: string]: string } = {
  invalid_credentials: 'Email o contraseña incorrectos.',
  email_in_use: 'Ese email ya está registrado.',
  username_in_use: 'Ese nombre de usuario ya está en uso.',
  unauthorized: 'Necesitas iniciar sesión para realizar esta acción.',
  rate_limited: 'Demasiados intentos. Por favor, inténtalo de nuevo en un minuto.',
  csrf_token_mismatch: 'El token de seguridad no es válido. Por favor, recarga la página.',
  internal_server_error: 'Ocurrió un error inesperado en el servidor.',
  default: 'Ocurrió un error. Por favor, intenta de nuevo.',
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [csrfToken, setCsrfToken] = React.useState<string | null>(null);
  const router = useRouter();

  const fetchCsrfToken = React.useCallback(async () => {
    try {
      const res = await fetch('/api/csrf');
      const data = await res.json();
      if (res.ok && data.data.token) {
        setCsrfToken(data.data.token);
        return data.data.token;
      }
      throw new Error('Failed to fetch CSRF token');
    } catch (error) {
      console.error('CSRF token fetch error:', error);
      // Optional: show a global error to the user that the app can't be secured
      return null;
    }
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
    const initializeSession = async () => {
      await fetchCsrfToken();
      await fetchUser();
    };
    initializeSession();
  }, [fetchCsrfToken, fetchUser]);
  
  const performRequest = async (url: string, options: RequestInit = {}) => {
    let currentCsrfToken = csrfToken;
    
    // For mutating requests, ensure we have a fresh CSRF token.
    if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
        currentCsrfToken = await fetchCsrfToken();
        if (!currentCsrfToken) {
            throw new Error('csrf_token_mismatch');
        }
    }
    
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.method !== 'GET' && { 'x-csrf-token': currentCsrfToken! }),
            ...options.headers,
        },
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      // If the response is not valid JSON (e.g., HTML error page)
      throw new Error('default');
    }

    if (!res.ok) {
        const errorCode = data.code || 'default';
        throw new Error(errorMessages[errorCode] || errorMessages.default);
    }

    return data.data;
  };

  const login = async (identifier: string, password: string) => {
    const data = await performRequest('/api/session/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setUser(data);
  };
  
  const register = async (username: string, email: string, password: string) => {
    return performRequest('/api/session/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
    });
  };
  
  const logout = async () => {
    try {
      await performRequest('/api/session/logout', { method: 'POST' });
    } catch (error) {
       console.error("Logout failed, clearing session on client anyway.", error);
    } finally {
      setUser(null);
      router.push('/');
      router.refresh();
    }
  };

  const forgotPassword = async (email: string) => {
      return performRequest('/api/password/forgot', {
          method: 'POST',
          body: JSON.stringify({ email }),
      });
  };

  const resetPassword = async (code: string, password: string, passwordConfirmation: string) => {
      return performRequest('/api/password/reset', {
          method: 'POST',
          body: JSON.stringify({ code, password, passwordConfirmation }),
      });
  };
  
  const setSessionFromToken = async (token: string) => {
    const data = await performRequest('/api/session/set', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
    setUser(data);
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
        setSessionFromToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
