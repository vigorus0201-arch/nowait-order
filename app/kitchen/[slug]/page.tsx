'use client';

import { useEffect, useState, useCallback } from 'react';

type OrderStatus = 'pending' | 'preparing' | 'done';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderData {
  id: string;
  mode: 'dinein' | 'pickup';
  table?: string;
  storeName?: string;
  storeSlug?: string;
  customerName?: string;
  phone?: string;
  notes?: string;
  cart: CartItem[];
  total: number;
  createdAt: string;
  status: OrderStatus;
}

const STATUS_CONFIG = {
  pending: {
    label: '新單',
    labelEn: 'NEW',
    color: '#F5C518',
    bg: 'rgba(245,197,24,0.08)',
    border: 'rgba(245,197,24,0.25)',
    dot: '#F5C518',
    action: '開始製作',
    actionBg: '#F5C518',
    actionText: '#000',
    next: 'preparing' as OrderStatus,
  },
  preparing: {
    label: '製作中',
    labelEn: 'PREPARING',
    color: '#3B9EFF',
    bg: 'rgba(59,158,255,0.08)',
    border: 'rgba(59,158,255,0.25)',
    dot: '#3B9EFF',
    action: '完成',
    actionBg: '#3B9EFF',
    actionText: '#fff',
    next: 'done' as OrderStatus,
  },
  done: {
    label: '完成',
    labelEn: 'DONE',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    dot: '#22C55E',
    action: null,
    actionBg: null,
    actionText: null,
    next: null,
  },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatShortId(id: string) {
  return id.replace('NW-', '#').slice(0, 8);
}

function elapsedMinutes(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function OrderCard({
  order,
  onAdvance,
  onDelete,
}: {
  order: OrderData;
  onAdvance: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const elapsed = elapsedMinutes(order.createdAt);
  const isUrgent = order.status !== 'done' && elapsed >= 10;

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 20,
        padding: '22px 22px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        transition: 'box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Urgent glow */}
      {isUrgent && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #FF4D4D, #FF8C00)',
            borderRadius: '20px 20px 0 0',
          }}
        />
      )}

      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: cfg.color,
              letterSpacing: '0.02em',
              fontFamily: 'monospace',
            }}>
              {formatShortId(order.id)}
            </span>
            {isUrgent && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#FF4D4D',
                background: 'rgba(255,77,77,0.12)',
                border: '1px solid rgba(255,77,77,0.3)',
                borderRadius: 6,
                padding: '1px 7px',
                letterSpacing: '0.1em',
              }}>
                URGENT
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
              {formatTime(order.createdAt)}
            </span>
            <span style={{
              fontSize: 11,
              color: elapsed >= 10 ? '#FF4D4D' : 'rgba(255,255,255,0.3)',
              fontFamily: 'monospace',
            }}>
              {elapsed}m 前
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {/* Status badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0,0,0,0.25)',
            border: `1px solid ${cfg.border}`,
            borderRadius: 8,
            padding: '4px 10px',
          }}>
            <div style={{
              width: 7, height: 7,
              borderRadius: '50%',
              background: cfg.dot,
              boxShadow: `0 0 6px ${cfg.dot}`,
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: '0.12em' }}>
              {cfg.labelEn}
            </span>
          </div>

          {/* Mode badge */}
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 7,
            padding: '3px 9px',
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}>
            {order.mode === 'dinein'
              ? `桌 ${order.table || '—'}`
              : '外帶'}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }} />

      {/* Cart Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {order.cart.map((item) => (
          <div
            key={item.id}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: cfg.color,
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 6,
                padding: '2px 8px',
                minWidth: 28,
                textAlign: 'center',
                fontFamily: 'monospace',
              }}>
                ×{item.quantity}
              </span>
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
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: 14,
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginRight: 6 }}>
            備註
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            {order.notes}
          </span>
        </div>
      )}

      {/* Bottom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
          NT${order.total.toLocaleString()}
        </span>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* Delete button */}
          {order.status === 'done' && (
            <button
              onClick={() => onDelete(order.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.35)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              清除
            </button>
          )}

          {/* Advance button */}
          {cfg.action && (
            <button
              onClick={() => onAdvance(order.id)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                background: cfg.actionBg,
                color: cfg.actionText,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.03em',
                transition: 'all 0.15s',
                boxShadow: `0 4px 14px ${cfg.actionBg}55`,
              }}
            >
              {cfg.action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const loadOrders = useCallback(() => {
    try {
      const raw = localStorage.getItem('nowait_orders');
      if (raw) {
        const parsed: OrderData[] = JSON.parse(raw);
        // Sort: pending → preparing → done, then newest first within same status
        const statusOrder: Record<OrderStatus, number> = { pending: 0, preparing: 1, done: 2 };
        parsed.sort((a, b) => {
          const statusDiff = statusOrder[a.status] - statusOrder[b.status];
          if (statusDiff !== 0) return statusDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setOrders(parsed);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error('[Kitchen] 訂單讀取失敗', e);
      setOrders([]);
    } finally {
      setLoading(false);
      setLastRefresh(Date.now());
    }
  }, []);

  // Auto-refresh every 8 seconds
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleAdvance = useCallback((id: string) => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== id) return o;
        const next = STATUS_CONFIG[o.status].next;
        if (!next) return o;
        return { ...o, status: next };
      });

      // Re-sort
      const statusOrder: Record<OrderStatus, number> = { pending: 0, preparing: 1, done: 2 };
      updated.sort((a, b) => {
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      localStorage.setItem('nowait_orders', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      localStorage.setItem('nowait_orders', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleClearDone = () => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.status !== 'done');
      localStorage.setItem('nowait_orders', JSON.stringify(updated));
      return updated;
    });
  };

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    done: orders.filter((o) => o.status === 'done').length,
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const FILTERS: { key: OrderStatus | 'all'; label: string; color: string }[] = [
    { key: 'all', label: '全部', color: 'rgba(255,255,255,0.6)' },
    { key: 'pending', label: '新單', color: '#F5C518' },
    { key: 'preparing', label: '製作中', color: '#3B9EFF' },
    { key: 'done', label: '完成', color: '#22C55E' },
  ];

  return (
    <main style={{
      minHeight: '100vh',
      background: '#060606',
      color: '#fff',
      fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    }}>
      {/* Top Bar */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'rgba(6,6,6,0.92)',
        backdropFilter: 'blur(20px)',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: '#22C55E',
              boxShadow: '0 0 8px #22C55E',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 700, letterSpacing: '0.15em' }}>
              LIVE
            </span>
          </div>

          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.02em' }}>
            Kitchen Display
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
            更新於 {new Date(lastRefresh).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>

          <button
            onClick={loadOrders}
            style={{
              padding: '7px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            ↻ 重新整理
          </button>

          {counts.done > 0 && (
            <button
              onClick={handleClearDone}
              style={{
                padding: '7px 16px',
                borderRadius: 10,
                border: '1px solid rgba(34,197,94,0.2)',
                background: 'rgba(34,197,94,0.08)',
                color: '#22C55E',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              清除已完成
            </button>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 32px' }}>

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}>
          {[
            { label: '新單', count: counts.pending, color: '#F5C518', bg: 'rgba(245,197,24,0.08)', border: 'rgba(245,197,24,0.2)' },
            { label: '製作中', count: counts.preparing, color: '#3B9EFF', bg: 'rgba(59,158,255,0.08)', border: 'rgba(59,158,255,0.2)' },
            { label: '今日完成', count: counts.done, color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: stat.bg,
              border: `1px solid ${stat.border}`,
              borderRadius: 16,
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
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
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: filter === f.key
                  ? `1px solid ${f.color}55`
                  : '1px solid rgba(255,255,255,0.08)',
                background: filter === f.key
                  ? `${f.color}18`
                  : 'rgba(255,255,255,0.03)',
                color: filter === f.key ? f.color : 'rgba(255,255,255,0.35)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                letterSpacing: '0.03em',
              }}
            >
              {f.label}
              <span style={{
                fontSize: 11,
                background: filter === f.key ? `${f.color}30` : 'rgba(255,255,255,0.08)',
                color: filter === f.key ? f.color : 'rgba(255,255,255,0.3)',
                borderRadius: 6,
                padding: '1px 7px',
                fontFamily: 'monospace',
                fontWeight: 700,
              }}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 14, letterSpacing: '0.15em' }}>載入訂單中...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '100px 0',
            color: 'rgba(255,255,255,0.2)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {filter === 'all' ? '目前沒有訂單' : `沒有${FILTERS.find(f => f.key === filter)?.label}訂單`}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.15)' }}>
              新訂單會自動出現，每 8 秒更新一次
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAdvance={handleAdvance}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        button:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }
        button:active {
          transform: scale(0.97);
        }
      `}</style>
    </main>
  );
}