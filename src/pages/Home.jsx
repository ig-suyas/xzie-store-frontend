import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MagnifyingGlassIcon as MagnifyingGlass, PlusIcon as Plus } from '@phosphor-icons/react';
import { useApp } from '../auth';
import { imageUrl } from '../api';
import { CardSkeletons, Empty, ErrorState, Img, money, useFetch } from '../ui';

export function ProductCard({ p, feature }) {
  const { user, addToCart, toast } = useApp(); const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const add = async (e) => {
    e.preventDefault();
    if (!user) return nav('/login', { state: { from: '/' } });
    setBusy(true);
    try { await addToCart(p.id, 1); toast(`${p.name} added to cart`); } catch (er) { toast(er.message, 'error'); }
    setBusy(false);
  };
  return (
    <Link to={`/product/${p.id}`} className={`tile ${feature ? 'feature' : ''}`}>
      <div className="tile-img">
        <Img src={p.hasImage ? imageUrl(p.id) : null} name={p.name} />
        {p.stock === 0 && <span className="sold">Sold out</span>}
        {(!user || user.role === 'USER') && p.stock > 0 &&
          <button className="quick" onClick={add} disabled={busy} aria-label={`Add ${p.name} to cart`}><Plus size={20} /></button>}
      </div>
      <div className="tile-meta"><div><span className="cat">{p.category}</span><h3>{p.name}</h3></div><b>{money(p.price)}</b></div>
    </Link>
  );
}

function Hero({ items, loading }) {
  const { user } = useApp();
  const top = items.slice(0, 3);
  const solo = !loading && top.length === 0;
  const ease = [0.16, 1, 0.3, 1];
  return (
    <section className={`hero ${solo ? 'solo' : ''}`}>
      <motion.div className="hero-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
        <h1>Everyday goods.<br />Delivered with care..</h1>
        <p>Thoughtfully made products from independent sellers, all in one store with one simple checkout.</p>
        <div className="hero-cta">
          <a className="btn lg" href="#shop">Shop now</a>
          {!user && <Link className="btn ghost lg" to="/login">Sign in</Link>}
        </div>
      </motion.div>
      {!solo && (
        <div className="hero-art">
          {loading ? [0, 1, 2].map((i) => <div key={i} className={`ha ha${i} sk`} />) :
            top.map((p, i) => (
              <motion.div key={p.id} className={`ha ha${i}`} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.65, ease }}>
                <Link to={`/product/${p.id}`} aria-label={p.name}><Img src={p.hasImage ? imageUrl(p.id) : null} name={p.name} /></Link>
              </motion.div>
            ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const { data, error, loading, reload } = useFetch('/api/products');
  const [q, setQ] = useState(''); const [cat, setCat] = useState('All'); const [sort, setSort] = useState('new');
  const cats = useMemo(() => ['All', ...new Set((data || []).map((p) => p.category).filter(Boolean))], [data]);
  const list = useMemo(() => {
    const r = (data || []).filter((p) => (cat === 'All' || p.category === cat) &&
      `${p.name} ${p.description || ''}`.toLowerCase().includes(q.toLowerCase()));
    const by = { low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, name: (a, b) => a.name.localeCompare(b.name), new: (a, b) => b.id - a.id };
    return r.sort(by[sort]);
  }, [data, q, cat, sort]);
  

  return (
    <div className="page wide-page">
      <Hero items={[...(data || [])].filter((p) => p.hasImage).sort((a, b) => b.id - a.id)} loading={loading} />
      <section id="shop" className="shop">
        <div className="toolbar">
          <div className="search"><MagnifyingGlass size={18} /><input placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" /></div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
            <option value="new">Newest</option><option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option><option value="name">Name</option>
          </select>
        </div>
        <div className="chips">{cats.map((c) => <button key={c} className={`chip ${c === cat ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}</div>
        {loading ? <CardSkeletons /> : error ? <ErrorState error={error} retry={reload} /> :
          list.length === 0 ? <Empty title="No products match" text="Try a different search or clear the category filter."><button className="btn" onClick={() => { setQ(''); setCat('All'); }}>Clear filters</button></Empty> :
          <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </section>
    </div>
  );
}
