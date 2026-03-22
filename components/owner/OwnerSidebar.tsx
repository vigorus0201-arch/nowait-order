'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const C = {
  surface: '#141416',
  border:  'rgba(255,255,255,0.07)',
  gold:    '#C8973A',
  goldLt:  '#E4B55A',
  goldDim: 'rgba(200,151,58,0.15)',
  goldBdr: 'rgba(200,151,58,0.2)',
  text:    '#F0EDE8',
  muted:   'rgba(240,237,232,0.45)',
  faint:   'rgba(240,237,232,0.12)',
}

const FONT = "'DM Sans', 'Noto Serif TC', sans-serif"

const NAV_ITEMS = [
  { key: 'dashboard', label: '營運總覽', emoji: '📊', href: '' },
  { key: 'menu',      label: '菜單管理', emoji: '🍜', href: '/menu' },
  { key: 'pos',       label: '老闆點單', emoji: '📟', href: '/pos' },
  { key: 'orders',    label: '訂單查詢', emoji: '📋', href: '/orders' },
]

type OwnerSidebarProps = {
  storeSlug:   string
  collapsed?:  boolean
  onNavigate?: () => void
}

export default function OwnerSidebar({ storeSlug, collapsed = false, onNavigate }: OwnerSidebarProps) {
  const pathname = usePathname()

  return (
    <aside style={{
      width:           collapsed ? '64px' : '260px',
      height:          '100vh',
      position:        'sticky',
      top:             0,
      background:      C.surface,
      borderRight:     `1px solid ${C.border}`,
      display:         'flex',
      flexDirection:   'column',
      padding:         '32px 0',
      transition:      'width 0.3s ease',
      flexShrink:      0,
      fontFamily:      FONT,
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* ── Brand ── */}
      <div style={{
        padding:       collapsed ? '0 0 32px' : '0 28px 32px',
        borderBottom:  `1px solid ${C.border}`,
        marginBottom:  '24px',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width:        '48px',
          height:       '48px',
          background:   `linear-gradient(135deg, ${C.gold}, #A0722A)`,
          borderRadius: '14px',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontFamily:   "'Noto Serif TC', serif",
          fontWeight:   900,
          fontSize:     '20px',
          color:        '#0D0D0F',
          marginBottom: collapsed ? 0 : '14px',
          boxShadow:    '0 8px 24px rgba(200,151,58,0.35)',
          flexShrink:   0,
        }}>
          店
        </div>
        {!collapsed && (
          <>
            <div style={{
              fontFamily:    "'Noto Serif TC', serif",
              fontWeight:    700,
              fontSize:      '16px',
              color:         C.text,
              letterSpacing: '0.02em',
            }}>
              老闆後台
            </div>
            <div style={{
              fontSize:      '11px',
              color:         C.muted,
              letterSpacing: '0.06em',
              marginTop:     '3px',
              textTransform: 'uppercase',
            }}>
              Owner Dashboard
            </div>
          </>
        )}
      </div>

      {/* ── Section label ── */}
      {!collapsed && (
        <div style={{
          fontSize:      '10px',
          fontWeight:    600,
          letterSpacing: '0.12em',
          color:         C.faint,
          textTransform: 'uppercase',
          padding:       '0 28px',
          marginBottom:  '8px',
        }}>
          管理功能
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ padding: '0 14px', marginBottom: '24px' }}>
        {NAV_ITEMS.map((item) => {
          const href        = `/owner/${storeSlug}${item.href}`
          const isDashboard = item.href === ''
          const active      = isDashboard ? pathname === href : pathname.startsWith(href)

          return (
            <Link
              key={item.key}
              href={href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            collapsed ? 0 : '12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding:        collapsed ? '11px 0' : '11px 14px',
                borderRadius:   '10px',
                marginBottom:   '2px',
                border:         `1px solid ${active ? C.goldBdr : 'transparent'}`,
                background:     active ? C.goldDim : 'transparent',
                textDecoration: 'none',
                transition:     'all 0.2s',
                fontFamily:     FONT,
                cursor:         'pointer',
              }}
            >
              <span style={{ fontSize: '18px', width: '22px', textAlign: 'center' }}>
                {item.emoji}
              </span>
              {!collapsed && (
                <span style={{
                  fontSize:   '14px',
                  fontWeight: 500,
                  color:      active ? C.goldLt : C.muted,
                }}>
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        marginTop:  'auto',
        padding:    '24px 14px 0',
        borderTop:  `1px solid ${C.border}`,
      }}>
        {!collapsed && (
          <div style={{ fontSize: '10px', color: C.faint, padding: '0 4px' }}>
            Owner Console v1.0
          </div>
        )}
      </div>
    </aside>
  )
}
