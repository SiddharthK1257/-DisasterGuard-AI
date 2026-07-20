import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string, skills: string[]) => Promise<void>;
  logout: () => void;
  updateUserContext: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('disasterguard_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('disasterguard_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.warn('Authentication token invalid or expired. Logging out.');
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: loggedUser } = res.data;
      
      localStorage.setItem('disasterguard_token', receivedToken);
      setToken(receivedToken);
      setUser(loggedUser);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: string, skills: string[]) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password, role, skills });
      const { token: receivedToken, user: registeredUser } = res.data;
      
      localStorage.setItem('disasterguard_token', receivedToken);
      setToken(receivedToken);
      setUser(registeredUser);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('disasterguard_token');
    setToken(null);
    setUser(null);
  };

  const updateUserContext = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
