import { useState } from 'react';
import { PlusIcon as Plus } from '@phosphor-icons/react';
import { api, imageUrl, bumpImages } from '../api';
import { useApp } from '../auth';
import { Empty, ErrorState, Img, Modal, STATUSES, Skeleton, money, useFetch } from '../ui';
import { OrderRow } from './Orders';

const blank = { name: '', description: '', price: '', stock: '', category: '' };

export function ProductsManager({ listPath }) {
  const { data, error, loading, reload } = useFetch(listPath); const { toast } = useApp();
  const [edit, setEdit] = useState(null); const [del, setDel] = useState(null); const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });
  const openEdit = (p) => { setFile(null); setEdit(p); };

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    const body = { name: edit.name, description: edit.description,
                   price: Number(edit.price), stock: Number(edit.stock), category: edit.category };
    try {
      const saved = edit.id
        ? await api(`/api/products/${edit.id}`, { method: 'PUT', body })
        : await api('/api/products', { method: 'POST', body });
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await api(`/api/products/${saved.id}/image`, { method: 'POST', body: fd });
        bumpImages();
      }
      setFile(null);
      toast('Product saved'); setEdit(null); reload();
    } catch (er) { toast(er.message, 'error'); }
    setBusy(false);
  };

  const remove = async () => {
    try { await api(`/api/products/${del.id}`, { method: 'DELETE' }); toast('Product deleted'); setDel(null); reload(); }
    catch (er) { toast(er.message, 'error'); }
  };

  return (
    <>
      <div className="bar"><h2 className="h2">Products</h2><button className="btn" onClick={() => openEdit(blank)}><Plus /> Add product</button></div>
      {loading ? <Skeleton h={200} r={18} /> : error ? <ErrorState error={error} retry={reload} /> :
        !data?.length ? <Empty title="No products yet" text="Add your first product to get it listed."><button className="btn" onClick={() => openEdit(blank)}>Add product</button></Empty> :
        <div className="table">{data.map((p) => (
          <div className="trow" key={p.id}>
            <div className="thumb sm"><Img src={p.hasImage ? imageUrl(p.id) : null} name={p.name} /></div>
            <div className="grow"><b>{p.name}</b><div className="muted small">{p.category}. {p.stock} in stock{p.sellerName && `. ${p.sellerName}`}</div></div>
            <b>{money(p.price)}</b>
            <button className="btn ghost sm" onClick={() => openEdit({ ...p })}>Edit</button>
            <button className="btn ghost danger sm" onClick={() => setDel(p)}>Delete</button>
          </div>))}</div>}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit product' : 'New product'}>
        {edit && <form className="form" onSubmit={save}>
          <label>Name<input required value={edit.name} onChange={set('name')} /></label>
          <label>Description<textarea rows={3} value={edit.description || ''} onChange={set('description')} /></label>
          <div className="two"><label>Price<input required type="number" min="0" step="0.01" value={edit.price} onChange={set('price')} /></label>
            <label>Stock<input required type="number" min="0" value={edit.stock} onChange={set('stock')} /></label></div>
          <label>Category<input required value={edit.category || ''} onChange={set('category')} /></label>
          <label>Product image{edit.id && edit.hasImage ? ' (leave empty to keep the current one)' : ''}
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} /></label>
          <button className="btn lg" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
        </form>}
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title="Delete this product?">
        <p className="muted">“{del?.name}” will be removed from the store. This can't be undone.</p>
        <div className="bar"><button className="btn ghost" onClick={() => setDel(null)}>Keep it</button><button className="btn danger" onClick={remove}>Delete product</button></div>
      </Modal>
    </>
  );
}

export function OrdersManager({ listPath }) {
  const { data, error, loading, reload } = useFetch(listPath); const { toast } = useApp();
  const update = async (id, status) => {
    try { await api(`/api/orders/${id}/status`, { method: 'PUT', body: { status } }); toast('Order updated'); reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <h2 className="h2">Orders</h2>
      {loading ? <Skeleton h={120} r={18} /> : error ? <ErrorState error={error} retry={reload} /> :
        !data?.length ? <Empty title="No orders yet" text="Orders will appear here as customers check out." /> :
        data.map((o) => <OrderRow key={o.id} o={o} extra={
          <label className="inline">Status <select value={o.status} onChange={(e) => update(o.id, e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>} />)}
    </>
  );
}

export function UsersManager() {
  const { data, error, loading, reload } = useFetch('/api/admin/users'); const { toast, user: me } = useApp();
  const role = async (id, r) => { try { await api(`/api/admin/users/${id}/role`, { method: 'PUT', body: { role: r } }); toast('Role updated'); reload(); } catch (e) { toast(e.message, 'error'); } };
  const remove = async (id) => { try { await api(`/api/admin/users/${id}`, { method: 'DELETE' }); toast('User deleted'); reload(); } catch (e) { toast(e.message, 'error'); } };
  return (
    <>
      <h2 className="h2">Users</h2>
      {loading ? <Skeleton h={160} r={18} /> : error ? <ErrorState error={error} retry={reload} /> :
        !data?.length ? <Empty title="No users" text="Registered users will appear here." /> :
        <div className="table">{data.map((u) => (
          <div className="trow" key={u.id}>
            <div className="grow"><b>{u.username}</b><div className="muted small">{u.email}</div></div>
            <select value={u.role} disabled={u.id === me.id} onChange={(e) => role(u.id, e.target.value)}>{['USER', 'SELLER', 'ADMIN'].map((r) => <option key={r}>{r}</option>)}</select>
            <button className="btn ghost danger sm" disabled={u.id === me.id} onClick={() => window.confirm(`Delete ${u.username}?`) && remove(u.id)}>Delete</button>
          </div>))}</div>}
    </>
  );
}
