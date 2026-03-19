'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

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

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    next: OrderStatus | null;
    nextLabel: string | null;
    color: string;
    bg: string;
    border: string;
    dot: string;
  }
> = {
  pending: {
    label: '新單',
    next: 'preparing',
    nextLabel: '開始製作',
    color: '#f59e0b',
    bg: '#1c1500',
    border: '#78350f',
    dot: '#f59e0b',
  },
  preparing: {
    label: '製作中',
    next: 'done',
    nextLabel: '完成出餐',
    color: '#3b82f6',
    bg: '#050d1f',
    border: '#1e3a8a',
    dot: '#3b82f6',
  },
  done: {
    label: '已完成',
    next: null,
    nextLabel: null,
    color: '#22c55e',
    bg: '#031a0b',
    border: '#14532d',
    dot: '#22c55e',
  },
};

const STATUS_ORDER: OrderStatus[] = ['pending', 'preparing', 'done'];

type FilterTab = 'all' | OrderStatus;

export default function KitchenPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ✅ Hydration guard + clock
  useEffect(() => {
    setMounted(true);
    const updateTime = () =>
      setTime(
        new Date().toLocaleTimeString('zh-TW', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  // ✅ Sound alert using Web Audio API (no file needed)
  const playAlert = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const playBeep = (offset: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.3);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.3);
      };
      playBeep(0, 880);
      playBeep(0.35, 1100);
      playBeep(0.7, 880);
    } catch {
      // silently fail if AudioContext blocked
    }
  }, []);

  // ✅ Load + sound detection
  const loadOrders = useCallback(() => {
    try {
      const raw = localStorage.getItem('nowait_orders');
      const parsed: OrderData[] = raw ? JSON.parse(raw) : [];

      // detect new pending orders
      const newPendingIds = parsed
        .filter((o) => o.status === 'pending')
        .map((o) => o.id);

      const hasNew = newPendingIds.some(
        (id) => !prevOrderIdsRef.current.has(id)
      );

      if (hasNew && prevOrderIdsRef.current.size > 0) {
        playAlert();
      }

      prevOrderIdsRef.current = new Set(parsed.map((o) => o.id));
      setOrders(parsed);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [playAlert]);

  // ✅ Auto-refresh every 8s
  useEffect(() => {
    if (!mounted) return;
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, [mounted, loadOrders]);

  // ✅ Advance order status
  const handleAdvance = (id: string) => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== id) return o;
        const next = STATUS_CONFIG[o.status].next;
        if (!next) return o;
        return { ...o, status: next };
      });
      localStorage.setItem('nowait_orders', JSON.stringify(updated));
      return updated;
    });
  };

  // ✅ Clear single done order
  const handleClearSingle = (id: string) => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      localStorage.setItem('nowait_orders', JSON.stringify(updated));
      return updated;
    });
  };

  // ✅ Clear all done orders
  const handleClearDone = () => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.status !== 'done');
      localStorage.setItem('nowait_orders', JSON.stringify(updated));
      return updated;
    });
  };

  // ✅ Sort: pending → preparing → done, then by createdAt asc
  const sortedOrders = [...orders].sort((a, b) => {
    const statusDiff =
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const filtered =
    filter === 'all'
      ? sortedOrders
      : sortedOrders.filter((o) => o.status === filter);

  const stats = {
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    done: orders.filter((o) => o.status === 'done').length,
  };

  const getElapsed = (createdAt: string) => {
    const diff = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / 60000
    );
    return diff;
  };

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fff',
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      }}
    >
      {/* ── HEADER ── */}
      <header
        style={{
          borderBottom: '1px solid #1a1a1a',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: '#0a0a0a',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e',
            }}
          />
          <span
            style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}
          >
            Kitchen Display
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {/* Manual refresh */}
          <button
            onClick={loadOrders}
            style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              color: '#888',
              padding: '6px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>↻</span> 重新整理
          </button>

          <div style={{ color: '#555', fontSize: 13 }}>
            更新 {time}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
        {/* ── STATS ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {(
            [
              { key: 'pending', label: '新單', emoji: '🟡' },
              { key: 'preparing', label: '製作中', emoji: '🔵' },
              { key: 'done', label: '已完成', emoji: '🟢' },
            ] as const
          ).map(({ key, label, emoji }) => (
            <div
              key={key}
              style={{
                background: STATUS_CONFIG[key].bg,
                border: `1px solid ${STATUS_CONFIG[key].border}`,
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: STATUS_CONFIG[key].color,
                    lineHeight: 1,
                  }}
                >
                  {stats[key]}
                </div>
                <div
                  style={{ fontSize: 13, color: '#666', marginTop: 4 }}
                >
                  {label}
                </div>
              </div>
              <div style={{ fontSize: 24 }}>{emoji}</div>
            </div>
          ))}
        </div>

        {/* ── FILTER TABS ── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            alignItems: 'center',
          }}
        >
          {(
            [
              { key: 'all', label: `全部 (${orders.length})` },
              { key: 'pending', label: `新單 (${stats.pending})` },
              { key: 'preparing', label: `製作中 (${stats.preparing})` },
              { key: 'done', label: `完成 (${stats.done})` },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border:
                  filter === key
                    ? `1px solid ${
                        key === 'all'
                          ? '#fff'
                          : STATUS_CONFIG[key as OrderStatus].color
                      }`
                    : '1px solid #1f1f1f',
                background:
                  filter === key
                    ? key === 'all'
                      ? '#fff'
                      : STATUS_CONFIG[key as OrderStatus].bg
                    : '#111',
                color:
                  filter === key
                    ? key === 'all'
                      ? '#000'
                      : STATUS_CONFIG[key as OrderStatus].color
                    : '#555',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: filter === key ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}

          {/* Clear done button */}
          {stats.done > 0 && (
            <button
              onClick={handleClearDone}
              style={{
                marginLeft: 'auto',
                padding: '7px 16px',
                borderRadius: 8,
                border: '1px solid #1f1f1f',
                background: '#111',
                color: '#555',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              清除完成單 ({stats.done})
            </button>
          )}
        </div>

        {/* ── ORDERS ── */}
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              color: '#444',
              padding: 80,
              fontSize: 15,
            }}
          >
            載入中...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#2a2a2a',
              padding: 80,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍽</div>
            <div style={{ fontSize: 16, color: '#444' }}>
              {filter === 'all' ? '目前沒有訂單' : '此分類沒有訂單'}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 12,
            }}
          >
            {filtered.map((order) => {
              const cfg = STATUS_CONFIG[order.status];
              const elapsed = getElapsed(order.createdAt);
              const isUrgent =
                order.status !== 'done' && elapsed >= 10;
              const createdTime = new Date(
                order.createdAt
              ).toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });

              return (
                <div
                  key={order.id}
                  style={{
                    background: cfg.bg,
                    border: `1px solid ${
                      isUrgent ? '#ef4444' : cfg.border
                    }`,
                    borderRadius: 14,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    position: 'relative',
                    boxShadow: isUrgent
                      ? '0 0 20px rgba(239,68,68,0.15)'
                      : 'none',
                  }}
                >
                  {/* URGENT badge */}
                  {isUrgent && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -10,
                        right: 16,
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 20,
                        letterSpacing: 1,
                      }}
                    >
                      ⚠ URGENT {elapsed}m
                    </div>
                  )}

                  {/* Order header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#555',
                          marginBottom: 2,
                        }}
                      >
                        #{order.id.slice(-6).toUpperCase()}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: cfg.dot,
                            boxShadow: `0 0 6px ${cfg.dot}`,
                          }}
                        />
                        <span
                          style={{
                            color: cfg.color,
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: '#555',
                          marginBottom: 2,
                        }}
                      >
                        {createdTime}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: isUrgent ? '#ef4444' : '#444',
                        }}
                      >
                        {elapsed === 0 ? '剛剛' : `${elapsed} 分鐘前`}
                      </div>
                    </div>
                  </div>

                  {/* Mode badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#111',
                      border: '1px solid #222',
                      borderRadius: 8,
                      padding: '5px 10px',
                      alignSelf: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>
                      {order.mode === 'dinein' ? '🪑' : '🛍'}
                    </span>
                    <span style={{ fontSize: 12, color: '#aaa' }}>
                      {order.mode === 'dinein'
                        ? `店內 ${order.table ? `· 桌 ${order.table}` : ''}`
                        : '外帶 / 自取'}
                    </span>
                  </div>

                  {/* Cart items */}
                  <div
                    style={{
                      borderTop: '1px solid #1a1a1a',
                      paddingTop: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {order.cart.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 13,
                              color: '#fff',
                              fontWeight: 500,
                            }}
                          >
                            {item.name}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: cfg.color,
                              fontWeight: 700,
                            }}
                          >
                            × {item.quantity}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: '#555' }}>
                          NT${item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div
                      style={{
                        background: '#111',
                        border: '1px solid #1e1e00',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12,
                        color: '#aaa',
                      }}
                    >
                      📝 {order.notes}
                    </div>
                  )}

                  {/* Total + actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #1a1a1a',
                      paddingTop: 12,
                      marginTop: 'auto',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: '#444' }}>總計</div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        NT${order.total}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {/* Done → clear button */}
                      {order.status === 'done' && (
                        <button
                          onClick={() => handleClearSingle(order.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: '1px solid #1f1f1f',
                            background: 'transparent',
                            color: '#555',
                            cursor: 'pointer',
                            fontSize: 13,
                          }}
                        >
                          移除
                        </button>
                      )}

                      {/* Advance button */}
                      {cfg.nextLabel && (
                        <button
                          onClick={() => handleAdvance(order.id)}
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: 'none',
                            background: cfg.color,
                            color:
                              order.status === 'pending' ? '#000' : '#fff',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {cfg.nextLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}