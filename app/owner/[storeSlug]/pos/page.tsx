'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateOrderCode } from '@/lib/generateOrderCode'
import { MenuCard, CATEGORY_GRADIENTS } from '@/components/MenuCard'

// ─── Types ────────────────────────────────────────────────────────────────────
type MenuItem     = { id: string; name: string; price: number; category: string | null; sort_order?: number | null }
type CartItem     = { id: string; name: string; price: number; qty: number }
type Mode         = 'dinein' | 'pickup'
type CategoryRow  = { id: string; name: string; sort_order: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('zh-TW')


// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       '#0D0D0F',
  surface:  '#141416',
  card:     '#1A1A1E',
  border:   'rgba(255,255,255,0.07)',
  gold:     '#C8973A',
  goldLt:   '#E4B55A',
  goldDim:  'rgba(200,151,58,0.15)',
  goldBdr:  'rgba(200,151,58,0.2)',
  green:    '#2ECC8A',
  greenDim: 'rgba(46,204,138,0.10)',
  greenBdr: 'rgba(46,204,138,0.22)',
  blue:     '#5B9EE8',
  blueDim:  'rgba(91,158,232,0.10)',
  blueBdr:  'rgba(91,158,232,0.22)',
  red:      '#E85B5B',
  redDim:   'rgba(232,91,91,0.12)',
  redBdr:   'rgba(232,91,91,0.2)',
  text:     '#F0EDE8',
  muted:    'rgba(240,237,232,0.45)',
  faint:    'rgba(240,237,232,0.12)',
}
const FONT = "'DM Sans', 'Noto Serif TC', sans-serif"

const inputStyle: React.CSSProperties = {
  width: '100%', background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: '10px', padding: '10px 14px', fontSize: '14px',
  color: C.text, outline: 'none', boxSizing: 'border-box',
  fontFamily: FONT, transition: 'border-color 0.2s',
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 999,
      background: ok ? '#0F1F14' : '#1F0F0F',
      border: `1px solid ${ok ? C.greenBdr : C.redBdr}`,
      color: ok ? C.green : C.red,
      padding: '11px 22px', borderRadius: '12px',
      fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'fadeSlide 0.25s ease',
      fontFamily: FONT,
    }}>
      {ok ? '✓  ' : '✕  '}{msg}
    </div>
  )
}

