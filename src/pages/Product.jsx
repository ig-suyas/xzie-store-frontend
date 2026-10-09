import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeftIcon as ArrowLeft, ArrowsOutSimpleIcon as ArrowsOutSimple, XIcon as X } from '@phosphor-icons/react';
import { useApp } from '../auth';
import { imageUrl } from '../api';
import { ErrorState, Img, Skeleton, Stepper, money, useFetch } from '../ui';

function Lightbox({ src, name, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Close image"><X size={22} /></button>
      <motion.img src={src} alt={name} initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} onClick={(e) => e.stopPropagation()} />
    </motion.div>
  );
}

export default function Product() {
  const { id } = useParams(); const nav = useNavigate();
  const { data: p, error, loading, reload } = useFetch(`/api/products/${id}`);
  const { user, addToCart, toast } = useApp();
  const [qty, setQty] = useState(1); const [busy, setBusy] = useState(false); const [open, setOpen] = useState(false);

  if (loading) return <div className="page detail"><div className="sk" style={{ aspectRatio: '1', borderRadius: 18 }} /><div style={{ display: 'grid', gap: 14, alignContent: 'start' }}><Skeleton h={40} w="70%" /><Skeleton h={26} w="30%" /><Skeleton h={90} /></div></div>;
  if (error) return <div className="page"><ErrorState error={error} retry={reload} /></div>;

  const add = async () => {
    if (!user) return nav('/login', { state: { from: `/product/${id}` } });
    setBusy(true);
    try { await addToCart(p.id, qty); toast('Added to cart'); } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  };
  const src = p.hasImage ? imageUrl(p.id) : null;

  return (
    <div className="page">
      <Link to="/" className="back"><ArrowLeft size={16} /> All products</Link>
      <div className="detail">
        <button className={`zoom ${src ? '' : 'nozoom'}`} onClick={() => src && setOpen(true)} aria-label={src ? 'View larger image' : p.name}>
          <Img src={src} name={p.name} />
          {src && <span className="zoom-hint"><ArrowsOutSimple size={18} /></span>}
        </button>
        <div className="info">
          <span className="cat">{p.category}</span>
          <h1>{p.name}</h1>
          <div className="price">{money(p.price)}</div>
          <p className="desc">{p.description}</p>
          <p className="muted meta">{p.stock > 0 ? `${p.stock} in stock` : 'Currently sold out'}{p.sellerName && `. Sold by ${p.sellerName}`}</p>
          {(!user || user.role === 'USER') && (
            <div className="buy">
              <Stepper value={qty} onDec={() => setQty(Math.max(1, qty - 1))} onInc={() => setQty(Math.min(p.stock || 1, qty + 1))} />
              <button className="btn lg" disabled={busy || p.stock === 0} onClick={add}>{busy ? 'Adding…' : 'Add to cart'}</button>
            </div>)}
        </div>
      </div>
      <AnimatePresence>{open && src && <Lightbox src={src} name={p.name} onClose={() => setOpen(false)} />}</AnimatePresence>
    </div>
  );
}