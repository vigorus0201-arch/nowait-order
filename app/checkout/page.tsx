'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  Suspense,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderData {
  id: string;
  mode: 'dinein' | 'pickup' | 'preorder';
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

// ─── Main Content ─────────────────────────────────────────────────────────────
function CheckoutContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const rawMode = searchParams.get('mode');
  const mode: 'dinein' | 'pickup' | 'preorder' =
    rawMode === 'pickup' || rawMode === 'preorder' ? rawMode : 'dinein';

  const table      = searchParams.get('table') ?? '';
  const isDineIn   = mode === 'dinein';
  const isPreOrder = mode === 'pickup' || mode === 'preorder';

  // ── State ──────────────────────────────────────────────────────────────────
  const [cart,            setCart]            = useState<CartItem[]>([]);
  const [storeName,       setStoreName]       = useState('');
  const [storeSlug,       setStoreSlug]       = useState('');
  const [customerName,    setCustomerName]    = useState('');
  const [phone,           setPhone]           = useState('');
  const [notes,           setNotes]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [isCartLoaded,    setIsCartLoaded]    = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [contactShake,    setContactShake]    = useState(false);

  const contactRef = useRef<HTMLElement | null>(null);

  // ── 初始化：讀取 localStorage（含 draft）──────────────────────────────────
  useEffect(() => {
    try {
      const savedCart  = localStorage.getItem('nowait_cart');
      const savedStore = localStorage.getItem('nowait_store');
      const savedSlug  = localStorage.getItem('nowait_store_slug');
      const savedDraft = localStorage.getItem('nowait_checkout_draft');

      // 購物車
      if (savedCart) {
        const p = JSON.parse(savedCart);
        setCart(Array.isArray(p) ? p : []);
      }

      // 店家資訊
      if (savedStore) {
        try {
          const ps = JSON.parse(savedStore);
          if (ps?.name) setStoreName(ps.name);
          if (ps?.slug) setStoreSlug(ps.slug);
        } catch {
          setStoreName(savedStore);
        }
      }
      if (savedSlug) setStoreSlug(savedSlug);

      // ★ 聯絡資訊草稿（Problem B 修復）
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setCustomerName(draft?.customerName ?? '');
          setPhone(draft?.phone ?? '');
          setNotes(draft?.notes ?? '');
        } catch {
          // 草稿壞掉就忽略，不影響流程
        }
      }
    } catch (e) {
      console.error('[Checkout] 讀取失敗:', e);
    } finally {
      // ★ hydration flag 確保讀完才開始寫（Problem A 修復）
      setIsCartLoaded(true);
    }
  }, []);

  // ── cart 同步寫入 localStorage（只在讀取完成後）────────────────────────────
  // ★ 移除 updateQty 內的直接寫入，統一由這裡負責，避免雙重寫入
  useEffect(() => {
    if (!isCartLoaded) return;
    localStorage.setItem('nowait_cart', JSON.stringify(cart));
  }, [cart, isCartLoaded]);

  // ── 聯絡資訊草稿即時同步（Problem B 修復）───────────────────────────────────
  useEffect(() => {
    if (!isCartLoaded) return;
    if (!isPreOrder) return;

    localStorage.setItem(
      'nowait_checkout_draft',
      JSON.stringify({ customerName, phone, notes })
    );
  }, [customerName, phone, notes, isPreOrder, isCartLoaded]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const total      = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const isPhoneValid   = /^09\d{8}$/.test(phone);
  const isNameValid    = customerName.trim().length > 0;
  const showNameErr    = submitAttempted && isPreOrder && !isNameValid;
  const showPhoneErr   = submitAttempted && isPreOrder && phone.trim().length > 0 && !isPhoneValid;
  const showPhoneOk    = phone.trim().length > 0 && isPhoneValid;
  const contactInvalid = isPreOrder && (!customerName.trim() || !phone.trim() || !isPhoneValid);

  // ── 數量調整（統一由 useEffect 同步 localStorage，不在這裡直接寫）──────────
  const updateQty = useCallback((id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
    );
  }, []);

  // ── 繼續加點：回菜單前再保一次 cart + draft（雙重保障）──────────────────────
  const handleBack = useCallback(() => {
    // 強制寫一次，確保最新狀態進 localStorage
    localStorage.setItem('nowait_cart', JSON.stringify(cart));

    if (isPreOrder) {
      localStorage.setItem(
        'nowait_checkout_draft',
        JSON.stringify({ customerName, phone, notes })
      );
    }

    if (storeSlug) {
      router.push(
        `/s/${storeSlug}${
          isDineIn && table
            ? `?mode=dinein&table=${table}`
            : isPreOrder
            ? `?mode=${mode}`
            : ''
        }`
      );
    } else {
      router.push('/');
    }
  }, [
    router, storeSlug, isDineIn, table,
    isPreOrder, mode, cart, customerName, phone, notes,
  ]);

  // ── Shake 動畫 ─────────────────────────────────────────────────────────────
  const triggerShake = useCallback(() => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setContactShake(true);
    setTimeout(() => setContactShake(false), 520);
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (isPreOrder && contactInvalid) { triggerShake(); return; }
    if (cart.length === 0) return;
    setLoading(true);

    const orderData: OrderData = {
      id: `NW-${Date.now()}`,
      mode,
      table:        table         || undefined,
      storeName:    storeName     || undefined,
      storeSlug:    storeSlug     || undefined,
      customerName: isPreOrder    ? customerName.trim() : undefined,
      phone:        isPreOrder    ? phone.trim()         : undefined,
      notes:        notes.trim()  || undefined,
      cart, total,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    try {
      localStorage.setItem('nowait_order', JSON.stringify(orderData));
      try {
        const ex: OrderData[] = JSON.parse(localStorage.getItem('nowait_orders') || '[]');
        localStorage.setItem('nowait_orders', JSON.stringify([orderData, ...ex]));
      } catch {
        localStorage.setItem('nowait_orders', JSON.stringify([orderData]));
      }

      // ★ 訂單成立後，cart 和 draft 一起清掉（Problem B 修復）
      localStorage.removeItem('nowait_cart');
      localStorage.removeItem('nowait_checkout_draft');
    } catch (e) {
      console.error('[Checkout] 寫入失敗:', e);
    }

    setTimeout(() => { setLoading(false); router.push('/order/success'); }, 900);
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (!isCartLoaded) return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
        <p className="text-white/30 text-sm">載入中...</p>
      </div>
    </main>
  );

  // ── Empty Cart ─────────────────────────────────────────────────────────────
  if (cart.length === 0) return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-xs">
        <p className="text-6xl">🛒</p>
        <div>
          <p className="text-2xl font-black text-white mb-2">購物車是空的</p>
          <p className="text-base text-white/40">請先回到菜單選餐</p>
        </div>
        <button
          onClick={handleBack}
          className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black text-lg hover:bg-yellow-300 active:scale-95 transition-all"
        >
          返回菜單點餐
        </button>
      </div>
    </main>
  );

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        @keyframes shake {
          0%,100%{ transform:translateX(0) }
          15%    { transform:translateX(-10px) }
          30%    { transform:translateX(10px) }
          45%    { transform:translateX(-7px) }
          60%    { transform:translateX(7px) }
          75%    { transform:translateX(-4px) }
          90%    { transform:translateX(4px) }
        }
        .do-shake { animation: shake 0.52s cubic-bezier(.36,.07,.19,.97) both; }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .fu-1 { animation: fadeUp 0.45s 0.00s ease both; }
        .fu-2 { animation: fadeUp 0.45s 0.08s ease both; }
        .fu-3 { animation: fadeUp 0.45s 0.16s ease both; }
        .fu-4 { animation: fadeUp 0.45s 0.24s ease both; }

        input:-webkit-autofill,
        textarea:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #111 inset;
          -webkit-text-fill-color: #fff;
        }
      `}</style>

      {/* ══ STICKY NAV ═══════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-6 h-16 flex items-center justify-between">

          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm group"
          >
            <span className="group-hover:-translate-x-1 transition-transform inline-block text-base">←</span>
            <span>繼續點餐</span>
          </button>

          <div className={`
            flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold
            ${isDineIn
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-yellow-400/10 border border-yellow-400/20 text-yellow-400'}
          `}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDineIn ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
            {isDineIn ? `店內用餐${table ? `　桌號 ${table}` : ''}` : '預訂外帶'}
          </div>

          <p className="text-sm font-black text-yellow-400">NT${total.toLocaleString()}</p>
        </div>
      </nav>

      {/* ══ BODY ═════════════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-[1280px] px-6 pt-10 pb-28">

        {/* Page Title */}
        <div className="mb-10 fu-1">
          {storeName && (
            <p className="text-xs text-white/25 uppercase tracking-[0.25em] mb-2">{storeName}</p>
          )}
          <h1 className="text-5xl font-black tracking-tight leading-none">確認訂單</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* ─── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* ╔══════════════════╗
                ║   訂單內容卡片   ║
                ╚══════════════════╝ */}
            <div className="fu-2 rounded-3xl bg-[#111111] border border-white/10 overflow-hidden">

              {/* 標題列 */}
              <div className="px-8 py-6 border-b border-white/[0.08]">
                <h2 className="text-2xl font-black text-white tracking-tight">訂單內容</h2>
                <p className="text-base text-white/40 mt-1">可調整數量，或返回菜單繼續加點</p>
              </div>

              {/* 品項列表 */}
              <div className="px-8 py-6 space-y-3">
                {cart.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] px-6 py-5 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-xl leading-snug truncate">{item.name}</p>
                      <p className="text-base text-white/35 mt-0.5">NT${item.price.toLocaleString()} 元／份</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-10 h-10 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.12] active:scale-90 transition-all text-white font-bold text-xl flex items-center justify-center"
                        aria-label="減少數量"
                      >
                        −
                      </button>
                      <span className="w-7 text-center font-black text-xl text-white tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, +1)}
                        className="w-10 h-10 rounded-full bg-yellow-400 hover:bg-yellow-300 active:scale-90 transition-all text-black font-bold text-xl flex items-center justify-center shadow-[0_4px_16px_rgba(250,204,21,0.25)]"
                        aria-label="增加數量"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-28 text-right shrink-0">
                      <p className="text-yellow-400 font-black text-xl tabular-nums">NT${(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 小計 + 繼續加點 */}
              <div className="px-8 pb-8 border-t border-white/[0.06] pt-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-base text-white/30">共 {totalItems} 項商品</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-base">小計</span>
                    <span className="text-yellow-400 font-black text-2xl tabular-nums">NT${total.toLocaleString()}</span>
                  </div>
                </div>

                {/* ★ 繼續加點 CTA */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-white/75 hover:text-white hover:bg-white/[0.07] hover:border-white/20 active:scale-95 transition-all duration-150"
                >
                  <span className="text-base leading-none">←</span>
                  <span className="font-semibold text-base">繼續加點</span>
                </button>
              </div>
            </div>

            {/* ╔══════════════════════════════════╗
                ║  聯絡資訊（外帶，唯一高亮區塊）  ║
                ╚══════════════════════════════════╝ */}
            {isPreOrder && (
              <section
                ref={contactRef}
                className={`
                  fu-3 rounded-3xl overflow-hidden transition-all duration-300
                  ${contactShake ? 'do-shake' : ''}
                  ${contactInvalid && submitAttempted
                    ? 'border-2 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.12)]'
                    : 'border-2 border-yellow-400/60 shadow-[0_0_60px_rgba(250,204,21,0.14)]'}
                `}
              >
                {/* 黃色標題列 */}
                <div className={`
                  px-8 py-6 flex items-start justify-between gap-4
                  ${contactInvalid && submitAttempted ? 'bg-red-500' : 'bg-yellow-400'}
                `}>
                  <div>
                    <h2 className="text-2xl font-black text-black tracking-tight">聯絡資訊（必填）</h2>
                    <p className="text-base font-semibold text-black/60 mt-1">
                      {contactInvalid && submitAttempted
                        ? '⚠ 請填寫完整資料後再送出訂單'
                        : '預訂外帶 · 店家需要您的資料確認訂單'}
                    </p>
                  </div>
                  <span className={`
                    shrink-0 mt-0.5 text-xs font-black px-3 py-1.5 rounded-xl
                    ${contactInvalid && submitAttempted
                      ? 'bg-white text-red-500'
                      : 'bg-black text-yellow-400'}
                  `}>
                    REQUIRED
                  </span>
                </div>

                {/* 表單 */}
                <div className={`
                  px-8 py-8 space-y-8
                  ${contactInvalid && submitAttempted ? 'bg-[#1a0808]' : 'bg-[#14120a]'}
                `}>

                  {/* 姓名 */}
                  <div>
                    <label className="flex items-center gap-3 mb-3">
                      <span className={`w-7 h-7 rounded-full text-sm font-black flex items-center justify-center shrink-0
                        ${isNameValid ? 'bg-emerald-400 text-black' : 'bg-yellow-400 text-black'}`}>
                        {isNameValid ? '✓' : '1'}
                      </span>
                      <span className="text-xl font-bold text-white">聯絡姓名</span>
                      <span className="text-base font-bold text-red-400">必填</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="請輸入聯絡人姓名"
                      className={`
                        w-full bg-black/50 rounded-2xl px-6 py-5 text-white text-xl font-medium
                        placeholder:text-white/20 outline-none transition-all duration-200
                        ${showNameErr    ? 'border-2 border-red-500'
                          : isNameValid  ? 'border-2 border-emerald-500/60'
                          : 'border-2 border-white/10 focus:border-yellow-400/70'}
                      `}
                    />
                    {showNameErr && <p className="mt-2 text-base text-red-400 font-semibold">⚠ 請填寫聯絡姓名</p>}
                    {isNameValid && !showNameErr && <p className="mt-2 text-base text-emerald-400 font-semibold">✓ 已填寫</p>}
                  </div>

                  {/* 手機 */}
                  <div>
                    <label className="flex items-center gap-3 mb-3">
                      <span className={`w-7 h-7 rounded-full text-sm font-black flex items-center justify-center shrink-0
                        ${showPhoneOk ? 'bg-emerald-400 text-black' : 'bg-yellow-400 text-black'}`}>
                        {showPhoneOk ? '✓' : '2'}
                      </span>
                      <span className="text-xl font-bold text-white">手機號碼</span>
                      <span className="text-base font-bold text-red-400">必填</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="09xxxxxxxx（共 10 碼）"
                        maxLength={10}
                        className={`
                          w-full bg-black/50 rounded-2xl px-6 py-5 pr-16 text-white text-xl font-medium
                          placeholder:text-white/20 outline-none transition-all duration-200 tabular-nums
                          ${showPhoneErr  ? 'border-2 border-red-500'
                            : showPhoneOk ? 'border-2 border-emerald-500/60'
                            : 'border-2 border-white/10 focus:border-yellow-400/70'}
                        `}
                      />
                      {showPhoneOk  && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-400 text-2xl font-bold">✓</span>}
                      {showPhoneErr && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-red-400 text-2xl">✕</span>}
                    </div>
                    {showPhoneErr && <p className="mt-2 text-base text-red-400 font-semibold">⚠ 需為 09 開頭，共 10 碼</p>}
                    {showPhoneOk  && <p className="mt-2 text-base text-emerald-400 font-semibold">✓ 格式正確</p>}
                  </div>

                  {/* 備註 */}
                  <div>
                    <label className="flex items-center gap-3 mb-3">
                      <span className="w-7 h-7 rounded-full bg-white/10 text-white/30 text-sm font-black flex items-center justify-center shrink-0">3</span>
                      <span className="text-xl font-bold text-white/50">備註</span>
                      <span className="text-base text-white/25">選填</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="例：不要辣、過敏說明、預計幾點來取..."
                      rows={3}
                      className="w-full bg-black/50 border-2 border-white/10 rounded-2xl px-6 py-5 text-white text-xl font-medium placeholder:text-white/20 focus:border-yellow-400/50 outline-none transition-all duration-200 resize-none"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ╔══════════════════════════════╗
                ║  用餐資訊（內用，中性卡片）  ║
                ╚══════════════════════════════╝ */}
            {isDineIn && (
              <div className="fu-3 rounded-3xl bg-[#111111] border border-white/10 overflow-hidden">
                <div className="px-8 py-6 border-b border-white/[0.08] flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">用餐資訊</h2>
                    <p className="text-base text-white/40 mt-1">
                      {table ? `訂單將直接送至桌號 ${table}` : '訂單將送至您的桌位'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-bold text-emerald-400">店內用餐</span>
                  </div>
                </div>
                <div className="px-8 py-7">
                  {table && (
                    <div className="flex items-center gap-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] px-6 py-5 mb-7">
                      <span className="text-3xl">🪑</span>
                      <div>
                        <p className="text-base text-white/40">您的桌位</p>
                        <p className="text-3xl font-black text-white tracking-tight">
                          桌號 <span className="text-yellow-400">{table}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  <label className="block text-xl font-bold text-white/50 mb-3">
                    備註 <span className="text-white/25 font-normal text-base ml-2">選填</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="例：不要辣、過敏說明、特殊需求..."
                    rows={3}
                    className="w-full bg-black/50 border-2 border-white/10 rounded-2xl px-6 py-5 text-white text-xl font-medium placeholder:text-white/20 focus:border-yellow-400/50 outline-none transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            )}

          </div>

          {/* ─── RIGHT：訂單摘要 Sidebar ──────────────────────────────────── */}
          <aside className="fu-4 sticky top-[80px] space-y-4">

            <div className="rounded-3xl bg-[#111111] border border-white/10 overflow-hidden">

              <div className="px-7 py-6 border-b border-white/[0.08]">
                <h2 className="text-2xl font-black text-white tracking-tight">訂單摘要</h2>
                <p className="text-base text-white/40 mt-1">確認後即可送出</p>
              </div>

              <div className="px-7 py-5 space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-sm font-black text-white/50 shrink-0 tabular-nums">
                        {item.quantity}
                      </span>
                      <span className="text-base text-white/60 truncate font-medium">{item.name}</span>
                    </div>
                    <span className="text-base text-white/70 font-bold shrink-0 tabular-nums">
                      NT${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-7 pt-5 pb-7 border-t border-white/[0.08] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-base text-white/35">品項數量</span>
                  <span className="text-base text-white/50 font-semibold">{totalItems} 項</span>
                </div>
                {table && (
                  <div className="flex justify-between items-center">
                    <span className="text-base text-white/35">桌號</span>
                    <span className="text-base text-yellow-400 font-bold">#{table}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-white/[0.08]">
                  <span className="text-xl font-black text-white">總計</span>
                  <span className="text-yellow-400 font-black text-3xl tabular-nums tracking-tight">
                    NT${total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 警告 Banner */}
            {isPreOrder && (
              <div className={`
                rounded-2xl px-5 py-4 border text-base font-semibold leading-7 transition-all duration-300
                ${contactInvalid && submitAttempted
                  ? 'bg-red-500/10 border-red-500/40 text-red-300'
                  : 'bg-white/[0.03] border-white/[0.08] text-white/40'}
              `}>
                {contactInvalid && submitAttempted
                  ? <><span className="text-red-400 mr-1">❌</span>請先填寫左側 <strong className="text-white">聯絡姓名與手機</strong> 再送出</>
                  : <><span className="text-yellow-400 mr-1">⚠</span>送出前請確認左側 <strong className="text-white/70">聯絡資訊</strong> 已填寫完整</>
                }
              </div>
            )}

            {/* 確認下單按鈕 */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`
                w-full py-6 rounded-2xl font-black text-xl tracking-wide transition-all duration-200 active:scale-[0.97]
                ${loading
                  ? 'bg-white/[0.06] text-white/25 cursor-not-allowed border border-white/[0.08]'
                  : 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-[0_8px_40px_rgba(250,204,21,0.28)] hover:shadow-[0_8px_48px_rgba(250,204,21,0.40)]'}
              `}
            >
              {loading
                ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    處理中...
                  </span>
                )
                : `${isDineIn ? '確認點餐' : '確認下單'}　·　NT$${total.toLocaleString()}`
              }
            </button>

            <p className="text-center text-sm text-white/20 px-2 leading-relaxed">
              {isDineIn
                ? '送出後即確認訂單，餐點將直接送至您的桌位'
                : '送出後店家將依您的聯絡資訊確認預訂'}
            </p>
          </aside>

        </div>
      </div>
    </main>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
          <p className="text-white/30 text-sm">載入中...</p>
        </div>
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
