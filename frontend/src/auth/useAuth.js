import { useContext } from 'react';
import { AuthCtx } from './AuthContext.jsx';

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
