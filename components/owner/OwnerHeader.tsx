'use client'

const C = {
  surface: '#141416',
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

type OwnerHeaderProps = {
  title?:          string
  subtitle?:       string
  storeSlug?:      string
  showMenuButton?: boolean
  onMenuClick?:    () => void
  onLogout?:       () => void
}

export default function OwnerHeader({
  title,
  subtitle,
  storeSlug,
  showMenuButton = false,
  onMenuClick,
  onLogout,
}: OwnerHeaderProps) {
  return (
    <header style={{
      height:           '64px',
      flexShrink:       0,
      borderBottom:     `1px solid ${C.border}`,
      background:       'rgba(20,20,22,0.9)',
      backdropFilter:   'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      position:         'sticky',
      top:              0,
      zIndex:           30,
      display:          'flex',
      alignItems:       'center',
      justifyContent:   'space-between',
      padding:          '0 20px',
      fontFamily:       FONT,
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* ── Left: Hamburger + Title ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>

        {showMenuButton && (
          <button
            onClick={onMenuClick}
            aria-label="開啟選單"
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              width:           '36px',
              height:          '36px',
              borderRadius:    '10px',
              border:          `1px solid ${C.border}`,
              background:      C.faint,
              color:           C.muted,
              cursor:          'pointer',
              flexShrink:      0,
            }}
            className="md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{
              fontSize:    '15px',
              fontWeight:  600,
              color:       C.text,
              margin:      0,
              lineHeight:  1,
              overflow:    'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:  'nowrap',
            }}>
              {title}
            </h1>
            {storeSlug && (
              <span style={{
                padding:       '2px 8px',
                borderRadius:  '6px',
                background:    C.faint,
                color:         C.muted,
                fontSize:      '10px',
                fontFamily:    'monospace',
                flexShrink:    0,
                letterSpacing: '0.04em',
              }}
                className="hidden sm:inline-flex"
              >
                {storeSlug}
              </span>
            )}
          </div>
          {subtitle && (
            <p style={{
              fontSize:     '11px',
              color:        C.muted,
              margin:       '4px 0 0',
              lineHeight:   1,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}
              className="hidden sm:block"
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Right: Logout ── */}
      <button
        onClick={onLogout}
        style={{
          flexShrink:   0,
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          padding:      '0 12px',
          height:       '36px',
          borderRadius: '10px',
          border:       `1px solid ${C.border}`,
          background:   C.faint,
          color:        C.muted,
          fontSize:     '13px',
          fontWeight:   500,
          cursor:       'pointer',
          fontFamily:   FONT,
          transition:   'all 0.2s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.color       = C.red
          el.style.background  = C.redDim
          el.style.borderColor = C.redBdr
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.color       = C.muted
          el.style.background  = C.faint
          el.style.borderColor = C.border
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span className="hidden sm:inline">登出</span>
      </button>
    </header>
  )
}
