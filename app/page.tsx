'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  bg:      '#0D0D0F',
  surface: '#141416',
  card:    '#1A1A1E',
  border:  'rgba(255,255,255,0.07)',
  gold:    '#C8973A',
  goldLt:  '#E4B55A',
  goldDim: 'rgba(200,151,58,0.12)',
  goldBdr: 'rgba(200,151,58,0.25)',
  green:   '#2ECC8A',
  text:    '#F0EDE8',
  muted:   'rgba(240,237,232,0.45)',
  faint:   'rgba(240,237,232,0.10)',
}

const FONT = "'DM Sans', 'Noto Serif TC', sans-serif"

// 已知的 store slugs（測試用）
const STORES = [
  { slug: 'chen-beef-noodle', name: '陳記正宗牛肉麵' },
]

type Mode = 'dinein' | 'pickup'

export default function DevLaunchPage() {
  const router = useRouter()

  const [slug,    setSlug]    = useState(STORES[0].slug)
  const [mode,    setMode]    = useState<Mode>('dinein')
  const [tableNo, setTableNo] = useState('')

  const handleGo = () => {
    const params = new URLSearchParams({ mode })
    if (mode === 'dinein' && tableNo.trim()) params.set('table', tableNo.trim())
    router.push(`/s/${slug}?${params.toString()}`)
  }

  const handleOwner = () => {
    router.push(`/owner/${slug}`)
  }

  const handleKitchen = () => {
    router.push(`/kitchen/${slug}`)
  }

  return (
    <main style={{
      minHeight:  '100vh',
      background: C.bg,
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding:    '24px',
      fontFamily: FONT,
      WebkitFontSmoothing: 'antialiased',
    }}>
      <style>{`
        .mode-btn:hover  { opacity: 0.85; }
        .go-btn:hover    { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(200,151,58,0.45) !important; }
        .link-btn:hover  { background: rgba(255,255,255,0.08) !important; color: ${C.text} !important; }
        input:focus      { border-color: ${C.gold} !important; }
        select:focus     { border-color: ${C.gold} !important; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: `linear-gradient(135deg, ${C.gold}, #A0722A)`,
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 900,
            color: '#0D0D0F',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(200,151,58,0.35)',
            fontFamily: "'Noto Serif TC', serif",
          }}>
            店
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: '0 0 6px', fontFamily: "'Noto Serif TC', serif" }}>
            NoWait Order
          </h1>
          <p style={{ fontSize: '12px', color: C.muted, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            開發測試入口
          </p>
        </div>

        {/* Card */}
        <div style={{
          background:   C.card,
          border:       `1px solid ${C.border}`,
          borderRadius: '20px',
          padding:      '28px 24px',
          boxShadow:    '0 24px 64px rgba(0,0,0,0.5)',
          marginBottom: '16px',
        }}>

          {/* Store 選擇 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
              店家
            </label>
            <select
              value={slug}
              onChange={e => setSlug(e.target.value)}
              style={{
                width: '100%', background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: '10px',
                padding: '12px 14px', fontSize: '14px',
                color: C.text, outline: 'none',
                fontFamily: FONT, cursor: 'pointer',
                transition: 'border-color 0.2s',
                appearance: 'none',
              }}
            >
              {STORES.map(s => (
                <option key={s.slug} value={s.slug}>{s.name}（{s.slug}）</option>
              ))}
            </select>
          </div>

          {/* 模式切換 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
              點餐模式
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['dinein', 'pickup'] as Mode[]).map(m => {
                const active = mode === m
                return (
                  <button
                    key={m}
                    className="mode-btn"
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      border: `1px solid ${active ? C.goldBdr : C.border}`,
                      background: active ? C.goldDim : C.surface,
                      color: active ? C.goldLt : C.muted,
                      fontSize: '13px', fontWeight: active ? 700 : 400,
                      cursor: 'pointer', fontFamily: FONT,
                      transition: 'all 0.2s',
                    }}
                  >
                    {m === 'dinein' ? '🍽 店內用餐' : '🛍 外帶預訂'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 桌號（內用才顯示） */}
          {mode === 'dinein' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
                桌號 <span style={{ color: C.faint, fontWeight: 400 }}>（選填）</span>
              </label>
              <input
                type="text"
                value={tableNo}
                onChange={e => setTableNo(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleGo() }}
                placeholder="例：A1、5"
                style={{
                  width: '100%', background: C.surface,
                  border: `1px solid ${C.border}`, borderRadius: '10px',
                  padding: '12px 14px', fontSize: '14px',
                  color: C.text, outline: 'none', boxSizing: 'border-box',
                  fontFamily: FONT, transition: 'border-color 0.2s',
                }}
              />
            </div>
          )}

          {/* 進入點餐 */}
          <button
            className="go-btn"
            onClick={handleGo}
            style={{
              width: '100%', padding: '14px',
              background: `linear-gradient(135deg, ${C.gold}, #A0722A)`,
              color: '#0D0D0F', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 700,
              cursor: 'pointer', fontFamily: FONT,
              boxShadow: '0 4px 16px rgba(200,151,58,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {mode === 'dinein' ? '進入點餐頁面 →' : '進入外帶預訂 →'}
          </button>
        </div>

        {/* 其他入口 */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: '16px', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <p style={{ fontSize: '10px', color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            其他入口
          </p>

          <button
            className="link-btn"
            onClick={handleOwner}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: '10px',
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.muted, fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
            }}
          >
            <span>🏪 老闆後台</span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', opacity: 0.5 }}>/owner/{slug}</span>
          </button>

          <button
            className="link-btn"
            onClick={handleKitchen}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: '10px',
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.muted, fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
            }}
          >
            <span>🍳 廚房顯示</span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', opacity: 0.5 }}>/kitchen/{slug}</span>
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: C.faint, marginTop: '20px' }}>
          此頁面僅供開發測試使用
        </p>
      </div>
    </main>
  )
}
