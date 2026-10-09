import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CaretDownIcon as CaretDown } from '@phosphor-icons/react';
import { useApp } from '../auth';
import { imageUrl } from '../api';
import { Badge, Empty, ErrorState, Img, Skeleton, money, useFetch } from '../ui';

export function OrderRow({ o, extra }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="order">
      <button className="order-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <b>Order #{o.id}</b><span className="muted">{o.createdAt && new Date(o.createdAt).toLocaleDateString()}</span>
        <Badge s={o.status} /><b className="grow r">{money(o.total)}</b><CaretDown className={`chev ${open ? 'up' : ''}`} />
      </button>
      {open && <div className="order-body">
        {(o.items || []).map((it, i) => (
          <div className="srow item" key={i}>
            <span className="item-l">
              {it.productId != null && <span className="thumb sm"><Img src={imageUrl(it.productId)} name={it.productName} /></span>}
              {it.productName} × {it.quantity}
            </span>
            <span>{money(it.price * it.quantity)}</span>
          </div>))}
        {o.shippingAddress && <p className="muted small">Ship to: {o.shippingAddress}</p>}
        {extra}
      </div>}
    </div>
  );
}

export default function Orders() {
  const { user } = useApp();
  const { data, error, loading, reload } = useFetch('/api/orders');
  return (
    <div className="page narrow">
      <div className="profile"><div className="avatar big">{(user.name || user.username)[0].toUpperCase()}</div>
        <div><h1>{user.name || user.username}</h1><p className="muted">{user.email}. {user.role.toLowerCase()}</p></div></div>
      <h2 className="h2">Your orders</h2>
      {loading ? <div style={{ display: 'grid', gap: 12 }}><Skeleton h={64} r={14} /><Skeleton h={64} r={14} /></div> :
        error ? <ErrorState error={error} retry={reload} /> :
        !data?.length ? <Empty title="No orders yet" text="When you place an order it will show up here."><Link className="btn" to="/">Start shopping</Link></Empty> :
        data.map((o) => <OrderRow key={o.id} o={o} />)}
    </div>
  );
}
