'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const C = {
  bg:      '#0D0D0F',
  surface: '#141416',
  card:    '#1A1A1E',
  border:  'rgba(255,255,255,0.07)',
  gold:    '#C8973A',
  goldLt:  '#E4B55A',
  red:     '#E85B5B',
  redDim:  'rgba(232,91,91,0.12)',
  redBdr:  'rgba(232,91,91,0.2)',
  text:    '#F0EDE8',
  muted:   'rgba(240,237,232,0.45)',
  faint:   'rgba(240,237,232,0.12)',
}

const FONT = "'DM Sans', 'Noto Serif TC', sans-serif"

export default function OwnerLoginPage() {
  const router    = useRouter()
  const params    = useParams()
  const storeSlug = params?.storeSlug as string

  const [pin,     setPin]     = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!pin || pin.length < 4) { setError('請輸入 PIN 碼'); return }
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { data, error: supabaseError } = await supabase
        .from('owner_auth').select('pin_code, store_slug')
        .eq('store_slug', storeSlug).single()
      if (supabaseError) { setError('查詢失敗，請稍後再試'); setLoading(false); return }
      if (!data)         { setError('找不到此店家，請確認登入連結'); setLoading(false); return }
      if (String(data.pin_code) === String(pin)) {
        localStorage.setItem('owner_authenticated', 'true')
        localStorage.setItem('owner_store_slug', data.store_slug)
        router.push(`/owner/${data.store_slug}`)
      } else {
        setError('PIN 碼錯誤，請重新輸入')
      }
    } catch {
      setError('系統錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:           '100vh',
      display:             'flex',
      alignItems:          'center',
      justifyContent:      'center',
      background:          C.bg,
      fontFamily:          FONT,
      WebkitFontSmoothing: 'antialiased',
      padding:             '20px',
    }}>
      <style>{`
        .login-input:focus { border-color: ${C.gold} !important; }
        .login-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(200,151,58,0.4) !important;
        }
      `}</style>

      <div style={{
        background:   C.card,
        border:       `1px solid ${C.border}`,
        borderRadius: '24px',
        width:        '100%',
        maxWidth:     '400px',
        padding:      '44px 40px',
        boxShadow:    '0 32px 80px rgba(0,0,0,0.6)',
      }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width:          '56px',
            height:         '56px',
            background:     `linear-gradient(135deg, ${C.gold}, #A0722A)`,
            borderRadius:   '16px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '24px',
            fontWeight:     900,
            color:          '#0D0D0F',
            margin:         '0 auto 16px',
            boxShadow:      '0 8px 24px rgba(200,151,58,0.35)',
            fontFamily:     "'Noto Serif TC', serif",
          }}>
            店
          </div>
          <h1 style={{
            fontSize:   '22px',
            fontWeight: 800,
            color:      C.text,
            margin:     '0 0 6px',
            fontFamily: "'Noto Serif TC', serif",
          }}>
            老闆後台登入
          </h1>
          <p style={{ fontSize: '13px', color: C.muted, margin: 0, letterSpacing: '0.04em' }}>
            {storeSlug}
          </p>
        </div>

        {/* PIN Input */}
        <div style={{ marginBottom: error ? '12px' : '20px' }}>
          <label style={{
            display:       'block',
            fontSize:      '11px',
            fontWeight:    600,
            color:         C.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            marginBottom:  '8px',
          }}>
            PIN 碼
          </label>
          <input
            className="login-input"
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => { setError(''); setPin(e.target.value) }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
            placeholder="請輸入 PIN 碼"
            style={{
              width:         '100%',
              background:    C.surface,
              border:        `1px solid ${error ? C.redBdr : C.border}`,
              borderRadius:  '10px',
              padding:       '14px 18px',
              fontSize:      '20px',
              color:         C.text,
              textAlign:     'center',
              letterSpacing: '0.3em',
              outline:       'none',
              boxSizing:     'border-box',
              fontFamily:    FONT,
              transition:    'border-color 0.2s',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:   C.redDim,
            border:       `1px solid ${C.redBdr}`,
            borderRadius: '8px',
            padding:      '10px 14px',
            marginBottom: '16px',
            fontSize:     '13px',
            color:        C.red,
            textAlign:    'center',
            fontWeight:   600,
          }}>
            {error}
          </div>
        )}

        {/* Button */}
        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width:        '100%',
            background:   loading ? C.faint : `linear-gradient(135deg, ${C.gold}, #A0722A)`,
            color:        loading ? C.muted : '#0D0D0F',
            border:       'none',
            borderRadius: '12px',
            padding:      '14px',
            fontSize:     '15px',
            fontWeight:   700,
            cursor:       loading ? 'not-allowed' : 'pointer',
            fontFamily:   FONT,
            boxShadow:    loading ? 'none' : '0 4px 16px rgba(200,151,58,0.35)',
            transition:   'all 0.2s',
          }}
        >
          {loading ? '登入中...' : '登入後台'}
        </button>

      </div>
    </div>
  )
}
