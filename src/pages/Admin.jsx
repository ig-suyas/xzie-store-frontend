import { useState } from 'react';
import { OrdersManager, ProductsManager, UsersManager } from './Manage';

export default function Admin() {
  const [tab, setTab] = useState('users');
  const T = (k, l) => <button className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>;
  return (
    <div className="page">
      <h1 className="h1">Admin</h1>
      <div className="tabs wide">{T('users', 'Users')}{T('products', 'Products')}{T('orders', 'Orders')}</div>
      {tab === 'users' && <UsersManager />}
      {tab === 'products' && <ProductsManager listPath="/api/products" />}
      {tab === 'orders' && <OrdersManager listPath="/api/admin/orders" />}
    </div>
  );
}
