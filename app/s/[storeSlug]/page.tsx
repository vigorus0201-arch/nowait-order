'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MenuCard, CATEGORY_GRADIENTS } from '@/components/MenuCard';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       '#0D0D0F',
  surface:  '#141416',
  card:     '#1A1A1E',
  border:   'rgba(255,255,255,0.07)',
  gold:     '#C8973A',
  goldLt:   '#E4B55A',
  goldDim:  'rgba(200,151,58,0.12)',
  goldBdr:  'rgba(200,151,58,0.25)',
  green:    '#2ECC8A',
  text:     '#F0EDE8',
  muted:    'rgba(240,237,232,0.45)',
  faint:    'rgba(240,237,232,0.10)',
}

const FONT = "'DM Sans', 'Noto Serif TC', sans-serif"

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  sort_order?: number | null;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const storeSlug =
    (params?.storeSlug as string) ||
    (params?.slug as string) ||
    '';

  const urlMode  = searchParams.get('mode');
  const urlTable = searchParams.get('table') ?? '';

  const isInstore = urlMode === 'instore';

  // ── State ──────────────────────────────────────────────────────────────────
  const [checkoutMode, setCheckoutMode] = useState<'dinein' | 'pickup'>('dinein');
  const [menuItems,        setMenuItems]        = useState<MenuItem[]>([]);
  const [cart,             setCart]             = useState<CartItem[]>([]);
  const [categories,       setCategories]       = useState<CategoryRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [loading,          setLoading]          = useState(true);
  const [error, setError] = useState('');
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const catGradMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c, i) => map.set(c.name, CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]));
    return map;
  }, [categories]);

  const catOrderMap = useMemo(() => new Map(categories.map((c, i) => [c.name, i])), [categories]);

  const filteredItems = useMemo(() => {
    const base = selectedCategory === '全部'
      ? menuItems
      : menuItems.filter((item) => (item.category || '') === selectedCategory);
    return [...base].sort((a, b) => {
      const catA = catOrderMap.get(a.category || '') ?? 999;
      const catB = catOrderMap.get(b.category || '') ?? 999;
      if (catA !== catB) return catA - catB;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }, [menuItems, selectedCategory, catOrderMap]);

  // ── Init: localStorage ─────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('nowait_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCart(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error('[Store] localStorage cart 讀取失敗', e);
    } finally {
      setIsCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isCartLoaded) return;
    localStorage.setItem('nowait_cart', JSON.stringify(cart));
  }, [cart, isCartLoaded]);

  // ── Fetch menu + categories ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setError('');
        const [menuRes, catRes] = await Promise.all([
          supabase.from('menu').select('*').eq('store_slug', storeSlug).neq('available', false).order('sort_order', { ascending: true }),
          supabase.from('categories').select('id, name, sort_order').eq('store_slug', storeSlug).order('sort_order', { ascending: true }),
        ]);
        if (menuRes.error) throw menuRes.error;
        setMenuItems(menuRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error('[Store] 載入失敗', err);
        setError('菜單暫時無法載入，請稍後再試。');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [storeSlug]);

  // ── Cart handlers ──────────────────────────────────────────────────────────
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) return prev.map((p) => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, nextQty: number) => {
    if (nextQty <= 0) { setCart((prev) => prev.filter((item) => item.id !== id)); return; }
    setCart((prev) => prev.map((item) => item.id === id ? { ...item, quantity: nextQty } : item));
  };

  // ── Checkout ───────────────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (cart.length === 0) { alert('請先加入餐點'); return; }
    localStorage.setItem('nowait_store', JSON.stringify({
      name: '陳記正宗牛肉麵',
      slug: storeSlug || 'chen-beef-noodle',
    }));
    localStorage.setItem('nowait_store_slug', storeSlug || 'chen-beef-noodle');
    const checkoutParams = new URLSearchParams();
    checkoutParams.set('mode', checkoutMode);
    if (urlTable) checkoutParams.set('table', urlTable);
    if (isInstore) checkoutParams.set('instore', '1');
    router.push(`/checkout?${checkoutParams.toString()}`);
  };

  // ── Cart Panel (shared between sidebar & mobile sheet) ────────────────────
  const CartPanel = () => (
    <div style={{
      background:   C.card,
      border:       `1px solid ${C.border}`,
      borderRadius: '20px',
      padding:      '24px',
      fontFamily:   FONT,
    }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: C.muted, marginBottom: '6px' }}>
          Receipt
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: 0, fontFamily: "'Noto Serif TC', serif" }}>
          陳記正宗牛肉麵 訂單
        </h2>
      </div>

      <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: '16px' }}>
        {cart.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: C.muted, fontSize: '14px' }}>
            購物車是空的
          </div>
        ) : (
          <div>
            {cart.map((item) => (
              <div key={item.id} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: C.text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                    <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>NT${item.price} × {item.quantity}</p>
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: C.goldLt, margin: 0, flexShrink: 0 }}>
                    NT${item.price * item.quantity}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: '10px',
                      border: `1px solid ${C.border}`, background: C.faint,
                      color: C.text, fontSize: '16px', cursor: 'pointer',
                      minHeight: '44px',
                    }}
                  >−</button>
                  <div style={{ minWidth: '44px', textAlign: 'center', fontSize: '15px', fontWeight: 600, color: C.text }}>
                    {item.quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: '10px',
                      border: 'none', background: C.gold,
                      color: '#0D0D0F', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                      minHeight: '44px',
                    }}
                  >+</button>
                </div>
                <div style={{ marginTop: '16px', borderBottom: `1px dashed ${C.border}` }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '16px', borderTop: `1px dashed ${C.border}`, paddingTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: C.muted }}>項數</span>
          <span style={{ fontSize: '13px', color: C.muted }}>{totalItems}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: C.text }}>小計</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: C.goldLt, fontFamily: "'DM Sans', sans-serif" }}>
            NT${totalAmount}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={cart.length === 0}
        style={{
          marginTop:    '20px',
          width:        '100%',
          padding:      '16px',
          borderRadius: '14px',
          border:       'none',
          background:   cart.length === 0
            ? C.faint
            : `linear-gradient(135deg, ${C.gold}, #A0722A)`,
          color:        cart.length === 0 ? C.muted : '#0D0D0F',
          fontSize:     '16px',
          fontWeight:   700,
          cursor:       cart.length === 0 ? 'not-allowed' : 'pointer',
          fontFamily:   FONT,
          boxShadow:    cart.length === 0 ? 'none' : '0 4px 16px rgba(200,151,58,0.35)',
          minHeight:    '52px',
        }}
      >
        {checkoutMode === 'dinein' ? '📲 確認點餐' : '前往結帳'}
      </button>

      {checkoutMode === 'dinein' && urlTable && (
        <p style={{ textAlign: 'center', fontSize: '11px', color: C.muted, marginTop: '10px' }}>
          桌號 <span style={{ color: C.gold }}>{urlTable}</span>
        </p>
      )}
    </div>
  );

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
        <div style={{ fontSize: '16px', color: C.muted, letterSpacing: '0.06em' }}>載入菜單中...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: FONT }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</p>
          <p style={{ fontSize: '17px', fontWeight: 600, color: C.text, marginBottom: '6px' }}>載入失敗</p>
          <p style={{ fontSize: '13px', color: C.muted, marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 32px', background: `linear-gradient(135deg, ${C.gold}, #A0722A)`,
              color: '#0D0D0F', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
            }}
          >
            重新載入
          </button>
        </div>
      </main>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        .cat-btn:hover { color: ${C.text} !important; }
        .menu-card:hover { transform: translateY(-2px); border-color: ${C.goldBdr} !important; box-shadow: 0 20px 60px rgba(200,151,58,0.08) !important; }
        .add-btn:hover { background: rgba(200,151,58,0.2) !important; }
        .qty-minus:hover { background: rgba(255,255,255,0.12) !important; }
        .cart-btn:hover { background: #A0722A !important; }
        .mobile-cart-sheet { transition: transform 0.35s cubic-bezier(0.4,0,0.2,1); }
        @keyframes modePulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>

      {/* ── Sticky Mode Banner ── */}
      <div style={{
        position:     'sticky', top: 0, zIndex: 40,
        background:   'rgba(13,13,15,0.88)',
        borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding:      '10px 16px',
      }}>
        <div style={{
          maxWidth: '1520px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>

          {/* 左側：掃碼模式 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            {isInstore ? (
              <>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                  background: '#2ECC8A',
                  animation: 'modePulse 2s ease-in-out infinite',
                }} />
                <span style={{ fontSize: '13px', color: '#2ECC8A', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  到店掃碼
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '13px' }}>📱</span>
                <span style={{ fontSize: '13px', color: C.goldLt, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  遠端點餐
                </span>
              </>
            )}
            {urlTable && checkoutMode === 'dinein' && (
              <>
                <span style={{ color: C.border }}>·</span>
                <span style={{ fontSize: '13px', color: C.goldLt, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  桌號 {urlTable}
                </span>
              </>
            )}
          </div>

          {/* 右側：內用/外帶切換（總是顯示） */}
          <div style={{
            display: 'flex', gap: '4px',
            background: C.surface, borderRadius: '10px',
            padding: '3px', border: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            {(['dinein', 'pickup'] as const).map((m) => {
              const active = checkoutMode === m
              return (
                <button
                  key={m}
                  onClick={() => setCheckoutMode(m)}
                  style={{
                    padding:      '6px 14px',
                    borderRadius: '7px',
                    border:       'none',
                    background:   active
                      ? (m === 'dinein' ? 'rgba(46,204,138,0.15)' : C.goldDim)
                      : 'transparent',
                    color:        active
                      ? (m === 'dinein' ? '#2ECC8A' : C.goldLt)
                      : C.muted,
                    fontSize:     '12px',
                    fontWeight:   active ? 700 : 400,
                    cursor:       'pointer',
                    fontFamily:   FONT,
                    transition:   'all 0.18s',
                    whiteSpace:   'nowrap',
                  }}
                >
                  {m === 'dinein' ? '店內' : '外帶'}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1520px', margin: '0 auto', padding: '32px 20px', paddingBottom: totalItems > 0 ? '120px' : '40px' }}
        className="lg:px-10">

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]" style={{ gap: '40px' }}>

          {/* ── LEFT: Menu ── */}
          <section>

            {/* Header */}
            <header style={{ marginBottom: '32px' }}>
              <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
                      background: `linear-gradient(135deg, ${C.gold}, #A0722A)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Noto Serif TC', serif", fontWeight: 900, fontSize: '22px',
                      color: '#0D0D0F', boxShadow: '0 8px 24px rgba(200,151,58,0.35)',
                    }}>
                      店
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.muted }}>
                        NoWait
                      </div>
                      <div style={{ fontSize: '13px', color: C.muted, marginTop: '2px' }}>
                        牛肉麵專門店・台南
                      </div>
                    </div>
                  </div>

                  <h1 style={{
                    fontSize: 'clamp(32px, 8vw, 64px)',
                    fontWeight: 600,
                    color: C.text,
                    margin: 0,
                    lineHeight: 1.08,
                    letterSpacing: '-0.02em',
                    fontFamily: "'Noto Serif TC', serif",
                  }}>
                    陳記正宗牛肉麵
                  </h1>
                </div>
              </div>

              <div style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 0' }}>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                  justifyContent: 'center', gap: '12px 20px',
                  fontSize: '14px', color: C.muted,
                }}>
                  <span>
                    目前席位 <span style={{ color: C.goldLt, fontWeight: 600 }}>4 組</span>
                  </span>
                  <span style={{ color: C.border }}>|</span>
                  <span>
                    預計等待 <span style={{ color: C.goldLt, fontWeight: 600 }}>12 分</span>
                  </span>
                  <span style={{ color: C.border }}>|</span>
                  <span style={{ color: '#2ECC8A' }}>● 廚房順暢接單中</span>
                  <span style={{ color: C.border }}>|</span>
                  <span>🟢 11:00 - 21:00</span>
                </div>
              </div>

            </header>

            {/* Category Filter */}
            <div style={{ marginBottom: '32px', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 24px' }}>
                {(['全部', ...categories.map(c => c.name)]).map((category) => (
                  <button
                    key={category}
                    type="button"
                    className="cat-btn"
                    onClick={() => setSelectedCategory(category)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '15px', fontWeight: selectedCategory === category ? 700 : 400,
                      color: selectedCategory === category ? C.goldLt : C.muted,
                      fontFamily: FONT, padding: '4px 0', minHeight: '44px',
                      transition: 'color 0.2s',
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Section Header */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: C.muted, margin: '0 0 8px' }}>
                  Signature Menu
                </p>
                <h2 style={{
                  fontSize: 'clamp(28px, 5vw, 40px)',
                  fontWeight: 600,
                  color: C.text,
                  margin: 0,
                  letterSpacing: '-0.02em',
                  fontFamily: "'Noto Serif TC', serif",
                }}>
                  精選菜單
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: C.muted, flexShrink: 0 }}>{filteredItems.length} items</p>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3" style={{ gap: '16px' }}>
              {filteredItems.map((item) => {
                const category = item.category || '';
                const gradient = catGradMap.get(category) ?? CATEGORY_GRADIENTS[CATEGORY_GRADIENTS.length - 1];
                const qty = cart.find((c) => c.id === item.id)?.quantity || 0;
                return (
                  <MenuCard
                    key={item.id}
                    item={item}
                    qty={qty}
                    gradient={gradient}
                    onAdd={() => addToCart(item)}
                    onRemove={() => updateQuantity(item.id, qty - 1)}
                  />
                );
              })}
            </div>
          </section>

          {/* ── RIGHT: Cart Sidebar (xl+ only) ── */}
          <aside className="hidden xl:block" style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
            <CartPanel />
          </aside>
        </div>
      </div>

      {/* ── Mobile Floating Cart Bar (below xl) ── */}
      {totalItems > 0 && (
        <div
          className="xl:hidden"
          style={{
            position:     'fixed',
            bottom:       0,
            left:         0,
            right:        0,
            zIndex:       50,
            padding:      '12px 16px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            background:   'rgba(13,13,15,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop:    `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: 'flex', gap: '10px', maxWidth: '600px', margin: '0 auto' }}>
            {/* Cart Preview Button */}
            <button
              type="button"
              onClick={() => setShowMobileCart(true)}
              style={{
                flex:         1,
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'space-between',
                padding:      '0 16px',
                height:       '52px',
                borderRadius: '14px',
                border:       `1px solid ${C.border}`,
                background:   C.card,
                cursor:       'pointer',
                fontFamily:   FONT,
                color:        C.text,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '26px', height: '26px', borderRadius: '8px',
                  background: C.gold, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '12px', fontWeight: 800,
                  color: '#0D0D0F',
                }}>
                  {totalItems}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>查看購物車</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: C.goldLt }}>
                NT${totalAmount}
              </span>
            </button>

            {/* Quick Checkout Button */}
            <button
              type="button"
              onClick={handleCheckout}
              style={{
                padding:      '0 20px',
                height:       '52px',
                borderRadius: '14px',
                border:       'none',
                background:   `linear-gradient(135deg, ${C.gold}, #A0722A)`,
                color:        '#0D0D0F',
                fontSize:     '15px',
                fontWeight:   700,
                cursor:       'pointer',
                fontFamily:   FONT,
                boxShadow:    '0 4px 16px rgba(200,151,58,0.4)',
                whiteSpace:   'nowrap',
                flexShrink:   0,
              }}
            >
              {checkoutMode === 'dinein' ? '確認點餐' : '前往結帳'}
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Cart Bottom Sheet ── */}
      {showMobileCart && (
        <div
          className="xl:hidden"
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setShowMobileCart(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet */}
          <div
            className="mobile-cart-sheet"
            style={{
              position:     'relative',
              background:   C.bg,
              borderRadius: '24px 24px 0 0',
              border:       `1px solid ${C.border}`,
              borderBottom: 'none',
              maxHeight:    '85vh',
              overflowY:    'auto',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Pull handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: C.faint }} />
            </div>

            {/* Sheet header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px 0',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.text, margin: 0, fontFamily: "'Noto Serif TC', serif" }}>
                購物車
              </h3>
              <button
                onClick={() => setShowMobileCart(false)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: `1px solid ${C.border}`, background: C.faint,
                  color: C.muted, fontSize: '18px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>

            <div style={{ padding: '16px 20px 20px' }}>
              <CartPanel />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
