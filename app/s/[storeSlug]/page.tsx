'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

type MenuItem = {
  id: string
  name: string
  price: number
  desc: string
  featured?: boolean
  prepTime?: number
  category: string
  soldOut?: boolean
  emoji?: string
}

type CartItem = MenuItem & {
  qty: number
  note: string
}

const DEMO_MENU: MenuItem[] = [
  {
    id: '1',
    name: '紅燒牛肉麵',
    price: 180,
    desc: '滷足 8 小時牛肋條，湯頭濃郁帶醬香。',
    featured: true,
    prepTime: 8,
    category: '主食',
    emoji: '🍜',
  },
  {
    id: '2',
    name: '清燉牛肉麵',
    price: 170,
    desc: '清爽湯頭，溫潤回甘，層次乾淨俐落。',
    prepTime: 8,
    category: '主食',
    emoji: '🍜',
  },
  {
    id: '3',
    name: '牛筋拌麵',
    price: 150,
    desc: 'Q 彈牛筋搭配特製醬汁，香氣厚實。',
    prepTime: 8,
    category: '主食',
    emoji: '🍜',
  },
  {
    id: '4',
    name: '滷味拼盤',
    price: 120,
    desc: '豆干、海帶、滷蛋與牛腱切片，經典搭配。',
    prepTime: 5,
    category: '小菜',
    emoji: '🥢',
  },
  {
    id: '5',
    name: '燙青菜',
    price: 60,
    desc: '每日新鮮時蔬，簡單清爽。',
    prepTime: 3,
    category: '小菜',
    emoji: '🥬',
  },
  {
    id: '6',
    name: '古早味紅茶',
    price: 40,
    desc: '冰鎮回甘，適合搭配牛肉麵。',
    prepTime: 2,
    category: '飲料',
    emoji: '🧋',
  },
  {
    id: '7',
    name: '冬瓜檸檬',
    price: 55,
    desc: '酸甜清爽，解膩首選。',
    prepTime: 2,
    category: '飲料',
    emoji: '🍋',
  },
  {
    id: '8',
    name: '半熟滷蛋',
    price: 25,
    desc: '滷香入味，蛋黃濕潤。',
    prepTime: 2,
    category: '加點',
    emoji: '🥚',
  },
]

const categories = ['全部', '主食', '小菜', '飲料', '加點']

