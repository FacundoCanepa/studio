
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toggleFavoriteAction, toggleTagFavoriteAction } from '@/app/actions/favoriteActions';
import memoFetch, { invalidateMemoFetch } from '@/lib/memo-fetch';
interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  favoriteArticles: number[];
  favoriteTags: number[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  login: (identifier: string, password: string) => Promise<any>;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (code: string, password: string, passwordConfirmation: string) => Promise<any>;
  toggleFavorite: (articleId: number) => Promise<boolean>;
  isFavorite: (articleId: number) => boolean;
  toggleTagFavorite: (tagId: number) => Promise<boolean>;
  isTagFavorite: (tagId: number) => boolean;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  isEmployee: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  toggleFavorite: async () => false,
  isFavorite: () => false,
  toggleTagFavorite: async () => false,
  isTagFavorite: () => false,
});

const errorMessages: { [key: string]: string } = {
  validation_error: 'Por favor revisa los datos ingresados.',
  invalid_credentials: 'Email o contraseña incorrectos.',
  unauthorized: 'No estás autorizado para realizar esta acción.',
  email_in_use: 'Este correo electrónico ya está en uso.',
  username_in_use: 'Este nombre de usuario ya está en uso.',
  internal_server_error: 'Ocurrió un error inesperado en el servidor.',
  unknown_strapi_error: 'Error inesperado del servicio de autenticación.',
  rate_limit_exceeded: 'Demasiados intentos. Por favor, espera un momento.',
  default: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();


  const sessionRequestInit = React.useMemo<RequestInit>(() => ({ cache: 'no-store' }), []);

  const fetchUser = React.useCallback(
    async ({ forceRefresh = false }: { forceRefresh?: boolean } = {}) => {
      setIsLoading(true);
      try {
        const res = await memoFetch(
          '/api/session/me',
          sessionRequestInit,
          { ttl: 60_000, forceRefresh }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data.id) {
            setUser({
              ...data.data,
              role: data.data.role || 'Authenticated'
            });
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('[AUTH_PROVIDER] Fetch user error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionRequestInit]
  );

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const performRequest = async (url: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    let res: Response;
    try {
        res = await fetch(url, { ...options, headers, cache: 'no-store' });
    } catch(networkError) {
        console.error(`[AUTH_PROVIDER] Network error for ${url}:`, networkError);
        throw new Error("No se pudo conectar con el servicio. Revisa tu conexión a internet.");
    }

    let data;
    try {
        data = await res.json();
    } catch (e) {
        console.error(`[AUTH_PROVIDER] JSON parse error for ${url}:`, e);
        throw new Error("La respuesta del servidor no es válida.");
    }
    
    if (!res.ok || data.ok === false) {
      const code = data.error?.code || 'default';
      const message = errorMessages[code as keyof typeof errorMessages] || data.error?.message || errorMessages.default;
      console.error(`[AUTH_PROVIDER] API error for ${url}:`, { code, message, details: data.error?.details });
      throw new Error(message);
    }

    return data.data;
  };

  const login = async (identifier: string, password: string) => {
    const data = await performRequest('/api/session/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    await fetchUser({ forceRefresh: true }); // Re-fetch user to update state globally/ Re-fetch user to update state globally
    return data;
  };
  
  const register = (username: string, email: string, password: string) => {
    return performRequest('/api/session/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
    });
  };
  
  const logout = async () => {
    await performRequest('/api/session/logout', { method: 'POST' });
    invalidateMemoFetch('/api/session/me', sessionRequestInit);
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const forgotPassword = (email: string) => {
    return performRequest('/api/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };

  const resetPassword = (code: string, password: string, passwordConfirmation: string) => {
    return performRequest('/api/password/reset', {
      method: 'POST',
      body: JSON.stringify({ code, password, passwordConfirmation }),
    });
  };

  const isFavorite = (articleId: number) => {
    return user?.favoriteArticles?.includes(articleId) ?? false;
  };

  const toggleFavorite = async (articleId: number): Promise<boolean> => {
    if (!user) {
        throw new Error('Debes iniciar sesión para guardar favoritos.');
    }
    
    try {
        const data = await toggleFavoriteAction(articleId);
        const newFavoriteList = data.favoriteArticles;
        setUser(prev => prev ? { ...prev, favoriteArticles: newFavoriteList } : null);
        return newFavoriteList.includes(articleId);
    } catch (error: any) {
        console.error('[AuthContext] Error calling toggle favorite action:', error);
        throw new Error(error.message || 'No se pudo actualizar tu lista de favoritos.');
    }
  };

  const isTagFavorite = (tagId: number) => {
    return user?.favoriteTags?.includes(tagId) ?? false;
  };

  const toggleTagFavorite = async (tagId: number): Promise<boolean> => {
    if (!user) {
        throw new Error('Debes iniciar sesión para guardar favoritos.');
    }
    
    try {
        const data = await toggleTagFavoriteAction(tagId);
        const newFavoriteList = data.favoriteTags;
        setUser(prev => prev ? { ...prev, favoriteTags: newFavoriteList } : null);
        return newFavoriteList.includes(tagId);
    } catch (error: any) {
        console.error('[AuthContext] Error calling toggle tag favorite action:', error);
        throw new Error(error.message || 'No se pudo actualizar tu lista de temas favoritos.');
    }
  };
  
  const isAdmin = user?.role === 'Admins';
  const isEmployee = user?.role === 'Empleado';
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isEmployee,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        toggleFavorite,
        isFavorite,
        toggleTagFavorite,
        isTagFavorite,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
