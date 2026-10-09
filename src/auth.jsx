import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, setUnauthHandler } from './api';
import { Skeleton } from './ui';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState([]);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'ok') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token'); setUser(null); setCart([]);
  }, []);

  const loadUser = useCallback(async () => {
    if (!localStorage.getItem('token')) { setReady(true); return; }
    try { setUser(await api('/api/me')); } catch { logout(); }
    setReady(true);
  }, [logout]);

  useEffect(() => { setUnauthHandler(logout); loadUser(); }, [loadUser, logout]);

  const signIn = async (token) => { localStorage.setItem('token', token); await loadUser(); };

  const refreshCart = useCallback(async () => {
    try { setCart(await api('/api/cart')); } catch { /* handled by 401 hook */ }
  }, []);
  useEffect(() => { if (user?.role === 'USER') refreshCart(); }, [user, refreshCart]);

  const addToCart = async (productId, quantity = 1) => {
    await api('/api/cart', { method: 'POST', body: { productId, quantity } });
    await refreshCart();
  };
  const setQty = async (itemId, quantity) => {
    await api(`/api/cart/${itemId}`, { method: 'PUT', body: { quantity } }); await refreshCart();
  };
  const removeItem = async (itemId) => {
    await api(`/api/cart/${itemId}`, { method: 'DELETE' }); await refreshCart();
  };

  return (
    <Ctx.Provider value={{ user, ready, signIn, logout, cart, refreshCart, addToCart, setQty, removeItem, toast }}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
      </div>
    </Ctx.Provider>
  );
}

export function Guard({ roles, children }) {
  const { user, ready } = useApp();
  const loc = useLocation();
  if (!ready) return <div className="page"><Skeleton h={320} r={16} /></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