// ─── CartItemRow ──────────────────────────────────────────────────────────────
function CartItemRow({ item, onAdd, onRemove }: { item: CartItem; onAdd: () => void; onRemove: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{item.name}</p>
        <p style={{ fontSize: '11px', color: C.muted, margin: '2px 0 0' }}>{fmt(item.price)} 元／份</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button onClick={onRemove} className="qty-btn" style={{ width: '26px', height: '26px', borderRadius: '50%', border: `1px solid ${C.border}`, background: C.surface, color: C.muted, fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
        <span style={{ width: '18px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: C.text }}>{item.qty}</span>
        <button onClick={onAdd} className="qty-btn" style={{ width: '26px', height: '26px', borderRadius: '50%', border: `1px solid ${C.gold}`, background: C.goldDim, color: C.goldLt, fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        <span style={{ width: '54px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: C.goldLt }}>{fmt(item.price * item.qty)}</span>
      </div>
    </div>
  )
}

// ─── EmptyCart ────────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '32px 20px' }}>
      <div style={{ width: '52px', height: '52px', background: C.goldDim, border: `1px solid ${C.goldBdr}`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🧾</div>
      <p style={{ fontSize: '13px', fontWeight: 600, color: C.muted, margin: 0 }}>訂單是空的</p>
      <p style={{ fontSize: '12px', color: C.faint, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>切換至點餐頁面選擇品項</p>
    </div>
  )
}

// ─── ClearConfirmModal ────────────────────────────────────────────────────────
function ClearConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', borderRadius: '20px' }}>
      <div style={{ background: C.card, border: `1px solid ${C.redBdr}`, borderRadius: '16px', padding: '28px 24px', width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ width: '44px', height: '44px', background: C.redDim, border: `1px solid ${C.redBdr}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 14px' }}>🗑️</div>
        <p style={{ fontWeight: 800, color: C.text, fontSize: '15px', margin: '0 0 8px', textAlign: 'center' }}>清除整張訂單？</p>
        <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.6, textAlign: 'center', margin: '0 0 20px' }}>所有品項與備註將被移除。</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', border: `1px solid ${C.border}`, borderRadius: '10px', background: 'transparent', color: C.muted, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>取消</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '10px', background: C.red, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>確認清除</button>
        </div>
      </div>
    </div>
  )
}

// ─── ModeToggle ───────────────────────────────────────────────────────────────
function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '3px', gap: '3px' }}>
      {(['dinein', 'pickup'] as Mode[]).map((m) => {
        const isDine = m === 'dinein'
        const active = mode === m
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            style={{
              flex: 1, padding: '8px 6px',
              borderRadius: '8px', border: 'none',
              background: active ? (isDine ? C.greenDim : C.blueDim) : 'transparent',
              color: active ? (isDine ? C.green : C.blue) : C.muted,
              fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', fontFamily: FONT,
              transition: 'all 0.18s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              boxShadow: active ? `inset 0 0 0 1px ${isDine ? C.greenBdr : C.blueBdr}` : 'none',
            }}
          >
            <span style={{ fontSize: '14px' }}>{isDine ? '🪑' : '🛍'}</span>
            {isDine ? '內用' : '外帶'}
          </button>
        )
      })}
    </div>
  )
}

// ─── CartPanel ────────────────────────────────────────────────────────────────
type CartPanelProps = {
  cart: CartItem[]; mode: Mode; tableNum: string; customerName: string; note: string
  total: number; totalItems: number; submitting: boolean; showClearConfirm: boolean
  onAddCart: (item: CartItem) => void; onRemoveCart: (id: string) => void
  setMode: (v: Mode) => void; setTableNum: (v: string) => void
  setCustomerName: (v: string) => void; setNote: (v: string) => void
  onClearRequest: () => void; onSubmit: () => void
  onClearConfirm: () => void; onClearCancel: () => void; onClose?: () => void
}

function CartPanel(p: CartPanelProps) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: C.card, overflow: 'hidden', fontFamily: FONT }}>

      {p.showClearConfirm && <ClearConfirmModal onConfirm={p.onClearConfirm} onCancel={p.onClearCancel} />}

      {/* Header */}
      <div style={{ padding: '18px 18px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>目前訂單</h2>
          <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>
            POS 現場下單
            {p.totalItems > 0 && <span style={{ marginLeft: '7px', color: C.goldLt, fontWeight: 700 }}>{p.totalItems} 項</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '2px' }}>
          {p.cart.length > 0 && (
            <button
              onClick={p.onClearRequest}
              style={{ padding: '5px 10px', border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: '11px', fontWeight: 600, borderRadius: '7px', cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px' }}
            >🗑 清除</button>
          )}
          {p.onClose && (
            <button onClick={p.onClose} style={{ width: '28px', height: '28px', borderRadius: '7px', border: `1px solid ${C.border}`, background: C.surface, color: C.muted, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          )}
        </div>
      </div>

      {/* ── Mode + Table/Name ── */}
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <ModeToggle mode={p.mode} onChange={p.setMode} />

        {p.mode === 'dinein' ? (
          <input
            type="text"
            value={p.tableNum}
            onChange={(e) => p.setTableNum(e.target.value)}
            placeholder="桌號（例：A1、01）"
            style={inputStyle}
            className="cart-input"
          />
        ) : (
          <input
            type="text"
            value={p.customerName}
            onChange={(e) => p.setCustomerName(e.target.value)}
            placeholder="客人姓名（選填）"
            style={inputStyle}
            className="cart-input"
          />
        )}
      </div>

      {/* 品項清單 */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '12px 18px 0' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px', flexShrink: 0 }}>品項</p>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }} className="scrollbar-thin">
          {p.cart.length === 0 ? <EmptyCart /> : p.cart.map((c) => (
            <CartItemRow key={c.id} item={c} onAdd={() => p.onAddCart(c)} onRemove={() => p.onRemoveCart(c.id)} />
          ))}
        </div>
      </div>

      {/* 備註 + 結帳 */}
      <div style={{ padding: '12px 18px 20px', borderTop: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          value={p.note}
          onChange={(e) => p.setNote(e.target.value)}
          placeholder="備註（選填）"
          style={inputStyle}
          className="cart-input"
        />

        {/* Total */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: C.muted }}>訂單合計</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: C.goldLt }}>{fmt(p.total)}</span>
            <span style={{ fontSize: '11px', color: C.muted }}>元</span>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={p.onSubmit}
          disabled={p.cart.length === 0 || p.submitting}
          style={{
            width: '100%', padding: '13px',
            borderRadius: '11px', border: 'none',
            background: p.cart.length === 0 ? C.faint : `linear-gradient(135deg, ${C.gold}, #A0722A)`,
            color: p.cart.length === 0 ? C.muted : '#0D0D0F',
            fontSize: '14px', fontWeight: 700,
            cursor: p.cart.length === 0 || p.submitting ? 'not-allowed' : 'pointer',
            fontFamily: FONT,
            boxShadow: p.cart.length === 0 ? 'none' : '0 4px 16px rgba(200,151,58,0.35)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {p.submitting
            ? <><span style={{ width: '13px', height: '13px', borderRadius: '50%', border: `2px solid ${C.muted}`, borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />送出中...</>
            : p.cart.length === 0 ? '尚未選擇品項'
            : `送出訂單　NT$ ${fmt(p.total)}`
          }
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PosPage() {
  const params    = useParams()
  const storeSlug = params?.storeSlug as string

  const [menuItems,        setMenuItems]        = useState<MenuItem[]>([])
  const [dbCategories,     setDbCategories]     = useState<CategoryRow[]>([])
  const [cart,             setCart]             = useState<CartItem[]>([])
  const [loading,          setLoading]          = useState(true)
  const [submitting,       setSubmitting]       = useState(false)
  const [toast,            setToast]            = useState<{ msg: string; ok: boolean } | null>(null)
  const [mode,             setMode]             = useState<Mode>('dinein')
  const [tableNum,         setTableNum]         = useState('')
  const [customerName,     setCustomerName]     = useState('')
  const [note,             setNote]             = useState('')
  const [activeCategory,   setActiveCategory]   = useState('全部')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [mobileTab,        setMobileTab]        = useState<'menu'|'cart'>('menu')

  const menuScrollRef = useRef<HTMLDivElement>(null)

  // ── Load menu + categories ─────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!storeSlug) return
    const supabase = createClient()
    const [menuRes, catRes] = await Promise.all([
      supabase.from('menu').select('id, name, price, category')
        .eq('store_slug', storeSlug).neq('available', false)
        .order('category', { ascending: true }),
      supabase.from('categories').select('id, name, sort_order')
        .eq('store_slug', storeSlug).order('sort_order', { ascending: true }),
    ])
    if (menuRes.data) setMenuItems(menuRes.data)
    setDbCategories(catRes.data ?? [])
    setLoading(false)
  }, [storeSlug])

  useEffect(() => { loadAll() }, [loadAll])

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const addToCart = (item: MenuItem | CartItem) => {
    setCart((prev) => {
      const exist = prev.find((c) => c.id === item.id)
      if (exist) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const exist = prev.find((c) => c.id === id)
      if (!exist) return prev
      if (exist.qty <= 1) return prev.filter((c) => c.id !== id)
      return prev.map((c) => c.id === id ? { ...c, qty: c.qty - 1 } : c)
    })
  }

  const doClear = () => {
    setCart([]); setNote(''); setTableNum(''); setCustomerName('')
    setShowClearConfirm(false)
  }

  const cartQty    = (id: string) => cart.find((c) => c.id === id)?.qty ?? 0
  const total      = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  const totalItems = cart.reduce((s, c) => s + c.qty, 0)

  const handleSubmit = async () => {
    if (!cart.length || submitting) return
    setSubmitting(true)
    const supabase = createClient()
    const orderCode = await generateOrderCode(supabase, storeSlug)
    const { error } = await supabase.from('orders').insert({
      store_slug:     storeSlug,
      order_code:     orderCode,
      customer_name:  mode === 'pickup' ? (customerName.trim() || '外帶客') : (tableNum.trim() ? `桌 ${tableNum.trim()}` : '現場客'),
      customer_phone: null,
      items_json:     cart.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      subtotal:       total,
      total_amount:   total,
      status:         'pending',
      source:         'pos',
      table_num:      mode === 'dinein' ? (tableNum.trim() || null) : null,
      note:           note.trim() || null,
    })
    if (error) {
      showToast(error.message, false)
    } else {
      const label = mode === 'dinein'
        ? (tableNum.trim() ? `桌 ${tableNum.trim()} ` : '')
        : (customerName.trim() ? `${customerName.trim()} ` : '')
      showToast(`${label}訂單送出！NT$ ${fmt(total)}`)
      doClear()
      setMobileTab('menu')
      menuScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setSubmitting(false)
  }

  // ── Derived: categories from DB, fallback to menu item values ──────────────
  const categoryTabs = useMemo(() => {
    if (dbCategories.length > 0) return ['全部', ...dbCategories.map(c => c.name)]
    // fallback: derive from menu items if categories table not yet created
    return ['全部', ...Array.from(new Set(menuItems.map(i => i.category || '其他').filter(Boolean)))]
  }, [dbCategories, menuItems])

  const catGradMap = useMemo(() => {
    const map = new Map<string, string>()
    const source = dbCategories.length > 0 ? dbCategories.map(c => c.name) : categoryTabs.slice(1)
    source.forEach((name, i) => map.set(name, CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]))
    return map
  }, [dbCategories, categoryTabs])

  const catOrderMap = useMemo(() => new Map(dbCategories.map((c, i) => [c.name, i])), [dbCategories])

  const filteredItems = useMemo(() => {
    const base = activeCategory === '全部' ? menuItems : menuItems.filter(i => (i.category || '') === activeCategory)
    return [...base].sort((a, b) => {
      const catA = catOrderMap.get(a.category || '') ?? 999
      const catB = catOrderMap.get(b.category || '') ?? 999
      if (catA !== catB) return catA - catB
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })
  }, [menuItems, activeCategory, catOrderMap])

  const cartProps = {
    cart, mode, tableNum, customerName, note, total, totalItems, submitting, showClearConfirm,
    onAddCart: addToCart, onRemoveCart: removeFromCart,
    setMode, setTableNum, setCustomerName, setNote,
    onClearRequest: () => setShowClearConfirm(true),
    onSubmit: handleSubmit, onClearConfirm: doClear, onClearCancel: () => setShowClearConfirm(false),
  }

  return (
    <>
      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform:translate(-50%,-10px); } to { opacity:1; transform:translate(-50%,0); } }
        @keyframes slideUp   { from { transform:translateY(100%); } to { transform:translateY(0); } }
        @keyframes spin      { to { transform:rotate(360deg); } }
        .cat-btn:hover  { color: ${C.text} !important; }
        .menu-card:hover { transform: translateY(-2px); border-color: ${C.goldBdr} !important; box-shadow: 0 20px 60px rgba(200,151,58,0.08) !important; }
        .add-btn:hover  { background: rgba(200,151,58,0.2) !important; }
        .qty-minus:hover { background: rgba(255,255,255,0.12) !important; }
        .cart-btn:hover { background: #A0722A !important; }
        .qty-btn:hover  { opacity: 0.75; }
        .cart-input:focus  { border-color: ${C.gold} !important; outline: none; }
        .scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }
        .scrollbar-none::-webkit-scrollbar { display:none; }
        .scrollbar-none { -ms-overflow-style:none; scrollbar-width:none; }

        /* Mobile: pos-outer is fixed viewport container, bypassing body overflow:hidden */
        @media (max-width: 767px) {
          .pos-outer {
            position: fixed !important;
            top: 0 !important;
            bottom: 80px !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 10 !important;
          }
        }
      `}</style>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <div className="pos-outer" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: FONT, WebkitFontSmoothing: 'antialiased' }}>

        {/* ── MOBILE: Top Sub-Tab Bar (點餐 / 訂單) ── */}
        <div className="md:hidden flex" style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {(['menu', 'cart'] as const).map((tab) => {
            const isCart = tab === 'cart'
            const active = mobileTab === tab
            return (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                style={{
                  flex: 1, padding: '13px 8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontSize: '14px', fontWeight: active ? 700 : 400,
                  color: active ? C.goldLt : C.muted,
                  fontFamily: FONT, transition: 'color 0.18s',
                  borderBottom: active ? `2px solid ${C.gold}` : '2px solid transparent',
                }}
              >
                <span>{isCart ? '🧾' : '🍽️'}</span>
                <span>
                  {isCart
                    ? (totalItems > 0 ? `訂單 (${totalItems})` : '訂單')
                    : '點餐'}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Category Tab Bar (same style as customer page, hidden on mobile cart tab) ── */}
        <div className={mobileTab === 'cart' ? 'hidden md:block' : ''} style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div className="scrollbar-none" style={{ padding: '0 14px', display: 'flex', flexWrap: 'nowrap', gap: '0 20px', overflowX: 'auto' }}>
            {categoryTabs.map((cat) => (
              <button
                key={cat}
                type="button"
                className="cat-btn"
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '15px', fontWeight: activeCategory === cat ? 700 : 400,
                  color: activeCategory === cat ? C.goldLt : C.muted,
                  fontFamily: FONT, padding: '12px 0', minHeight: '44px',
                  transition: 'color 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
                  borderBottom: activeCategory === cat ? `2px solid ${C.gold}` : '2px solid transparent',
                }}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* ── Main Body ── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>

          {/* ── LEFT: Menu Grid (hidden on mobile when cart tab active) ── */}
          <div
            ref={menuScrollRef}
            className={`scrollbar-thin${mobileTab === 'cart' ? ' hidden md:block' : ''}`}
            style={{
              flex: 1, minHeight: 0,
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
              padding: '20px 16px 20px',
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
                <div style={{ width: '34px', height: '34px', border: `3px solid ${C.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>載入菜單中...</p>
              </div>
            ) : menuItems.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
                <div style={{ width: '64px', height: '64px', background: C.goldDim, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🍽️</div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: C.muted, margin: 0 }}>尚無品項</p>
                <p style={{ fontSize: '12px', color: C.faint, margin: 0 }}>請先至菜單管理新增品項</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
                <p style={{ fontSize: '14px', color: C.muted, margin: 0 }}>此分類無品項</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3" style={{ gap: '16px' }}>
                {filteredItems.map((item) => {
                  const gradient = catGradMap.get(item.category || '') ?? CATEGORY_GRADIENTS[CATEGORY_GRADIENTS.length - 1]
                  return (
                    <MenuCard
                      key={item.id}
                      item={item}
                      qty={cartQty(item.id)}
                      gradient={gradient}
                      onAdd={() => addToCart(item)}
                      onRemove={() => removeFromCart(item.id)}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: Desktop Cart Sidebar ── */}
          <div
            className="hidden md:flex"
            style={{ width: '320px', borderLeft: `1px solid ${C.border}`, flexShrink: 0, flexDirection: 'column', minHeight: 0 }}
          >
            <CartPanel {...cartProps} />
          </div>

          {/* ── MOBILE: Full Cart Panel (cart tab) ── */}
          {mobileTab === 'cart' && (
            <div className="md:hidden flex flex-col" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <CartPanel {...cartProps} />
            </div>
          )}
        </div>

      </div>
    </>
  )
}
