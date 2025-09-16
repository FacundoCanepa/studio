
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { ArticleDoc } from '@/lib/firestore-types';

interface User {
  id: number;
  username: string;
  email: string;
  favoriteArticles: number[];
  favoriteTags: number[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<any>;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
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
  login: async () => {},
  register: async () => {},
  logout: async () => {},
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
  csrf_token_invalid: 'El token de seguridad no es válido. Recarga la página.',
  csrf_token_missing: 'Falta el token de seguridad. Por favor, recarga la página.',
  csrf_token_mismatch: 'El token de seguridad no coincide. Por favor, recarga la página.',
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
    if (csrfTokenRef.current) return csrfTokenRef.current;
    if (csrfPromiseRef.current) return await csrfPromiseRef.current;

    csrfPromiseRef.current = (async () => {
        try {
            const res = await fetch('/api/csrf', { cache: 'no-store' });
            if (!res.ok) throw new Error(`Failed to fetch CSRF token. Status: ${res.status}`);
            const data = await res.json();
            if (data.data?.token) {
                csrfTokenRef.current = data.data.token;
                return data.data.token;
            }
            throw new Error('CSRF token not found in response');
        } catch (error) {
            console.error('[CSRF] Critical error fetching token:', error);
            return null; // Return null on failure
        } finally {
            csrfPromiseRef.current = null;
        }
    })();
    
    return await csrfPromiseRef.current;
  }, []);

  const fetchUser = React.useCallback(async () => {
    try {
      const res = await fetch('/api/session/me', { cache: 'no-store' });
      if (res.ok) {
        const { data } = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[AUTH_PROVIDER] Fetch user error:', error);
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    const initializeSession = async () => {
        setIsLoading(true);
        await fetchUser();
        setIsLoading(false);
    }
    initializeSession();
  }, [fetchUser]);

  const performRequest = async (url: string, options: RequestInit = {}, requiresCsrf = false) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (requiresCsrf) {
      const token = await getCsrfToken();
      if (!token) {
          throw new Error("El token de seguridad no está disponible. Por favor, recarga la página.");
      }
      headers['x-csrf-token'] = token;
    }
    
    let res: Response;
    try {
        res = await fetch(url, { ...options, headers });
    } catch(networkError) {
        throw new Error("No se pudo conectar con el servicio. Revisa tu conexión a internet.");
    }

    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        try {
            data = await res.json();
        } catch (e) {
            throw new Error("La respuesta del servidor no es válida.");
        }
    } else {
        throw new Error("El servicio de autenticación no respondió correctamente.");
    }
    
    if (!res.ok || data.ok === false) {
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

  const isFavorite = (articleId: number) => {
    return user?.favoriteArticles?.includes(articleId) ?? false;
  };

  const toggleFavorite = async (articleId: number): Promise<boolean> => {
    if (!user) {
        throw new Error('Debes iniciar sesión para guardar favoritos.');
    }
    const data = await performRequest('/api/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({ articleId }),
    }, true);

    const newFavoriteList = data.favoriteArticles;
    setUser(prev => prev ? { ...prev, favoriteArticles: newFavoriteList } : null);
    
    return newFavoriteList.includes(articleId);
  };

  const isTagFavorite = (tagId: number) => {
    return user?.favoriteTags?.includes(tagId) ?? false;
  };

  const toggleTagFavorite = async (tagId: number): Promise<boolean> => {
    if (!user) {
        throw new Error('Debes iniciar sesión para guardar favoritos.');
    }
    const data = await performRequest('/api/favorites/toggle-tag', {
        method: 'POST',
        body: JSON.stringify({ tagId }),
    }, true);

    const newFavoriteList = data.favoriteTags;
    setUser(prev => prev ? { ...prev, favoriteTags: newFavoriteList } : null);
    
    return newFavoriteList.includes(tagId);
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
