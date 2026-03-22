'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'

const C = {
  bg:      '#0D0D0F',
  surface: '#141416',
  card:    '#1A1A1E',
  border:  'rgba(255,255,255,0.07)',
  gold:    '#C8973A',
  goldLt:  '#E4B55A',
  goldDim: 'rgba(200,151,58,0.15)',
  green:   '#2ECC8A',
  red:     '#E85B5B',
  redDim:  'rgba(232,91,91,0.12)',
  text:    '#F0EDE8',
  muted:   'rgba(240,237,232,0.45)',
  faint:   'rgba(240,237,232,0.12)',
}

const FONT = "'DM Sans', 'Noto Serif TC', sans-serif"

const NAV_ITEMS = [
  { key: 'dashboard', label: '營運總覽',  icon: '⚡', path: '' },
  { key: 'pos',       label: 'POS 點餐',  icon: '📟', path: 'pos' },
  { key: 'orders',    label: '訂單管理',  icon: '📋', path: 'orders' },
  { key: 'menu',      label: '菜單管理',  icon: '🍜', path: 'menu' },
]

const NAV_SYSTEM = [
  { key: 'notify', label: '通知設定', icon: '🔔', path: 'notify' },
]

function getInitial(slug: string) {
  return slug?.charAt(0).toUpperCase() || 'N'
}

function slugToName(slug: string) {
  return slug?.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('') || 'NoWait'
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const params    = useParams()
  const pathname  = usePathname()
  const router    = useRouter()
  const storeSlug = params?.storeSlug as string

  const isLoginPage = pathname === `/owner/${storeSlug}/login`
  if (isLoginPage) return <>{children}</>

  const currentPath = pathname.replace(`/owner/${storeSlug}`, '').replace(/^\//, '')

  const getItemCount = (key: string) => {
    // placeholder — 之後從 context 或 props 拿
    if (key === 'menu') return 16
    if (key === 'orders') return 1
    return null
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 10px; }
        .nav-item-btn:hover { background: rgba(240,237,232,0.06) !important; }
        .logout-btn:hover { background: rgba(232,91,91,0.12) !important; color: #E85B5B !important; }

        /* Mobile bottom nav */
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .main-content {
            margin-left: 0 !important;
            padding-bottom: 80px !important;
            overflow: visible !important;
          }
          .mobile-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: C.bg, fontFamily: FONT, color: C.text, WebkitFontSmoothing: 'antialiased' }}>

        {/* ══════════════════════════════
            SIDEBAR
        ══════════════════════════════ */}
        <aside
          className="sidebar"
          style={{ width: '260px', flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', padding: '32px 0', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, overflow: 'hidden' }}
        >
          {/* Brand */}
          <div style={{ padding: '0 28px 32px', borderBottom: `1px solid ${C.border}`, marginBottom: '24px', flexShrink: 0 }}>
            <div style={{ width: '48px', height: '48px', background: `linear-gradient(135deg, ${C.gold}, #A0722A)`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '20px', color: '#0D0D0F', marginBottom: '14px', boxShadow: '0 8px 24px rgba(200,151,58,0.35)', fontFamily: "'Noto Serif TC', serif" }}>
              {getInitial(storeSlug)}
            </div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: C.text, letterSpacing: '0.02em', fontFamily: "'Noto Serif TC', serif" }}>
              {slugToName(storeSlug)}
            </div>
            <div style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.06em', marginTop: '3px', textTransform: 'uppercase' }}>
              Owner Dashboard
            </div>
          </div>

          {/* Nav - 管理功能 */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', color: C.faint, textTransform: 'uppercase', padding: '0 28px', marginBottom: '8px' }}>
              管理功能
            </div>
            <div style={{ padding: '0 14px', marginBottom: '24px' }}>
              {NAV_ITEMS.map((item) => {
                const isActive = currentPath === item.path || (item.path === '' && currentPath === '')
                const count = getItemCount(item.key)
                return (
                  <button
                    key={item.key}
                    onClick={() => router.push(`/owner/${storeSlug}${item.path ? `/${item.path}` : ''}`)}
                    className="nav-item-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '11px 14px', borderRadius: '10px', cursor: 'pointer', border: `1px solid ${isActive ? 'rgba(200,151,58,0.2)' : 'transparent'}`, background: isActive ? C.goldDim : 'transparent', marginBottom: '2px', textAlign: 'left', transition: 'all 0.2s', fontFamily: FONT }}
                  >
                    <span style={{ fontSize: '18px', width: '22px', textAlign: 'center' }}>{item.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: isActive ? C.goldLt : C.muted, flex: 1, transition: 'color 0.2s' }}>
                      {item.label}
                    </span>
                    {count !== null && (
                      <span style={{ background: item.key === 'orders' ? C.green : C.gold, color: '#0D0D0F', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', minWidth: '22px', textAlign: 'center' }}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nav - 系統 */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', color: C.faint, textTransform: 'uppercase', padding: '0 28px', marginBottom: '8px' }}>
              系統
            </div>
            <div style={{ padding: '0 14px' }}>
              {NAV_SYSTEM.map((item) => (
                <button
                  key={item.key}
                  className="nav-item-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '11px 14px', borderRadius: '10px', cursor: 'pointer', border: '1px solid transparent', background: 'transparent', marginBottom: '2px', textAlign: 'left', transition: 'all 0.2s', fontFamily: FONT }}
                >
                  <span style={{ fontSize: '18px', width: '22px', textAlign: 'center' }}>{item.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: C.muted }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 'auto', padding: '24px 14px 0', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <button
              className="logout-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: '14px', fontWeight: 500, transition: 'all 0.2s', fontFamily: FONT }}
              onClick={() => router.push(`/owner/${storeSlug}/login`)}
            >
              <span>⎋</span>
              <span>登出系統</span>
            </button>
          </div>
        </aside>

        {/* ══════════════════════════════
            MAIN CONTENT
        ══════════════════════════════ */}
        <main
          className="main-content"
          style={{ marginLeft: '260px', flex: 1, minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          {children}
        </main>

        {/* ══════════════════════════════
            MOBILE BOTTOM NAV
        ══════════════════════════════ */}
        <nav
          className="mobile-nav"
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: C.surface, borderTop: `1px solid ${C.border}`, display: 'none', alignItems: 'stretch' }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.path || (item.path === '' && currentPath === '')
            return (
              <button
                key={item.key}
                onClick={() => router.push(`/owner/${storeSlug}${item.path ? `/${item.path}` : ''}`)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '10px 4px', border: 'none', background: 'transparent', cursor: 'pointer', borderTop: isActive ? `2px solid ${C.gold}` : '2px solid transparent', transition: 'all 0.15s' }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: isActive ? C.goldLt : C.muted }}>{item.label}</span>
              </button>
            )
          })}
        </nav>

      </div>
    </>
  )
}
