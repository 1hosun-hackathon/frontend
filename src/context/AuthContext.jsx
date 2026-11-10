import React, { createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const routerNavigate = useNavigate();
  const { pathname } = useLocation();
  const navigate = (target) => {
    routerNavigate(target);
    window.scrollTo(0, 0);
  };
  const auth = useAuth(navigate);
  const submitAuth = (e) => auth.submitAuth(e, pathname === '/signup');
  return (
    <AuthContext.Provider value={{ ...auth, navigate, submitAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider가 필요합니다.');
  return ctx;
}
