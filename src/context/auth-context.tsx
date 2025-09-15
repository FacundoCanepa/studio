
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
  setSessionFromToken: (token: string) => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => { return {} },
  logout: async () => {},
  setSessionFromToken: async () => {},
});

const errorMessages: { [key: string]: string } = {
  invalid_credentials: 'Email o contraseña incorrectos.',
  email_in_use: 'Este correo electrónico ya está en uso.',
  username_in_use: 'Este nombre de usuario ya está en uso.',
  validation_error: 'Por favor revisa los datos ingresados.',
  strapi_error: 'Ocurrió un error inesperado al comunicarnos con el servidor.',
  internal_server_error: 'Ocurrió un error inesperado en el servidor.',
  default: 'Ocurrió un error. Por favor, intenta de nuevo.',
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

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
    fetchUser();
  }, [fetchUser]);
  
  const performRequest = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      // Si la respuesta no es un JSON válido, lanzamos un error genérico
      console.error("Failed to parse JSON response:", e);
      throw new Error(errorMessages.default);
    }

    if (!res.ok) {
        const code = data.error?.code || 'default';
        const message = errorMessages[code as keyof typeof errorMessages] || data.error?.message || errorMessages.default;
        throw new Error(message);
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
        setSessionFromToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
