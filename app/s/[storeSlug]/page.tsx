'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

type Category = '全部' | '主食' | '小菜' | '配品' | '飲料';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCategory(name: string): Category {
  if (
    name.includes('麵') ||
    name.includes('飯') ||
    name.includes('米粉') ||
    name.includes('冬粉')
  ) return '主食';

  if (
    name.includes('茶') ||
    name.includes('奶') ||
    name.includes('可樂') ||
    name.includes('紅茶') ||
    name.includes('綠茶') ||
    name.includes('冬瓜') ||
    name.includes('咖啡')
  ) return '飲料';

  if (name.includes('菜')) return '小菜';

  return '配品';
}

function getCardStyle(category: Category) {
  switch (category) {
    case '主食': return 'from-amber-950/70 via-orange-950/55 to-zinc-900';
    case '小菜': return 'from-emerald-950/55 via-slate-900 to-zinc-900';
    case '配品': return 'from-sky-950/55 via-slate-900 to-zinc-900';
    case '飲料': return 'from-fuchsia-950/45 via-slate-900 to-zinc-900';
    default:     return 'from-zinc-900 via-zinc-900 to-black';
  }
}

function getDescription(name: string) {
  if (name.includes('清燉')) return '溫潤湯頭，口感清爽，適合喜歡清淡風味的人。';
  if (name.includes('牛筋')) return '麵體Q彈，帶點嚼勁，香氣更有層次。';
  if (name.includes('牛肉')) return '經典招牌口味，湯頭濃郁，風味飽滿順口。';
  if (name.includes('雞腿')) return '份量扎實，口味家常，飽足感十足。';
  if (name.includes('滷肉飯')) return '台味經典，鹹香下飯，簡單卻非常耐吃。';
  if (name.includes('菜')) return '清爽配菜，平衡口感，搭配主食剛剛好。';
  if (name.includes('蛋')) return '簡單加點，口感滑順，搭配主食很適合。';
  if (name.includes('湯')) return '暖胃順口，適合作為搭配品項。';
  if (name.includes('茶') || name.includes('飲')) return '清涼解膩，適合搭配熱食一起享用。';
  return '精選人氣商品，適合搭配店內主打品項。';
}

