'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus = 'pending' | 'preparing' | 'completed';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderData {
  id: string;           // Supabase UUID（用於 update/delete）
  orderCode: string;    // 顯示用單號（order_code）
  mode: 'dinein' | 'pickup' | 'pos';
  table?: string;
  customerName?: string;
  phone?: string;
  notes?: string;
  cart: CartItem[];
  total: number;
  createdAt: string;
  status: OrderStatus;
}

// ─── Supabase row → OrderData ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): OrderData {
  const items: { id: string; name: string; price: number; qty: number }[] =
    Array.isArray(row.items_json) ? row.items_json : [];
  return {
    id:           row.id,
    orderCode:    row.order_code ?? row.id.slice(0, 8),
    mode:         row.source ?? 'dinein',
    table:        row.table_num ?? undefined,
    customerName: row.customer_name ?? undefined,
    phone:        row.customer_phone ?? undefined,
    notes:        row.note ?? undefined,
    cart:         items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.qty })),
    total:        row.total_amount ?? 0,
    createdAt:    row.created_at,
    status:       (row.status as OrderStatus) ?? 'pending',
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: '新單', labelEn: 'NEW',
    color: '#C8973A',
    bg: 'rgba(200,151,58,0.08)', border: 'rgba(200,151,58,0.25)', dot: '#C8973A',
    action: '開始製作', actionBg: '#C8973A', actionText: '#000',
    next: 'preparing' as OrderStatus,
  },
  preparing: {
    label: '製作中', labelEn: 'PREPARING',
    color: '#3B9EFF',
    bg: 'rgba(59,158,255,0.08)', border: 'rgba(59,158,255,0.25)', dot: '#3B9EFF',
    action: '完成', actionBg: '#3B9EFF', actionText: '#fff',
    next: 'completed' as OrderStatus,
  },
  completed: {
    label: '完成', labelEn: 'DONE',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', dot: '#22C55E',
    action: null, actionBg: null, actionText: null,
    next: null,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function elapsedMinutes(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({
  order, onAdvance, onDelete,
}: {
  order: OrderData;
  onAdvance: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg     = STATUS_CONFIG[order.status];
  const elapsed = elapsedMinutes(order.createdAt);
  const isUrgent = order.status !== 'completed' && elapsed >= 10;

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 20, padding: '22px 22px 18px',
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.2s', position: 'relative', overflow: 'hidden',
    }}>
      {/* Urgent top bar */}
      {isUrgent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #FF4D4D, #FF8C00)',
          borderRadius: '20px 20px 0 0',
        }} />
      )}

      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: cfg.color, letterSpacing: '0.02em', fontFamily: 'monospace' }}>
              #{order.orderCode}
            </span>
            {isUrgent && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#FF4D4D',
                background: 'rgba(255,77,77,0.12)', border: '1px solid rgba(255,77,77,0.3)',
                borderRadius: 6, padding: '1px 7px', letterSpacing: '0.1em',
              }}>URGENT</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
              {formatTime(order.createdAt)}
            </span>
            <span style={{ fontSize: 11, color: elapsed >= 10 ? '#FF4D4D' : 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
              {elapsed}m 前
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {/* Status badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.25)', border: `1px solid ${cfg.border}`,
            borderRadius: 8, padding: '4px 10px',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: '0.12em' }}>
              {cfg.labelEn}
            </span>
          </div>
          {/* Mode badge */}
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 7, padding: '3px 9px', fontWeight: 600, letterSpacing: '0.06em',
          }}>
            {order.mode === 'dinein'
              ? `桌 ${order.table || '—'}`
              : order.mode === 'pos' ? 'POS'
              : '外帶'}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }} />

      {/* Cart Items + Notes — flex:1 pushes button to bottom */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {order.cart.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: cfg.color,
                  background: 'rgba(0,0,0,0.2)', borderRadius: 6,
                  padding: '2px 8px', minWidth: 28, textAlign: 'center', fontFamily: 'monospace',
                }}>×{item.quantity}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                  {item.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '8px 12px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginRight: 6 }}>備註</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{order.notes}</span>
          </div>
        )}
      </div>

      {/* Bottom — always at card bottom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
          NT${order.total.toLocaleString()}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {order.status === 'completed' && (
            <button
              onClick={() => onDelete(order.id)}
              style={{
                padding: '8px 16px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >清除</button>
          )}
          {cfg.action && (
            <button
              onClick={() => onAdvance(order.id)}
              style={{
                padding: '8px 18px', borderRadius: 10, border: 'none',
                background: cfg.actionBg!, color: cfg.actionText!,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                letterSpacing: '0.03em', boxShadow: `0 4px 14px ${cfg.actionBg}55`,
              }}
            >{cfg.action}</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function KitchenPage() {
  const params    = useParams();
  const storeSlug = params?.slug as string | undefined;

  const [orders,      setOrders]      = useState<OrderData[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<OrderStatus | 'all'>('all');
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const prevIdsRef   = useRef<Set<string>>(new Set());
  const audioCtxRef  = useRef<AudioContext | null>(null);

  // ── Sound alert ────────────────────────────────────────────────────────────
  const playAlert = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const beep = (offset: number, freq: number) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.3);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.3);
      };
      beep(0, 880); beep(0.35, 1100); beep(0.7, 880);
    } catch { /* AudioContext blocked */ }
  }, []);

  // ── Load from Supabase ─────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'preparing', 'completed'])
      .order('created_at', { ascending: true });

    if (storeSlug) query = query.eq('store_slug', storeSlug);

    const { data, error } = await query;
    if (error) { console.error('[Kitchen] 讀取失敗', error); return; }

    const mapped = (data ?? []).map(mapRow);

    // 偵測新 pending 單 → 播音
    const newPendingIds = mapped.filter(o => o.status === 'pending').map(o => o.id);
    if (prevIdsRef.current.size > 0 && newPendingIds.some(id => !prevIdsRef.current.has(id))) {
      playAlert();
    }
    prevIdsRef.current = new Set(mapped.map(o => o.id));

    setOrders(mapped);
    setLoading(false);
    setLastRefresh(Date.now());
  }, [storeSlug, playAlert]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    loadOrders();

    const channelName = storeSlug ? `kitchen-${storeSlug}` : 'kitchen-all';
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'orders',
          ...(storeSlug ? { filter: `store_slug=eq.${storeSlug}` } : {}),
        },
        () => loadOrders(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadOrders, storeSlug]);

  // ── Advance status → Supabase ──────────────────────────────────────────────
  const handleAdvance = useCallback(async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const next = STATUS_CONFIG[order.status].next;
    if (!next) return;

    // 樂觀更新 UI
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: next } : o));

    const { error } = await supabase.from('orders').update({ status: next }).eq('id', id);
    if (error) {
      console.error('[Kitchen] 狀態更新失敗', error);
      loadOrders(); // 失敗時重新讀取
    }
  }, [orders, loadOrders]);

  // ── Delete → Supabase ──────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      console.error('[Kitchen] 刪除失敗', error);
      loadOrders();
    }
  }, [loadOrders]);

  const handleClearDone = useCallback(async () => {
    const doneIds = orders.filter(o => o.status === 'completed').map(o => o.id);
    if (!doneIds.length) return;
    setOrders(prev => prev.filter(o => o.status !== 'completed'));
    await supabase.from('orders').delete().in('id', doneIds);
  }, [orders]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const statusOrder: Record<OrderStatus, number> = { pending: 0, preparing: 1, completed: 2 };
  const sorted  = [...orders].sort((a, b) => {
    const d = statusOrder[a.status] - statusOrder[b.status];
    // Within same status: newest first
    return d !== 0 ? d : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const filtered = filter === 'all' ? sorted : sorted.filter(o => o.status === filter);

  const counts = {
    all:       orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const FILTERS = [
    { key: 'all'       as const, label: '全部',   color: 'rgba(255,255,255,0.6)' },
    { key: 'pending'   as const, label: '新單',   color: '#C8973A' },
    { key: 'preparing' as const, label: '製作中', color: '#3B9EFF' },
    { key: 'completed' as const, label: '完成',   color: '#22C55E' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main style={{
      minHeight: '100vh', background: '#0D0D0F', color: '#fff',
      fontFamily: "'DM Sans', 'Noto Serif TC', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 32px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0,
        background: 'rgba(13,13,15,0.92)', backdropFilter: 'blur(20px)', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#22C55E', boxShadow: '0 0 8px #22C55E',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 700, letterSpacing: '0.15em' }}>LIVE</span>
          </div>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.02em' }}>Kitchen Display</span>
          {storeSlug && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
              {storeSlug}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="hidden sm:inline" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
            更新於 {new Date(lastRefresh).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>
          {/* Refresh — icon only on mobile, text on desktop */}
          <button
            onClick={loadOrders}
            title="重新整理"
            style={{
              padding: '8px 14px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>↻</span>
            <span className="hidden sm:inline" style={{ fontSize: 12 }}>重新整理</span>
          </button>
          {/* Clear done — icon only on mobile */}
          {counts.completed > 0 && (
            <button
              onClick={handleClearDone}
              title="清除已完成"
              style={{
                padding: '8px 14px', borderRadius: 10,
                border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.08)',
                color: '#22C55E', fontSize: 18, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>✓</span>
              <span className="hidden sm:inline" style={{ fontSize: 12 }}>清除已完成</span>
            </button>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 32px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: '新單',    count: counts.pending,   color: '#C8973A', bg: 'rgba(200,151,58,0.08)',  border: 'rgba(200,151,58,0.2)'  },
            { label: '製作中',  count: counts.preparing, color: '#3B9EFF', bg: 'rgba(59,158,255,0.08)',  border: 'rgba(59,158,255,0.2)'  },
            { label: '今日完成', count: counts.completed, color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'   },
          ].map(stat => (
            <div key={stat.label} style={{
              background: stat.bg, border: `1px solid ${stat.border}`,
              borderRadius: 16, padding: '18px 22px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.06em' }}>
                {stat.label}
              </span>
              <span style={{ fontSize: 36, fontWeight: 800, color: stat.color, fontFamily: 'monospace', lineHeight: 1 }}>
                {stat.count}
              </span>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 18px', borderRadius: 10,
                border: filter === f.key ? `1px solid ${f.color}55` : '1px solid rgba(255,255,255,0.08)',
                background: filter === f.key ? `${f.color}18` : 'rgba(255,255,255,0.03)',
                color: filter === f.key ? f.color : 'rgba(255,255,255,0.35)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              {f.label}
              <span style={{
                fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                background: filter === f.key ? `${f.color}30` : 'rgba(255,255,255,0.08)',
                color: filter === f.key ? f.color : 'rgba(255,255,255,0.3)',
                borderRadius: 6, padding: '1px 7px',
              }}>{counts[f.key]}</span>
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 14, letterSpacing: '0.15em' }}>載入訂單中...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {filter === 'all' ? '目前沒有訂單' : `沒有${FILTERS.find(f => f.key === filter)?.label}訂單`}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.15)' }}>
              新訂單送出後即時顯示
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} onAdvance={handleAdvance} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        button:hover  { opacity: 0.85; transform: translateY(-1px); }
        button:active { transform: scale(0.97); }
      `}</style>
    </main>
  );
}
