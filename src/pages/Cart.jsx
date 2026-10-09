import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { XIcon as X } from '@phosphor-icons/react';
import { api, imageUrl } from '../api';
import { useApp } from '../auth';
import { Empty, Img, Modal, Stepper, money } from '../ui';


export default function Cart() {
  const { cart, setQty, removeItem, refreshCart, toast } = useApp(); const nav = useNavigate();
  const [open, setOpen] = useState(false); const [addr, setAddr] = useState(''); const [busy, setBusy] = useState(false);
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const run = (fn) => fn().catch((e) => toast(e.message, 'error'));

  const place = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api('/api/orders', { method: 'POST', body: { shippingAddress: addr } }); await refreshCart(); toast('Order placed'); nav('/orders'); }
    catch (er) { toast(er.message, 'error'); }
    setBusy(false);
  };

  if (cart.length === 0) return <div className="page"><Empty title="Your cart is empty" text="Add a few things and they'll show up here."><Link className="btn" to="/">Browse products</Link></Empty></div>;
  return (
    <div className="page">
      <h1 className="h1">Your cart</h1>
      <div className="cart">
        <div className="lines">
          {cart.map((i) => (
            <div className="line" key={i.id}>
              <Link to={`/product/${i.productId}`} className="thumb"><Img src={i.hasImage ? imageUrl(i.productId) : null} name={i.name} /></Link>
              <div className="grow"><b>{i.name}</b><div className="muted">{money(i.price)}</div></div>
              <Stepper value={i.quantity}
                onDec={() => i.quantity > 1 ? run(() => setQty(i.id, i.quantity - 1)) : run(() => removeItem(i.id))}
                onInc={() => run(() => setQty(i.id, i.quantity + 1))} />
              <b className="lt">{money(i.price * i.quantity)}</b>
              <button className="icon" onClick={() => run(() => removeItem(i.id))} aria-label={`Remove ${i.name}`}><X /></button>
            </div>))}
        </div>
        <aside className="summary"><h3>Order summary</h3>
          <div className="srow"><span>Subtotal</span><span>{money(total)}</span></div>
          <div className="srow big"><span>Total</span><span>{money(total)}</span></div>
          <button className="btn lg" onClick={() => setOpen(true)}>Checkout</button></aside>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Where should we send it?">
        <form onSubmit={place} className="form">
          <label>Shipping address<textarea required rows={4} value={addr} onChange={(e) => setAddr(e.target.value)} /></label>
          <button className="btn lg" disabled={busy}>{busy ? 'Placing order…' : `Place order, ${money(total)}`}</button>
        </form>
      </Modal>
    </div>
  );
}