function formatPrice(n: number) {
  return `NT$ ${n.toLocaleString('zh-TW')}`
}

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function saveOrderToSupabase(
  supabase: SupabaseClient,
  payload: {
    customer_name: string
    customer_phone: string
    items_json: {
      id: string
      name: string
      qty: number
      price: number
      note: string
      category: string
    }[]
    subtotal: number
    total_items: number
    status: string
  }
) {
  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export default function StorePage() {
  console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)

  const [menu, setMenu] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('全部')
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({})
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [nameError, setNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [successOrderId, setSuccessOrderId] = useState('')
  const [addedId, setAddedId] = useState<string | null>(null)

  const supabase = useMemo(() => getSupabaseClient(), [])

  useEffect(() => {
    setMenu(DEMO_MENU)
  }, [])

  useEffect(() => {
    if (!addedId) return
    const timer = setTimeout(() => setAddedId(null), 800)
    return () => clearTimeout(timer)
  }, [addedId])

  useEffect(() => {
    document.body.style.overflow = cartOpen || successOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [cartOpen, successOpen])

  const filteredMenu = useMemo(() => {
    if (activeCategory === '全部') return menu
    return menu.filter((item) => item.category === activeCategory)
  }, [menu, activeCategory])

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  )

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty * item.price, 0),
    [cart]
  )

  const cartPreview = useMemo(() => cart.slice(0, 4), [cart])

  const pageBottomPadding = cart.length === 0 ? 'pb-[136px]' : 'pb-[220px]'

  const getSelectedQty = (id: string) => selectedQty[id] || 1

  const changeSelectedQty = (id: string, type: 'plus' | 'minus') => {
    setSelectedQty((prev) => {
      const current = prev[id] || 1
      const next = type === 'plus' ? current + 1 : Math.max(1, current - 1)
      return { ...prev, [id]: next }
    })
  }

  const addToCart = (item: MenuItem) => {
    if (item.soldOut) return
    const qtyToAdd = getSelectedQty(item.id)

    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id)
      if (exists) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + qtyToAdd } : i
        )
      }
      return [...prev, { ...item, qty: qtyToAdd, note: '' }]
    })

    setAddedId(item.id)
  }

  const getButtonLabel = (item: MenuItem) => {
    const qty = getSelectedQty(item.id)
    const exists = cart.find((c) => c.id === item.id)

    if (item.soldOut) return '已售完'
    if (addedId === item.id && !exists) return `已加入 ${qty} 份`
    if (exists) return `再加 ${qty} 份`
    return `加入訂單 ${qty} 份`
  }

  const updateCartQty = (id: string, type: 'plus' | 'minus') => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item
          const nextQty = type === 'plus' ? item.qty + 1 : item.qty - 1
          return { ...item, qty: nextQty }
        })
        .filter((item) => item.qty > 0)
    )
  }

  const updateCartNote = (id: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note } : item))
    )
  }

  const validateCheckout = () => {
    let ok = true
    setNameError('')
    setPhoneError('')
    setSubmitError('')

    if (!customerName.trim()) {
      setNameError('請填寫姓名')
      ok = false
    }

    if (!/^09\d{8}$/.test(customerPhone.trim())) {
      setPhoneError('請輸入正確的台灣手機號碼')
      ok = false
    }

    if (cart.length === 0) {
      setSubmitError('購物車是空的，請先加入餐點')
      ok = false
    }

    return ok
  }

  const handleSubmitOrder = async () => {
    if (!validateCheckout()) return

    if (!supabase) {
      setSubmitError(
        '尚未讀到 Supabase 環境變數，請確認 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        items_json: cart.map((item) => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          note: item.note,
          category: item.category,
        })),
        subtotal,
        total_items: cartCount,
        status: 'new',
      }

      const inserted = await saveOrderToSupabase(supabase, payload)

      setSuccessOrderId(
        String(inserted?.id ?? `NW-${Date.now().toString().slice(-6)}`)
      )
      setSuccessOpen(true)
      setCartOpen(false)
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setSelectedQty({})
    } catch (error: any) {
      setSubmitError(error?.message || '訂單送出失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#05070c] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,197,66,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(23,48,122,0.28),transparent_28%),radial-gradient(circle_at_bottom,rgba(12,22,68,0.28),transparent_24%)]" />

      <div className={`relative mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8 ${pageBottomPadding}`}>
        <section className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4d166] to-[#c9a12f] text-xl font-semibold text-black shadow-[0_8px_30px_rgba(244,209,102,0.25)]">
                N
              </div>
              <div>
                <div className="text-3xl font-semibold tracking-tight text-[#f5ead0]">
                  NoWait
                </div>
                <div className="mt-1 text-sm tracking-[0.18em] text-[#d9b84e]">
                  牛肉麵專門店 ・ 台南
                </div>
              </div>
            </div>

            <div className="rounded-full border border-[#d8b246]/25 bg-[#d8b246]/10 px-4 py-2 text-sm text-[#f3d67b]">
              ⚡ LIVE
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-10 text-center">
            <h1
              className="text-5xl font-semibold leading-none sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "'Noto Serif TC','Noto Sans TC',serif" }}
            >
              <span className="block text-white">陳記正宗</span>
              <span className="mt-3 block text-[#e0b843]">牛肉麵</span>
            </h1>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                營業中
              </div>
              <div>11:00 – 21:00</div>
              <div>👥 今日 87 單</div>
            </div>

            <div className="mx-auto mt-8 grid max-w-6xl gap-4 rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(16,25,58,.78),rgba(8,13,28,.9))] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] sm:grid-cols-3">
              <div className="text-left">
                <div className="text-xs tracking-[0.18em] text-white/35">目前隊伍</div>
                <div className="mt-3 text-3xl font-semibold text-white">4 組</div>
              </div>
              <div className="text-left border-white/10 sm:border-l sm:pl-6">
                <div className="text-xs tracking-[0.18em] text-white/35">預計等待</div>
                <div className="mt-3 text-3xl font-semibold text-white">≈ 12 分</div>
              </div>
              <div className="text-left border-white/10 sm:border-l sm:pl-6">
                <div className="text-xs tracking-[0.18em] text-white/35">廚房狀態</div>
                <div className="mt-3 text-2xl font-semibold text-green-400">● 順暢接單中</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-6xl">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const active = category === activeCategory
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`min-w-[92px] rounded-full border px-6 py-3 text-base font-medium transition-all ${
                    active
                      ? 'border-[#d9b84e]/40 bg-[#d9b84e] text-black'
                      : 'border-white/10 bg-white/[0.02] text-white/75 hover:bg-white/[0.05]'
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-6xl">
          <div className="mb-5 flex items-end justify-between">
            <h2
              className="text-5xl font-semibold text-white"
              style={{ fontFamily: "'Noto Serif TC','Noto Sans TC',serif" }}
            >
              {activeCategory === '全部' ? '精選菜單' : activeCategory}
            </h2>
            <div className="text-sm text-white/50">{filteredMenu.length} 品項</div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredMenu.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                qty={getSelectedQty(item.id)}
                onMinus={() => changeSelectedQty(item.id, 'minus')}
                onPlus={() => changeSelectedQty(item.id, 'plus')}
                onAdd={() => addToCart(item)}
                buttonLabel={getButtonLabel(item)}
                justAdded={addedId === item.id}
              />
            ))}
          </div>
        </section>
      </div>

      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-20px)] max-w-4xl -translate-x-1/2 rounded-[28px] border border-[#d9b84e]/25 bg-[#0d111c]/95 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="text-left">
            <div className="text-sm tracking-[0.18em] text-white/40 uppercase">
              Order Summary
            </div>

            {cart.length === 0 ? (
              <div className="mt-2 text-base text-white/55">尚未加入餐點</div>
            ) : (
              <>
                <div className="mt-3 rounded-2xl border border-[#d9b84e]/12 bg-[#d9b84e]/6 p-4">
                  <div className="space-y-2">
                    {cartPreview.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <span className="truncate text-sm font-medium text-white/90">
                          {item.name} <span className="text-[#f0cb63]">×{item.qty}</span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-[#f1d06f]">
                          {formatPrice(item.qty * item.price)}
                        </span>
                      </div>
                    ))}

                    {cart.length > 4 && (
                      <div className="pt-1 text-sm text-white/45">
                        另有 {cart.length - 4} 項，點擊查看完整明細
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[#d9b84e]/50 to-transparent" />

                <div className="mt-4 flex items-end justify-between">
                  <div className="text-base text-white/75">{cartCount} 件商品</div>
                  <div className="text-right">
                    <div className="text-sm text-white/45">應付金額</div>
                    <div className="text-2xl font-bold text-[#f0cb63] drop-shadow-[0_0_16px_rgba(240,203,99,0.35)]">
                      {formatPrice(subtotal)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rounded-full bg-[#d9b84e]/15 px-6 py-4 text-sm font-medium text-[#f2d577]">
            查看訂單並結帳
          </div>
        </div>
      </button>

      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          cartOpen
            ? 'pointer-events-auto bg-black/60 opacity-100'
            : 'pointer-events-none bg-black/0 opacity-0'
        }`}
        onClick={() => setCartOpen(false)}
      />

      <aside
        className={`fixed bottom-0 left-0 right-0 z-[60] mx-auto max-h-[90vh] max-w-6xl rounded-t-[32px] border border-white/10 bg-[#090d17] shadow-[0_-18px_80px_rgba(0,0,0,0.55)] transition-transform duration-300 ${
          cartOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-xs tracking-[0.18em] text-white/35 uppercase">
              Checkout
            </div>
            <h3
              className="mt-2 text-3xl font-semibold text-white"
              style={{ fontFamily: "'Noto Serif TC','Noto Sans TC',serif" }}
            >
              訂單確認
            </h3>
          </div>

          <button
            onClick={() => setCartOpen(false)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            關閉
          </button>
        </div>

        <div className="grid max-h-[calc(90vh-96px)] overflow-y-auto lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            {cart.length === 0 ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
                <div className="text-5xl">🛒</div>
                <h4 className="mt-5 text-2xl font-semibold text-white">
                  購物車是空的
                </h4>
                <p className="mt-3 max-w-md text-sm leading-7 text-white/50">
                  先從上方菜單加入餐點，這裡會顯示完整訂單清單、備註、姓名、手機與送出訂單按鈕。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(18,26,56,.75),rgba(10,13,26,.92))] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">
                            {item.emoji || '🍽️'}
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold text-white">
                              {item.name}
                            </h4>
                            <p className="mt-1 text-sm text-white/50">
                              單價 {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="mb-2 block text-sm text-white/60">
                            備註
                          </label>
                          <textarea
                            value={item.note}
                            onChange={(e) => updateCartNote(item.id, e.target.value)}
                            placeholder="例如：不要香菜、少辣、麵硬一點..."
                            className="min-h-[90px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#d9b84e]/40"
                          />
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                          <button
                            onClick={() => updateCartQty(item.id, 'minus')}
                            className="px-4 py-3 text-white/70"
                          >
                            −
                          </button>
                          <div className="min-w-[48px] text-center text-sm font-medium text-white">
                            {item.qty}
                          </div>
                          <button
                            onClick={() => updateCartQty(item.id, 'plus')}
                            className="px-4 py-3 text-white/70"
                          >
                            ＋
                          </button>
                        </div>

                        <div className="mt-4 text-lg font-semibold text-[#f0cb63]">
                          {formatPrice(item.qty * item.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="rounded-[30px] border-2 border-[#d9b84e]/25 bg-[linear-gradient(180deg,rgba(217,184,78,.10),rgba(18,20,28,.9))] p-6 shadow-[0_12px_40px_rgba(217,184,78,0.08)]">
              <div className="mb-5">
                <div className="text-xs tracking-[0.18em] text-[#e0c46a]/70 uppercase">
                  Checkout
                </div>
                <h4
                  className="mt-2 text-3xl font-semibold text-white"
                  style={{ fontFamily: "'Noto Serif TC','Noto Sans TC',serif" }}
                >
                  確認訂單
                </h4>
                <p className="mt-2 text-sm leading-7 text-white/50">
                  請填寫姓名與手機，我們收到後會立即安排製作。
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/80">
                    ✦ 姓名
                  </label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="請輸入訂購人姓名"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-base text-white outline-none placeholder:text-white/25 focus:border-[#d9b84e]/40"
                  />
                  {nameError && (
                    <p className="mt-2 text-sm text-rose-300">{nameError}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/80">
                    ✦ 手機
                  </label>
                  <input
                    value={customerPhone}
                    onChange={(e) =>
                      setCustomerPhone(
                        e.target.value.replace(/\D/g, '').slice(0, 10)
                      )
                    }
                    inputMode="numeric"
                    placeholder="09xxxxxxxx"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-base text-white outline-none placeholder:text-white/25 focus:border-[#d9b84e]/40"
                  />
                  {phoneError && (
                    <p className="mt-2 text-sm text-rose-300">{phoneError}</p>
                  )}
                </div>

                <div className="rounded-[24px] border border-[#d9b84e]/12 bg-[#d9b84e]/6 p-4">
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <span className="truncate text-sm font-medium text-white/90">
                          {item.name} <span className="text-[#f0cb63]">×{item.qty}</span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-[#f1d06f]">
                          {formatPrice(item.qty * item.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="my-4 h-px bg-gradient-to-r from-transparent via-[#d9b84e]/50 to-transparent" />

                  <div className="flex items-end justify-between">
                    <span className="text-base text-white/75">應付金額</span>
                    <span className="text-2xl font-bold text-[#f0cb63] drop-shadow-[0_0_18px_rgba(240,203,99,0.4)]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>

                {submitError && (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                    {submitError}
                  </div>
                )}

                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting || cart.length === 0}
                  className={`w-full rounded-2xl px-4 py-4 text-base font-semibold transition ${
                    submitting || cart.length === 0
                      ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/35'
                      : 'border border-[#d9b84e]/30 bg-gradient-to-r from-[#cfab3d] to-[#f0cb63] text-[#221700] shadow-[0_10px_30px_rgba(217,184,78,0.22)] hover:brightness-105'
                  }`}
                >
                  {submitting
                    ? '訂單建立中...'
                    : `確認送出訂單｜${formatPrice(subtotal)}`}
                </button>

                <p className="text-xs leading-6 text-white/35">
                  手機格式需為台灣手機，例如 0912345678。訂單將寫入 Supabase 的
                  orders 資料表。
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {successOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] border border-[#d9b84e]/20 bg-[#0b0f19] p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-400/25 bg-green-500/10 text-4xl">
              ✅
            </div>

            <h3
              className="mt-6 text-4xl font-semibold text-white"
              style={{ fontFamily: "'Noto Serif TC','Noto Sans TC',serif" }}
            >
              訂單完成
            </h3>

            <p className="mt-3 text-base leading-8 text-white/60">
              我們已收到你的訂單，預計{' '}
              <span className="text-[#f0cb63]">12 分鐘</span> 內完成。
            </p>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-left">
              <div className="flex items-center justify-between text-sm text-white/55">
                <span>訂單編號</span>
                <span className="font-medium text-white">{successOrderId}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-white/55">
                <span>狀態</span>
                <span className="font-medium text-green-400">已建立</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-white/55">
                <span>預估完成</span>
                <span className="font-medium text-[#f0cb63]">約 12 分鐘</span>
              </div>
            </div>

            <button
              onClick={() => setSuccessOpen(false)}
              className="mt-6 w-full rounded-2xl border border-[#d9b84e]/25 bg-[#d9b84e]/12 px-4 py-4 text-sm font-medium text-[#f0cb63] hover:bg-[#d9b84e]/18"
            >
              返回菜單
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

function MenuCard({
  item,
  qty,
  onMinus,
  onPlus,
  onAdd,
  buttonLabel,
  justAdded,
}: {
  item: MenuItem
  qty: number
  onMinus: () => void
  onPlus: () => void
  onAdd: () => void
  buttonLabel: string
  justAdded: boolean
}) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(13,24,58,.78),rgba(6,12,30,.95))] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] transition-all duration-300 hover:border-[#d9b84e]/30 hover:shadow-[0_20px_60px_rgba(217,184,78,0.08)]">
      <div className="flex h-full flex-col">
        <div className="min-h-[124px]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {item.featured && (
                <div className="mb-3 inline-flex rounded-full bg-[#d9b84e] px-3 py-1 text-xs font-medium text-black">
                  招牌必點
                </div>
              )}

              <h3
                className="text-2xl font-semibold text-white"
                style={{ fontFamily: "'Noto Serif TC','Noto Sans TC',serif" }}
              >
                {item.name}
              </h3>

              <p className="mt-2 line-clamp-2 min-h-[56px] text-sm leading-7 text-white/60">
                {item.desc}
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl">
              {item.emoji || '🍽️'}
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="grid min-h-[72px] grid-cols-[1fr_auto] items-end gap-3">
          <div className="text-5xl font-semibold tracking-tight text-white">
            ${item.price}
          </div>
          <div className="text-sm text-white/50">◔ 約 {item.prepTime || 8} 分</div>
        </div>

        <div className="mt-5 min-h-[118px] rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <button
              onClick={onMinus}
              disabled={item.soldOut}
              className="justify-self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-lg text-white/80 transition hover:text-white disabled:opacity-30"
            >
              −
            </button>

            <div className="px-4 text-center">
              <div className="text-2xl font-semibold text-white">{qty} 份</div>
            </div>

            <button
              onClick={onPlus}
              disabled={item.soldOut}
              className="justify-self-end rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-lg text-white/80 transition hover:text-white disabled:opacity-30"
            >
              ＋
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-white/45">此次小計</span>
            <span className="font-medium text-[#f0cb63]">
              {formatPrice(item.price * qty)}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={onAdd}
            disabled={item.soldOut}
            className={`w-full rounded-2xl px-4 py-4 text-base font-medium transition-all duration-300 ${
              item.soldOut
                ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/35'
                : justAdded
                ? 'border border-green-400/30 bg-green-500/15 text-green-200'
                : 'border border-[#5d7dff]/35 bg-[#4a5ee6] text-white hover:bg-[#5569ef]'
            }`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}