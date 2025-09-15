
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
    if (csrfTokenRef.current) {
        return csrfTokenRef.current;
    }
    // If a request for the token is already in flight, wait for it to complete
    if (csrfPromiseRef.current) {
        return await csrfPromiseRef.current;
    }

    // Otherwise, start a new request
    csrfPromiseRef.current = (async () => {
        try {
            const res = await fetch('/api/csrf', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch CSRF token');
            const data = await res.json();
            if (data.data?.token) {
                csrfTokenRef.current = data.data.token;
                return data.data.token;
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch CSRF token:', error);
            return null;
        } finally {
            // Reset the promise ref so a new request can be made if this one failed
            csrfPromiseRef.current = null;
        }
    })();
    
    return await csrfPromiseRef.current;
  }, []);

  const fetchUser = React.useCallback(async () => {
    try {
      // credentials: 'include' is vital for sending the HttpOnly session cookie
      const res = await fetch('/api/session/me', { cache: 'no-store', credentials: 'include' });
      if (res.ok) {
        const { data } = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      setUser(null);
    }
  }, []);

  // On initial load, fetch user and CSRF token
  React.useEffect(() => {
    const initializeSession = async () => {
        setIsLoading(true);
        await Promise.all([getCsrfToken(), fetchUser()]);
        setIsLoading(false);
    }
    initializeSession();
  }, [getCsrfToken, fetchUser]);

  const performRequest = async (url: string, options: RequestInit = {}, requiresCsrf = false) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (requiresCsrf) {
      const token = await getCsrfToken(); // Ensures we wait for the token if needed
      if (!token) {
          throw new Error("El token de seguridad no está disponible. Por favor, recarga la página.");
      }
      headers['x-csrf-token'] = token;
    }
    
    let res: Response;
    try {
        // credentials: 'include' sends cookies (both session and CSRF) with the request
        res = await fetch(url, { ...options, headers, credentials: 'include' });
    } catch(networkError) {
        console.error("Network error during fetch:", networkError);
        throw new Error("No se pudo conectar con el servicio. Revisa tu conexión a internet.");
    }
    
    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        data = await res.json();
    } else {
        const textResponse = await res.text();
        console.error("Non-JSON response from API:", { status: res.status, body: textResponse });
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
       console.error("Logout failed but clearing session on client.", error);
    } finally {
      setUser(null);
      csrfTokenRef.current = null; // Clear CSRF token on logout
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
