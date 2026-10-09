const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
let onUnauth = () => {};
export const setUnauthHandler = (f) => (onUnauth = f);
export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('token');
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, `Can't reach the server at ${BASE}. Check that the backend is running and CORS allows this origin.`);
  }
  if (res.status === 401 && auth && token) onUnauth();
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.message || data?.error || (typeof data === 'string' && data) || `Request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return data;
}

// Product pictures are served by the backend at /api/products/{id}/image
let imgV = Date.now();
export const bumpImages = () => { imgV = Date.now(); };
export const imageUrl = (id) => `${BASE}/api/products/${id}/image?v=${imgV}`;
