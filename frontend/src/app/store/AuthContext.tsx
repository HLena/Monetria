import React, { createContext, useContext, useState } from 'react';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (_email: string, _password: string): Promise<void> => {
    // BACKEND INTEGRATION — uncomment and adapt when your API is ready:
    //
    // const res = await fetch('/api/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email: _email, password: _password }),
    // });
    // if (!res.ok) throw new Error('Credenciales inválidas');
    // const { user, token } = await res.json();
    // localStorage.setItem('auth_token', token);
    // setUser(user);
  };

  const register = async (
    _firstName: string,
    _lastName: string,
    _email: string,
    _password: string,
  ): Promise<void> => {
    // BACKEND INTEGRATION — uncomment and adapt when your API is ready:
    //
    // const res = await fetch('/api/auth/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     firstName: _firstName,
    //     lastName: _lastName,
    //     email: _email,
    //     password: _password,
    //   }),
    // });
    // if (!res.ok) throw new Error('No se pudo crear la cuenta');
    // const { user, token } = await res.json();
    // localStorage.setItem('auth_token', token);
    // setUser(user);
  };

  const logout = (): void => {
    setUser(null);
    // BACKEND INTEGRATION — uncomment and adapt when your API is ready:
    //
    // localStorage.removeItem('auth_token');
    // await fetch('/api/auth/logout', { method: 'POST' }); // optional — if your backend has a logout endpoint
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