function getFoodEmoji(name: string) {
  if (name.includes('牛')) return '🍜';
  if (name.includes('雞')) return '🍗';
  if (name.includes('飯')) return '🍚';
  if (name.includes('湯')) return '🥣';
  if (name.includes('茶')) return '🧋';
  if (name.includes('蛋')) return '🥚';
  if (name.includes('菜')) return '🥬';
  return '🍽️';
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const storeSlug =
    (params?.storeSlug as string) ||
    (params?.slug as string) ||
    '';

  // ── URL params ────────────────────────────────────────────────────────────
  const urlMode = searchParams.get('mode');
  const urlTable = searchParams.get('table') ?? '';

  // 沒有明確 dinein 就預設 pickup
  const checkoutMode: 'dinein' | 'pickup' =
    urlMode === 'dinein' ? 'dinein' : 'pickup';

  // ── State ─────────────────────────────────────────────────────────────────
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('全部');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const filteredItems = useMemo(() => {
    if (selectedCategory === '全部') return menuItems;
    return menuItems.filter((item) => getCategory(item.name) === selectedCategory);
  }, [menuItems, selectedCategory]);

  // ── 初始化：先讀 localStorage 的 cart，再允許同步寫回 ─────────────────────
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

  // ── cart 變動時同步回 localStorage（避免初始空值覆蓋）─────────────────────
  useEffect(() => {
    if (!isCartLoaded) return;
    localStorage.setItem('nowait_cart', JSON.stringify(cart));
  }, [cart, isCartLoaded]);

  // ── Fetch menu ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setError('');

        const { data, error: supabaseError } = await supabase
          .from('menu')
          .select('*')
          .order('price', { ascending: false });

        if (supabaseError) throw supabaseError;

        setMenuItems(data || []);
      } catch (err) {
        console.error('[Store] 菜單載入失敗', err);
        setError('菜單暫時無法載入，請稍後再試。');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // ── Cart handlers ─────────────────────────────────────────────────────────
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: nextQty } : item
      )
    );
  };

  // ── Checkout ──────────────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('請先加入餐點');
      return;
    }

    // 保留店家資訊
    localStorage.setItem(
      'nowait_store',
      JSON.stringify({
        name: '陳記正宗牛肉麵',
        slug: storeSlug || 'chen-beef-noodle',
      })
    );
    localStorage.setItem('nowait_store_slug', storeSlug || 'chen-beef-noodle');

    const checkoutParams = new URLSearchParams();
    checkoutParams.set('mode', checkoutMode);
    if (urlTable) checkoutParams.set('table', urlTable);

    router.push(`/checkout?${checkoutParams.toString()}`);
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl tracking-wide text-white/60">載入菜單中...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center space-y-5">
          <p className="text-4xl">⚠️</p>
          <div>
            <p className="text-lg font-semibold text-white mb-1">載入失敗</p>
            <p className="text-sm text-white/40">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-300 active:scale-95 transition-all"
          >
            重新載入
          </button>
        </div>
      </main>
    );
  }

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[1520px] px-6 py-10 lg:px-10">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-10">
          {/* LEFT */}
          <section>
            <header className="mb-10">
              <div className="border-b border-white/10 pb-5">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-500 text-black font-black text-xl">
                      N
                    </div>
                    <div>
                      <div className="text-base uppercase tracking-[0.32em] text-white/60">
                        NoWait
                      </div>
                      <div className="mt-1 text-base text-white/80">
                        牛肉麵專門店・台南
                      </div>
                    </div>
                  </div>

                  <div className="w-full text-center">
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08]">
                      陳記正宗牛肉麵
                    </h1>
                  </div>
                </div>
              </div>

              <div className="border-b border-white/10 py-5">
                <div className="flex flex-wrap items-center justify-center gap-4 text-base sm:text-lg text-white/80">
                  <span className="whitespace-nowrap">
                    目前席位 <span className="text-yellow-400 font-semibold">4 組</span>
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="whitespace-nowrap">
                    預計等待 <span className="text-yellow-400 font-semibold">12 分</span>
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="whitespace-nowrap text-green-400">
                    ● 廚房順暢接單中
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="whitespace-nowrap">🟢 11:00 - 21:00</span>
                </div>
              </div>

              {checkoutMode === 'dinein' && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-400/80">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
                  店內用餐模式
                  {urlTable && (
                    <span className="text-yellow-400 font-semibold ml-1">
                      ・桌號 {urlTable}
                    </span>
                  )}
                </div>
              )}
            </header>

            {/* Category Filter */}
            <div className="mb-10 border-b border-white/10 pb-5">
              <div className="flex flex-wrap items-center gap-6 text-base sm:text-lg">
                {(['全部', '主食', '小菜', '配品', '飲料'] as Category[]).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`transition-all ${
                      selectedCategory === category
                        ? 'text-yellow-400 font-semibold'
                        : 'text-white/50 hover:text-white/85'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Header */}
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-white/35 mb-3">
                  Signature Menu
                </p>
                <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
                  精選菜單
                </h2>
              </div>
              <p className="text-base text-white/35">{filteredItems.length} items</p>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const category = getCategory(item.name);
                const qty = cart.find((c) => c.id === item.id)?.quantity || 0;

                return (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0a] transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400/25 hover:shadow-[0_20px_60px_rgba(234,179,8,0.08)]"
                  >
                    <div className={`bg-gradient-to-br ${getCardStyle(category)} p-5`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm uppercase tracking-[0.22em] text-white/60">
                            {category}
                          </p>
                          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                            {item.name}
                          </h3>
                        </div>
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
                          {getFoodEmoji(item.name)}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-base leading-7 text-white/55 min-h-[84px]">
                        {getDescription(item.name)}
                      </p>

                      <div className="mt-5 flex items-center justify-between">
                        <p className="text-3xl font-bold text-yellow-400">
                          NT${item.price}
                        </p>
                        <p className="text-base text-white/35">
                          已選 <span className="text-white font-semibold">{qty}</span> 份
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-5 py-3 text-base font-semibold text-yellow-300 transition hover:bg-yellow-400/20"
                        >
                          + 加入選單
                        </button>

                        {qty > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, qty - 1)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg hover:bg-white/10 active:scale-90 transition-all"
                            >
                              −
                            </button>
                            <span className="min-w-[28px] text-center text-base font-semibold">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, qty + 1)}
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-lg font-semibold text-black hover:bg-yellow-300 active:scale-90 transition-all"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="xl:sticky xl:top-6 h-fit">
            <div className="rounded-[28px] border border-white/10 bg-[#0a0a0a] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
              <div className="mb-5">
                <div className="text-sm uppercase tracking-[0.24em] text-white/35 mb-2">
                  Receipt
                </div>
                <h2 className="text-3xl font-semibold">陳記正宗牛肉麵 訂單</h2>
              </div>

              <div className="border-t border-dashed border-white/10 pt-4">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-white/35 text-base">
                    購物車是空的
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id}>
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-medium">{item.name}</p>
                            <p className="text-sm text-white/35">
                              NT${item.price} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-yellow-400">
                              NT${item.price * item.quantity}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-base hover:bg-white/10 active:scale-95 transition-all"
                          >
                            −
                          </button>
                          <div className="min-w-[44px] text-center text-base font-semibold">
                            {item.quantity}
                          </div>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex-1 rounded-lg bg-yellow-400 py-2.5 text-base font-semibold text-black hover:bg-yellow-300 active:scale-95 transition-all"
                          >
                            +
                          </button>
                        </div>

                        <div className="mt-4 border-b border-dashed border-white/10" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-dashed border-white/10 pt-4">
                <div className="mb-2 flex items-center justify-between text-base text-white/55">
                  <span>項數</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-semibold">小計</span>
                  <span className="text-4xl font-bold text-yellow-400">
                    NT${totalAmount}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`mt-6 w-full rounded-2xl py-4 text-lg font-semibold transition active:scale-95 ${
                  cart.length === 0
                    ? 'cursor-not-allowed bg-white/10 text-white/30'
                    : 'bg-yellow-400 text-black hover:bg-yellow-300'
                }`}
              >
                {checkoutMode === 'dinein' ? '📲 確認點餐' : '🛍 前往結帳'}
              </button>

              {checkoutMode === 'dinein' && urlTable && (
                <p className="text-center text-xs text-white/25 mt-3">
                  桌號 <span className="text-yellow-400/60">{urlTable}</span>
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}