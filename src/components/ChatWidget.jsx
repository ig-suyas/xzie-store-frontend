import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChatCircleDotsIcon as ChatCircleDots, PaperPlaneRightIcon as PaperPlaneRight, StopIcon as Stop, XIcon as X } from '@phosphor-icons/react';
import { useApp } from '../auth';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const SUGGESTIONS = ['What products do you have?', 'What is your return policy?', 'How long does shipping take?'];

function Bubble({ m, streaming, onLink }) {
  const text = m.text.replace(/\[\[[^\]]*$/, '');
  const parts = text.split(/(\[\[product:\d+\]\])/);
  const showTyping = streaming && text;
  return (
    <div className={`msg ${m.role} ${m.error ? 'error' : ''} ${showTyping ? 'typing' : ''}`}>
      {!text && streaming ? <span className="dots"><i /><i /><i /></span> :
        parts.map((p, i) => {
          const mt = p.match(/^\[\[product:(\d+)\]\]$/);
          return mt
            ? <Link key={i} to={`/product/${mt[1]}`} className="chat-link" onClick={onLink}>View product</Link>
            : <span key={i}>{p}</span>;
        })}
    </div>
  );
}

export default function ChatWidget() {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const queue = useRef('');
  const streamDone = useRef(true);
  const timer = useRef(null);
  const ctl = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [msgs, open]);
  useEffect(() => () => { clearInterval(timer.current); ctl.current?.abort(); }, []);
  useEffect(() => { if (!user) { ctl.current?.abort(); setMsgs([]); setOpen(false); } }, [user]);

  const startDrain = () => {
    if (timer.current) return;
    timer.current = setInterval(() => {
      if (!queue.current) {
        if (streamDone.current) { clearInterval(timer.current); timer.current = null; setBusy(false); }
        return;
      }
      const chars = Array.from(queue.current);
      const n = Math.max(1, Math.ceil(chars.length / 12));
      const piece = chars.slice(0, n).join('');
      queue.current = chars.slice(n).join('');
      setMsgs((m) => {
        const c = [...m]; const last = c[c.length - 1];
        if (last) c[c.length - 1] = { ...last, text: last.text + piece };
        return c;
      });
    }, 22);
  };

  const fail = (message) => {
    const rest = queue.current; queue.current = '';
    setMsgs((m) => {
      const c = [...m]; const last = c[c.length - 1];
      if (last?.role === 'bot' && !last.error) {
        const t = last.text + rest;
        if (t) c[c.length - 1] = { ...last, text: t }; else c.pop();
      }
      c.push({ role: 'bot', text: message, error: true });
      return c;
    });
  };

  const dropEmpty = () => setMsgs((m) => {
    const last = m[m.length - 1];
    return last && last.role === 'bot' && !last.text && !last.error ? m.slice(0, -1) : m;
  });

  const handle = (block) => {
    let ev = 'message'; let data = '';
    for (const l of block.split('\n')) {
      if (l.startsWith('event:')) ev = l.slice(6).trim();
      else if (l.startsWith('data:')) data += l.slice(5).trim();
    }
    if (!data) return;
    let j = {};
    try { j = JSON.parse(data); } catch { return; }
    if (ev === 'message') queue.current += j.t || '';
    else if (ev === 'error') fail(j.message || 'The assistant is unavailable right now.');
  };

  const send = async (override) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    const history = msgs.filter((m) => !m.error && m.text).slice(-6).map((m) => ({ role: m.role, text: m.text }));
    setInput(''); setBusy(true);
    setMsgs((m) => [...m, { role: 'user', text }, { role: 'bot', text: '' }]);
    queue.current = ''; streamDone.current = false; startDrain();
    const c = new AbortController(); ctl.current = c;
    try {
      const res = await fetch(`${BASE}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ message: text, history }),
        signal: c.signal,
      });
      if (!res.ok || !res.body) {
        throw Object.assign(new Error(), { userMessage: res.status === 401 || res.status === 403
          ? 'Please sign in again to use the assistant.' : 'The assistant is unavailable right now.' });
      }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true }).replace(/\r/g, '');
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) { handle(buf.slice(0, i)); buf = buf.slice(i + 2); }
      }
    } catch (err) {
      if (err.name === 'AbortError') dropEmpty();
      else fail(err.userMessage || "Can't reach the assistant right now. Please try again.");
    } finally {
      streamDone.current = true;
    }
  };

  const stop = () => { queue.current = ''; ctl.current?.abort(); };

  if (!user) return null;
  const name = user.name || user.username;

  return (
    <>
      <button className={`iconbtn chat-nav ${open ? 'on' : ''}`} onClick={() => setOpen(!open)}
        aria-label={open ? 'Close chat' : 'Open chat assistant'} aria-expanded={open}>
        <ChatCircleDots size={22} />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.section className="chat" role="dialog" aria-label="Haul Assistant"
              initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
              <header className="chat-head">
                <div><b>Haul Assistant</b><span>Ask about products, stock and delivery</span></div>
                <button className="icon" onClick={() => setOpen(false)} aria-label="Close chat"><X /></button>
              </header>
              <div className="chat-list" ref={listRef}>
                {msgs.length === 0 && (
                  <div className="chat-empty">
                    <p>Hi {name}. I can help you find products and answer questions about shipping and returns.</p>
                    <div className="chat-chips">{SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}</div>
                  </div>
                )}
                {msgs.map((m, i) => (
                  <Bubble key={i} m={m} streaming={busy && m.role === 'bot' && i === msgs.length - 1} onLink={() => setOpen(false)} />
                ))}
              </div>
              <form className="chat-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="Type your question" aria-label="Message" />
                {busy
                  ? <button type="button" className="chat-send" onClick={stop} aria-label="Stop"><Stop weight="fill" /></button>
                  : <button className="chat-send" disabled={!input.trim()} aria-label="Send"><PaperPlaneRight /></button>}
              </form>
            </motion.section>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}