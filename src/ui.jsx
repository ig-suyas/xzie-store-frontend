import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MinusIcon as Minus, PlusIcon as Plus, TrayIcon as Tray, WarningCircleIcon as WarningCircle, XIcon as X } from '@phosphor-icons/react';
import { api } from './api';

export const money = (n) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: import.meta.env.VITE_CURRENCY || 'INR' }).format(n ?? 0);

export function useFetch(path) {
  const [s, set] = useState({ data: null, error: null, loading: true });
  const load = useCallback(() => {
    set((x) => ({ ...x, loading: true, error: null }));
    api(path).then((data) => set({ data, error: null, loading: false }))
      .catch((error) => set({ data: null, error, loading: false }));
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { ...s, reload: load };
}

export const Skeleton = ({ h = 16, w = '100%', r = 10 }) => <div className="sk" style={{ height: h, width: w, borderRadius: r }} />;

export const CardSkeletons = ({ n = 8 }) => (
  <div className="grid">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} style={{ display: 'grid', gap: 10 }}>
        <div className="sk" style={{ aspectRatio: '4/5', borderRadius: 18 }} />
        <Skeleton w="65%" h={14} /><Skeleton w="30%" h={14} />
      </div>
    ))}
  </div>
);

export const Empty = ({ title, text, children }) => (
  <div className="state"><Tray size={34} className="state-art" /><h3>{title}</h3><p>{text}</p>{children}</div>
);

export const ErrorState = ({ error, retry }) => (
  <div className="state err"><WarningCircle size={34} className="state-art" />
    <h3>{error?.status === 403 ? "You don't have access to this" : 'Something went wrong'}</h3>
    <p>{error?.message}</p>{retry && <button className="btn" onClick={retry}>Try again</button>}</div>
);

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div className="modal" role="dialog" aria-modal="true" aria-label={title}
            initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>{title}</h3><button className="icon" onClick={onClose} aria-label="Close"><X /></button></div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const Stepper = ({ value, onDec, onInc }) => (
  <div className="stepper">
    <button onClick={onDec} aria-label="Decrease quantity"><Minus size={14} /></button>
    <span>{value}</span>
    <button onClick={onInc} aria-label="Increase quantity"><Plus size={14} /></button>
  </div>
);

export const Badge = ({ s }) => <span className={`badge ${String(s).toLowerCase()}`}>{s}</span>;
export const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function Img({ src, name, ...p }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) return <div className="ph" {...p}>{(name || '?')[0]}</div>;
  return <img src={src} alt={name} loading="lazy" onError={() => setBad(true)} {...p} />;
}
