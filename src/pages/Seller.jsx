import { useState } from 'react';
import { OrdersManager, ProductsManager } from './Manage';

export default function Seller() {
  const [tab, setTab] = useState('products');
  return (
    <div className="page">
      <h1 className="h1">Seller studio</h1>
      <div className="tabs wide"><button className={tab === 'products' ? 'on' : ''} onClick={() => setTab('products')}>My products</button><button className={tab === 'orders' ? 'on' : ''} onClick={() => setTab('orders')}>Orders</button></div>
      {tab === 'products' ? <ProductsManager listPath="/api/seller/products" /> : <OrdersManager listPath="/api/seller/orders" />}
    </div>
  );
}
