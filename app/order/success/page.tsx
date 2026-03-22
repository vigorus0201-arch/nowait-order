'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  status: 'pending' | 'preparing' | 'done';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function OrderSuccessPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [prevOrders, setPrevOrders] = useState<OrderData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ── Load orders from localStorage ─────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('nowait_order');
      if (raw) setOrder(JSON.parse(raw));

      const allRaw = localStorage.getItem('nowait_orders');
      if (allRaw) {
        const all: OrderData[] = JSON.parse(allRaw);
        // 排除最新這筆，只顯示前一筆
        const current = raw ? JSON.parse(raw) : null;
        const history = current
          ? all.filter((o) => o.id !== current.id)
          : all;
        setPrevOrders(history.slice(0, 5)); // 最多顯示 5 筆歷史
      }
    } catch (e) {
      console.error('[Success] 讀取訂單失敗', e);
    }
    // 觸發進場動畫
    setTimeout(() => setMounted(true), 50);
  }, []);

  // ── Navigate back to store menu ────────────────────────────────────────────
  const handleBackToMenu = useCallback(() => {
    if (order?.storeSlug) {
      router.push(`/s/${order.storeSlug}`);
    } else {
      router.push('/s/chen-beef-noodle');
    }
  }, [router, order]);

  // ── Loading / Not Found ────────────────────────────────────────────────────
  if (!order) {
    return (
      <main className="min-h-screen bg-[#0D0D0F] text-white flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-4xl">📋</p>
          <p className="text-white/50 text-sm">找不到訂單資料</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-[#C8973A] text-black rounded-xl font-bold text-sm hover:bg-[#D4A84A] transition-all"
          >
            回首頁
          </button>
        </div>
      </main>
    );
  }

  const isDineIn = order.mode === 'dinein';

  return (
    <main className="min-h-screen bg-[#0D0D0F] text-white">
      <div className="mx-auto max-w-[560px] px-5 py-10 pb-24">

        {/* ── SUCCESS BANNER ──────────────────────────────────────────────── */}
        <div
          className={`
            text-center mb-10 transition-all duration-700 ease-out
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
          `}
        >
          {/* Checkmark Circle */}
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-green-400/10" />
            <span className="relative w-20 h-20 rounded-full bg-green-400 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(74,222,128,0.4)]">
              ✓
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">訂單已送出！</h1>
          <p className="text-white/40 text-sm">
            {isDineIn
              ? `店家已收到您的訂單${order.table ? `，桌號 ${order.table}` : ''}，請稍候`
              : '店家已收到您的外帶訂單，請稍候通知'}
          </p>
        </div>

        {/* ── ORDER CARD ──────────────────────────────────────────────────── */}
        <div
          className={`
            bg-[#1A1A1E] border border-white/10 rounded-[28px] overflow-hidden mb-6
            transition-all duration-700 delay-100 ease-out
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
          `}
        >
          {/* Card Header */}
          <div className="px-6 pt-6 pb-5 border-b border-white/8">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/30 uppercase tracking-widest">訂單編號</span>
              <span className="text-xs font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded-md">
                {order.id}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-white font-semibold text-lg">
                  {order.storeName || '您的訂單'}
                </p>
                <p className="text-white/30 text-xs mt-0.5">
                  {formatTime(order.createdAt)}
                </p>
              </div>
              {/* Mode badge */}
              <div className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                ${isDineIn
                  ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                  : 'bg-blue-400/10 text-blue-400 border border-blue-400/20'}
              `}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDineIn ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`} />
                {isDineIn ? `內用${order.table ? ` · 桌${order.table}` : ''}` : '外帶'}
              </div>
            </div>
          </div>

          {/* Customer Info (pickup only) */}
          {!isDineIn && (order.customerName || order.phone) && (
            <div className="px-6 py-4 border-b border-white/8 flex gap-6">
              {order.customerName && (
                <div>
                  <p className="text-xs text-white/30 mb-0.5">姓名</p>
                  <p className="text-sm font-medium">{order.customerName}</p>
                </div>
              )}
              {order.phone && (
                <div>
                  <p className="text-xs text-white/30 mb-0.5">手機</p>
                  <p className="text-sm font-medium">{order.phone}</p>
                </div>
              )}
            </div>
          )}

          {/* Cart Items */}
          <div className="px-6 py-5">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-4">訂單內容</p>
            <div className="space-y-3">
              {order.cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center text-xs text-white/50 font-bold shrink-0">
                      {item.quantity}
                    </span>
                    <span className="text-sm text-white/80">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#E4B55A]">
                    NT${(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="px-6 pb-4">
              <div className="bg-white/5 rounded-xl px-4 py-3">
                <p className="text-xs text-white/30 mb-1">備註</p>
                <p className="text-sm text-white/60">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="px-6 py-5 bg-[#C8973A]/5 border-t border-yellow-400/10 flex justify-between items-center">
            <span className="text-white/60 font-medium">訂單總計</span>
            <span className="text-[#E4B55A] font-bold text-2xl">
              NT${order.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ── PREVIOUS ORDERS ─────────────────────────────────────────────── */}
        {prevOrders.length > 0 && (
          <div
            className={`
              mb-5 transition-all duration-700 delay-200 ease-out
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
            `}
          >
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-5 py-4 bg-[#1A1A1E] hover:bg-[#222226] border border-white/10 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-base flex-shrink-0">
                  📋
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white/80">查看前一筆訂單紀錄</p>
                  <p className="text-xs text-white/30 mt-0.5">{prevOrders.length} 筆歷史訂單</p>
                </div>
              </div>
              <span className={`text-white/40 text-xs transition-transform duration-300 ml-2 flex-shrink-0 ${showHistory ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* History List */}
            {showHistory && (
              <div className="mt-3 space-y-3">
                {prevOrders.map((prev) => (
                  <div
                    key={prev.id}
                    className="bg-[#1A1A1E] border border-white/8 rounded-2xl overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-5 py-4 flex justify-between items-start border-b border-white/8">
                      <div>
                        <p className="text-xs font-mono text-white/30 mb-1">{prev.id}</p>
                        <p className="text-sm font-semibold">{prev.storeName || '訂單'}</p>
                        <p className="text-xs text-white/30 mt-0.5">{formatTime(prev.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#E4B55A] font-bold">NT${prev.total.toLocaleString()}</p>
                        <span className={`
                          inline-block mt-1 text-xs px-2 py-0.5 rounded-full
                          ${prev.mode === 'dinein'
                            ? 'bg-green-400/10 text-green-400'
                            : 'bg-blue-400/10 text-blue-400'}
                        `}>
                          {prev.mode === 'dinein' ? `內用${prev.table ? ` · 桌${prev.table}` : ''}` : '外帶'}
                        </span>
                      </div>
                    </div>

                    {/* Items summary */}
                    <div className="px-5 py-3">
                      <div className="space-y-1.5">
                        {prev.cart.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs">
                            <span className="text-white/40">
                              {item.name}
                              <span className="text-white/20 ml-1">×{item.quantity}</span>
                            </span>
                            <span className="text-white/50">
                              NT${(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      {prev.notes && (
                        <p className="text-xs text-white/25 mt-2 pt-2 border-t border-white/5">
                          備註：{prev.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INFO BOX ────────────────────────────────────────────────────── */}
        <div
          className={`
            bg-[#1A1A1E] border border-[#C8973A]/20 rounded-2xl px-5 py-4 mb-5
            transition-all duration-700 delay-300 ease-out
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
          `}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">
              {isDineIn ? '🛎️' : '📦'}
            </span>
            <div>
              <p className="text-sm font-semibold text-white/80 mb-1">
                {isDineIn ? '廚房正在備餐' : '訂單已進入備餐'}
              </p>
              <p className="text-xs text-white/40 leading-relaxed">
                {isDineIn
                  ? '餐點備好後將直接送至桌位，感謝耐心等候！'
                  : '如需再次下單，請重新掃描 QR Code，感謝您的光臨！'}
              </p>
            </div>
          </div>
        </div>

        {/* ── BOTTOM CTA ──────────────────────────────────────────────────── */}
        <div
          className={`
            transition-all duration-700 delay-400 ease-out
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
          `}
        >
          <button
            onClick={handleBackToMenu}
            className="w-full py-4 rounded-[18px] font-bold text-base transition-all active:scale-95 text-black"
            style={{
              background: 'linear-gradient(135deg, #C8973A, #A0722A)',
              boxShadow: '0 4px 20px rgba(200,151,58,0.35)',
            }}
          >
            回到點單頁面
          </button>
        </div>

      </div>
    </main>
  );
}