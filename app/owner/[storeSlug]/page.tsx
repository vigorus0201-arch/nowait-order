'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderItem = { id: string; name: string; price: number; qty: number }

type Order = {
  id:           string
  total_amount: number
  status:       string
  created_at:   string
  items_json:   OrderItem[]
}

type ItemStat = {
  name:            string
  price:           number
  completedQty:    number
  pendingQty:      number   // pending + preparing
  totalQty:        number
  completedAmount: number
}

type DaySummary = {
  total:           number
  completed:       number
  incomplete:      number
  totalAmount:     number
  completedAmount: number
  incompleteAmount: number
  pendingCount:    number   // 待處理（需提醒老闆）
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       '#0D0D0F',
  surface:  '#141416',
  card:     '#1A1A1E',
  border:   'rgba(255,255,255,0.07)',
  gold:     '#C8973A',
  goldLt:   '#E4B55A',
  goldDim:  'rgba(200,151,58,0.12)',
  goldBdr:  'rgba(200,151,58,0.2)',
  green:    '#2ECC8A',
  greenDim: 'rgba(46,204,138,0.10)',
  greenBdr: 'rgba(46,204,138,0.18)',
  blue:     '#5B9CF6',
  blueDim:  'rgba(91,156,246,0.10)',
  blueBdr:  'rgba(91,156,246,0.18)',
  red:      '#E85B5B',
  redDim:   'rgba(232,91,91,0.10)',
  redBdr:   'rgba(232,91,91,0.18)',
  text:     '#F0EDE8',
  muted:    'rgba(240,237,232,0.45)',
  faint:    'rgba(240,237,232,0.12)',
}
const FONT = "'DM Sans', 'Noto Serif TC', sans-serif"
const fmt  = (n: number) => n.toLocaleString('zh-TW')

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugToDisplay(slug: string) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OwnerHomePage() {
  const params    = useParams()
  const router    = useRouter()
  const storeSlug = params?.storeSlug as string

  const [summary,   setSummary]   = useState<DaySummary | null>(null)
  const [itemStats, setItemStats] = useState<ItemStat[]>([])
  const [loading,   setLoading]   = useState(true)
  const [storeName, setStoreName] = useState('')
  const [baseUrl,   setBaseUrl]   = useState('')

  useEffect(() => { setBaseUrl(window.location.origin) }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // Store name
    try {
      const { data } = await supabase.from('stores').select('name').eq('slug', storeSlug).single()
      setStoreName(data?.name ?? slugToDisplay(storeSlug))
    } catch {
      setStoreName(slugToDisplay(storeSlug))
    }

    // Today's orders — include items_json for ranking
    const today = new Date(); today.setHours(0, 0, 0, 0)

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at, items_json')
      .eq('store_slug', storeSlug)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    if (error) { console.error(error); setLoading(false); return }

    const rows = (orders ?? []) as Order[]

    // ── Day summary ────────────────────────────────────────────────────────────
    let total = 0, completed = 0, incomplete = 0
    let totalAmount = 0, completedAmount = 0, incompleteAmount = 0
    let pendingCount = 0

    for (const o of rows) {
      if (o.status === 'cancelled') continue
      total++
      totalAmount += o.total_amount ?? 0
      if (o.status === 'completed') {
        completed++
        completedAmount += o.total_amount ?? 0
      } else {
        incomplete++
        incompleteAmount += o.total_amount ?? 0
      }
      if (o.status === 'pending') pendingCount++
    }

    setSummary({ total, completed, incomplete, totalAmount, completedAmount, incompleteAmount, pendingCount })

    // ── Item ranking ───────────────────────────────────────────────────────────
    const map = new Map<string, ItemStat>()

    for (const o of rows) {
      if (o.status === 'cancelled') continue
      const items: OrderItem[] = Array.isArray(o.items_json) ? o.items_json : []
      const done = o.status === 'completed'

      for (const item of items) {
        if (!map.has(item.name)) {
          map.set(item.name, { name: item.name, price: item.price, completedQty: 0, pendingQty: 0, totalQty: 0, completedAmount: 0 })
        }
        const s = map.get(item.name)!
        s.totalQty += item.qty
        if (done) {
          s.completedQty    += item.qty
          s.completedAmount += item.price * item.qty
        } else {
          s.pendingQty += item.qty
        }
      }
    }

    setItemStats(Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty))
    setLoading(false)
  }, [storeSlug])

  useEffect(() => { fetchData() }, [fetchData])

  const hour     = new Date().getHours()
  const greeting = hour < 5 ? '深夜好' : hour < 12 ? '早安' : hour < 18 ? '午安' : '晚安'
  const dateStr  = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div style={{ minHeight: '100%', background: C.bg, fontFamily: FONT, WebkitFontSmoothing: 'antialiased', overflowY: 'auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .refresh-btn:hover { background: ${C.goldDim} !important; border-color: ${C.goldBdr} !important; }
        .alert-btn:hover   { background: rgba(232,91,91,0.07) !important; }
        .item-row:hover    { background: rgba(255,255,255,0.025) !important; }
      `}</style>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '28px 24px 80px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: C.gold, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              NoWait · 老闆後台
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: C.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {greeting}，{storeName || slugToDisplay(storeSlug)}
            </h1>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>{dateStr}</p>
          </div>
          <button
            className="refresh-btn"
            onClick={fetchData}
            style={{ padding: '9px 18px', borderRadius: '10px', border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'all 0.2s', flexShrink: 0, marginTop: '4px' }}
          >
            ↺ 刷新
          </button>
        </div>

        {/* ── Pending Alert ── */}
        {!loading && summary && summary.pendingCount > 0 && (
          <button
            className="alert-btn"
            onClick={() => router.push(`/owner/${storeSlug}/orders`)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', marginBottom: '20px', background: C.redDim, border: `1px solid ${C.redBdr}`, borderLeft: `3px solid ${C.red}`, borderRadius: '12px', cursor: 'pointer', fontFamily: FONT, transition: 'background 0.2s', textAlign: 'left' }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: C.red, margin: '0 0 2px' }}>
                有 {summary.pendingCount} 筆訂單待處理
              </p>
              <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>點此前往訂單管理</p>
            </div>
            <span style={{ color: C.red, fontSize: '16px' }}>→</span>
          </button>
        )}

        {/* ══════════════════════════════════════════════════════
            今日訂單概況
        ══════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>今日訂單概況</span>
          <div style={{ flex: 1, height: '1px', background: C.border }} />
        </div>

        {loading ? (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '20px', height: '20px', border: `2px solid ${C.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: '14px', color: C.muted }}>載入中...</span>
          </div>
        ) : summary && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px', animation: 'fadeIn 0.4s ease' }}>

            {/* 總訂單 */}
            <div style={{ background: C.card, border: `1px solid ${C.goldBdr}`, borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
              <p style={{ fontSize: '10px', fontWeight: 700, color: C.gold, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>總訂單</p>
              <p style={{ fontSize: '40px', fontWeight: 900, color: C.goldLt, margin: '0 0 2px', lineHeight: 1, letterSpacing: '-0.02em' }}>{summary.total}</p>
              <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 14px' }}>筆（不含取消）</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: C.green, background: C.greenDim, border: `1px solid ${C.greenBdr}`, borderRadius: '8px', padding: '4px 10px' }}>
                  完成 {summary.completed}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: C.blue, background: C.blueDim, border: `1px solid ${C.blueBdr}`, borderRadius: '8px', padding: '4px 10px' }}>
                  進行 {summary.incomplete}
                </span>
              </div>
            </div>

            {/* 已完成金額 */}
            <div style={{ background: C.card, border: `1px solid ${C.greenBdr}`, borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${C.green}, transparent)` }} />
              <p style={{ fontSize: '10px', fontWeight: 700, color: C.green, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>已完成金額</p>
              <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 2px' }}>NT$</p>
              <p style={{ fontSize: '36px', fontWeight: 900, color: C.text, margin: '0 0 2px', lineHeight: 1, letterSpacing: '-0.02em' }}>{fmt(summary.completedAmount)}</p>
              <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>{summary.completed} 筆已出餐</p>
            </div>

            {/* 進行中金額 */}
            <div style={{ background: C.card, border: `1px solid ${C.blueBdr}`, borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${C.blue}, transparent)` }} />
              <p style={{ fontSize: '10px', fontWeight: 700, color: C.blue, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>進行中金額</p>
              <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 2px' }}>NT$</p>
              <p style={{ fontSize: '36px', fontWeight: 900, color: C.text, margin: '0 0 2px', lineHeight: 1, letterSpacing: '-0.02em' }}>{fmt(summary.incompleteAmount)}</p>
              <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>{summary.incomplete} 筆製作中</p>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            品項銷售排行
        ══════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>今日品項銷售排行</span>
          <div style={{ flex: 1, height: '1px', background: C.border }} />
          {!loading && itemStats.length > 0 && (
            <span style={{ fontSize: '11px', color: C.faint }}>{itemStats.length} 個品項</span>
          )}
        </div>

        {loading ? null : itemStats.length === 0 ? (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '48px 24px', textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <p style={{ fontSize: '36px', margin: '0 0 12px' }}>📭</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: C.muted, margin: '0 0 4px' }}>今天還沒有訂單</p>
            <p style={{ fontSize: '13px', color: C.faint, margin: 0 }}>品項銷售數據將在第一筆訂單送出後顯示</p>
          </div>
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', animation: 'fadeIn 0.4s ease' }}>

            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px', gap: '0', padding: '10px 20px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: C.faint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>品項名稱</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: C.green, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>已完成</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: C.blue, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>進行中</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: C.gold, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'right' }}>完成金額</span>
            </div>

            {/* Table Rows */}
            {itemStats.map((item, idx) => {
              const isTop   = idx === 0
              const pctDone = item.totalQty > 0 ? item.completedQty / item.totalQty : 0

              return (
                <div
                  key={item.name}
                  className="item-row"
                  style={{
                    display:       'grid',
                    gridTemplateColumns: '1fr 80px 80px 100px',
                    gap:           '0',
                    padding:       '14px 20px',
                    borderBottom:  idx < itemStats.length - 1 ? `1px solid ${C.border}` : 'none',
                    alignItems:    'center',
                    transition:    'background 0.15s',
                    background:    isTop ? 'rgba(200,151,58,0.04)' : 'transparent',
                  }}
                >
                  {/* Item name + progress bar */}
                  <div style={{ minWidth: 0, paddingRight: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      {isTop && (
                        <span style={{ fontSize: '9px', fontWeight: 800, color: C.gold, background: C.goldDim, border: `1px solid ${C.goldBdr}`, borderRadius: '5px', padding: '1px 6px', letterSpacing: '0.1em', flexShrink: 0 }}>
                          TOP
                        </span>
                      )}
                      <span style={{ fontSize: '14px', fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '11px', color: C.muted, flexShrink: 0 }}>
                        共 {item.totalQty} 份
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: '3px', background: C.faint, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pctDone * 100}%`, background: C.green, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                  {/* Completed qty */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: item.completedQty > 0 ? C.green : C.faint, lineHeight: 1 }}>
                      {item.completedQty}
                    </span>
                    <span style={{ fontSize: '11px', color: C.muted, marginLeft: '2px' }}>份</span>
                  </div>

                  {/* Pending qty */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: item.pendingQty > 0 ? C.blue : C.faint, lineHeight: 1 }}>
                      {item.pendingQty}
                    </span>
                    <span style={{ fontSize: '11px', color: C.muted, marginLeft: '2px' }}>份</span>
                  </div>

                  {/* Completed amount */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', color: C.muted, marginRight: '1px' }}>NT$</span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: item.completedAmount > 0 ? C.goldLt : C.faint }}>
                      {fmt(item.completedAmount)}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Footer total */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px', gap: '0', padding: '12px 20px', background: C.surface, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: C.muted }}>
                合計（{itemStats.reduce((s, i) => s + i.totalQty, 0)} 份）
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: C.green, textAlign: 'center' }}>
                {itemStats.reduce((s, i) => s + i.completedQty, 0)} 份
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: C.blue, textAlign: 'center' }}>
                {itemStats.reduce((s, i) => s + i.pendingQty, 0)} 份
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: C.goldLt, textAlign: 'right' }}>
                NT$ {fmt(itemStats.reduce((s, i) => s + i.completedAmount, 0))}
              </span>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            點餐 QR Code
        ══════════════════════════════════════════════════════ */}
        <div style={{ marginTop: '28px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>點餐 QR Code</span>
          <div style={{ flex: 1, height: '1px', background: C.border }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            {
              label:  '一般 QR Code',
              sub:    '遠端點餐・姓名電話必填',
              url:    `${baseUrl}/s/${storeSlug}`,
              color:  C.gold,
              border: C.goldBdr,
              dim:    C.goldDim,
              icon:   '📱',
            },
            {
              label:  '到店 QR Code',
              sub:    '掃碼點餐・聯絡資料選填',
              url:    `${baseUrl}/s/${storeSlug}?mode=instore`,
              color:  C.green,
              border: C.greenBdr,
              dim:    C.greenDim,
              icon:   '🏪',
            },
          ].map(({ label, sub, url, color, border, dim, icon }) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'stretch' }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color, margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>{sub}</p>
                </div>
              </div>

              {baseUrl ? (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '10px', display: 'flex' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`}
                    alt={label}
                    width={160}
                    height={160}
                    style={{ display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{ width: '180px', height: '180px', background: C.surface, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '12px', color: C.faint }}>載入中...</span>
                </div>
              )}

              <div style={{ alignSelf: 'stretch', background: dim, borderRadius: '8px', padding: '8px 12px' }}>
                <p style={{ fontSize: '10px', color, fontFamily: 'monospace', wordBreak: 'break-all', margin: 0, lineHeight: 1.5 }}>
                  {url || `…/s/${storeSlug}`}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
