import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ReceiptIcon as Receipt, ShoppingBagIcon as ShoppingBag, SignOutIcon as SignOut } from '@phosphor-icons/react';
import { Guard, useApp } from './auth';
import Home from './pages/Home';
import Product from './pages/Product';
import Login from './pages/Login';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Seller from './pages/Seller';
import Admin from './pages/Admin';
import ChatWidget from './components/ChatWidget';

function Nav() {
  const { user, logout, cart } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(); const nav = useNavigate();
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  const count = cart.reduce((n, i) => n + i.quantity, 0);
  return (
    <header className="nav"><div className="nav-in">
      <Link to="/" className="logo">haul</Link>
      <nav className="links">
        <NavLink to="/" end>Shop</NavLink>
        {user?.role === 'SELLER' && <NavLink to="/seller">Seller studio</NavLink>}
        {user?.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="nav-r">
        {user?.role === 'USER' && <Link to="/cart" className="iconbtn" aria-label="Cart"><ShoppingBag size={22} />{count > 0 && <b className="pill">{count}</b>}</Link>}
        <span style={{ background: 'red', color: '#fff', padding: '2px 8px', borderRadius: 8 }}>TEST</span>
        <ChatWidget />
        {user ? (
          <div className="dd" ref={ref}>
            <button className="avatar" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Account menu">{(user.name || user.username || '?')[0].toUpperCase()}</button>
            <AnimatePresence>
              {open && (
                <motion.div className="dd-menu" onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
                  <div className="dd-who"><b>{user.name || user.username}</b><span>{user.role.toLowerCase()}</span></div>
                  <Link to="/orders"><Receipt /> Orders and profile</Link>
                  <button onClick={() => { logout(); nav('/'); }}><SignOut /> Sign out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : <Link to="/login" className="btn sm">Sign in</Link>}
      </div>
    </div></header>
  );
}

const Unauthorized = () => (
  <div className="page"><div className="state"><h3>You don't have access to this page</h3>
    <p>Your account role doesn't include this area.</p><Link className="btn" to="/">Back to shop</Link></div></div>
);
const NotFound = () => (
  <div className="page"><div className="state"><h3>Page not found</h3><p>That link doesn't lead anywhere.</p><Link className="btn" to="/">Back to shop</Link></div></div>
);

export default function App() {
  const loc = useLocation();
  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main>
        <AnimatePresence mode="wait">
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
            <Routes location={loc}>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<Product />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cart" element={<Guard roles={['USER']}><Cart /></Guard>} />
              <Route path="/orders" element={<Guard><Orders /></Guard>} />
              <Route path="/seller" element={<Guard roles={['SELLER']}><Seller /></Guard>} />
              <Route path="/admin" element={<Guard roles={['ADMIN']}><Admin /></Guard>} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="foot">© {new Date().getFullYear()} haul. A demo store built for portfolio purposes.</footer>
    </MotionConfig>
  );
}