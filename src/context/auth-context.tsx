
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
  csrfToken: string | null;
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
  csrfToken: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  setSessionFromToken: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [csrfToken, setCsrfToken] = React.useState<string | null>(null);
  const router = useRouter();

  const fetchCsrfToken = React.useCallback(async () => {
    try {
      const res = await fetch('/api/csrf');
      const data = await res.json();
      if (res.ok) {
        setCsrfToken(data.csrfToken);
      } else {
        throw new Error(data.error || 'Failed to fetch CSRF token');
      }
    } catch (error) {
      console.error('CSRF token fetch error:', error);
    }
  }, []);

  const fetchUser = React.useCallback(async () => {
    try {
      const res = await fetch('/api/session/me');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
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
    fetchCsrfToken();
    fetchUser();
  }, [fetchCsrfToken, fetchUser]);
  
  const performRequest = async (url: string, options: RequestInit = {}) => {
      if (!csrfToken && options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
          throw new Error('CSRF token not available. Please try again.');
      }
      
      const res = await fetch(url, {
          ...options,
          headers: {
              'Content-Type': 'application/json',
              ...(options.method !== 'GET' && { 'x-csrf-token': csrfToken! }),
              ...options.headers,
          },
      });

      const data = await res.json();

      if (!res.ok) {
          throw new Error(data.error || 'Ocurrió un error.');
      }

      return data;
  };

  const login = async (identifier: string, password: string) => {
    const data = await performRequest('/api/session/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setUser(data);
    await fetchCsrfToken(); // Refresh CSRF token after login
  };
  
  const register = async (username: string, email: string, password: string) => {
    return performRequest('/api/session/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
    });
  };
  
  const logout = async () => {
    await performRequest('/api/session/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
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
    await fetchCsrfToken(); // Refresh CSRF token
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        csrfToken,
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
