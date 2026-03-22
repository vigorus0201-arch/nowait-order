'use client'

// ─── Shared design tokens (duplicated from page tokens for self-containment) ──
const C = {
  card:    '#1A1A1E',
  border:  'rgba(255,255,255,0.07)',
  goldBdr: 'rgba(200,151,58,0.2)',
  goldDim: 'rgba(200,151,58,0.12)',
  goldLt:  '#E4B55A',
  gold:    '#C8973A',
  faint:   'rgba(240,237,232,0.10)',
  text:    '#F0EDE8',
  muted:   'rgba(240,237,232,0.45)',
}
const FONT = "'DM Sans', 'Noto Serif TC', sans-serif"

// ─── Category gradients (6, cycle by index) ──────────────────────────────────
export const CATEGORY_GRADIENTS = [
  'linear-gradient(135deg, rgba(120,60,10,0.5) 0%, rgba(30,20,10,0.4) 100%)',
  'linear-gradient(135deg, rgba(10,60,40,0.5) 0%, rgba(20,25,20,0.4) 100%)',
  'linear-gradient(135deg, rgba(10,40,80,0.4) 0%, rgba(20,22,28,0.4) 100%)',
  'linear-gradient(135deg, rgba(80,10,80,0.35) 0%, rgba(22,20,28,0.4) 100%)',
  'linear-gradient(135deg, rgba(60,10,10,0.45) 0%, rgba(28,18,18,0.4) 100%)',
  'linear-gradient(135deg, rgba(10,55,55,0.4) 0%, rgba(18,22,22,0.4) 100%)',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function getDescription(name: string): string {
  if (name.includes('清燉'))               return '溫潤湯頭，口感清爽，適合喜歡清淡風味的人。'
  if (name.includes('牛筋'))               return '麵體Q彈，帶點嚼勁，香氣更有層次。'
  if (name.includes('牛肉'))               return '經典招牌口味，湯頭濃郁，風味飽滿順口。'
  if (name.includes('雞腿'))               return '份量扎實，口味家常，飽足感十足。'
  if (name.includes('滷肉飯'))             return '台味經典，鹹香下飯，簡單卻非常耐吃。'
  if (name.includes('菜'))                return '清爽配菜，平衡口感，搭配主食剛剛好。'
  if (name.includes('蛋'))                return '簡單加點，口感滑順，搭配主食很適合。'
  if (name.includes('湯'))                return '暖胃順口，適合作為搭配品項。'
  if (name.includes('茶') || name.includes('飲')) return '清涼解膩，適合搭配熱食一起享用。'
  return '精選人氣商品，適合搭配店內主打品項。'
}

export function getFoodEmoji(name: string): string {
  if (name.includes('牛')) return '🍜'
  if (name.includes('雞')) return '🍗'
  if (name.includes('飯')) return '🍚'
  if (name.includes('湯')) return '🥣'
  if (name.includes('茶')) return '🧋'
  if (name.includes('蛋')) return '🥚'
  if (name.includes('菜')) return '🥬'
  return '🍽️'
}

// ─── MenuCard ─────────────────────────────────────────────────────────────────
export interface MenuCardItem {
  id: string
  name: string
  price: number
  category?: string | null
}

export interface MenuCardProps {
  item: MenuCardItem
  qty: number
  gradient: string
  onAdd: () => void
  /** Decrease qty by 1 (remove from cart if qty becomes 0) */
  onRemove: () => void
}

export function MenuCard({ item, qty, gradient, onAdd, onRemove }: MenuCardProps) {
  const category = item.category || ''

  return (
    <article
      className="menu-card"
      style={{
        overflow: 'hidden', borderRadius: '24px',
        border: `1px solid ${C.border}`,
        background: C.card, transition: 'all 0.3s',
      }}
    >
      {/* Gradient top area */}
      <div style={{ background: gradient, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <p style={{
              fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
              color: C.muted, margin: '0 0 10px',
            }}>
              {category}
            </p>
            <h3 style={{
              fontSize: '20px', fontWeight: 600, color: C.text,
              margin: 0, letterSpacing: '-0.01em',
              fontFamily: "'Noto Serif TC', serif",
            }}>
              {item.name}
            </h3>
          </div>
          <div style={{
            width: '56px', height: '56px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '16px', border: `1px solid ${C.border}`,
            background: 'rgba(255,255,255,0.05)', fontSize: '26px',
          }}>
            {getFoodEmoji(item.name)}
          </div>
        </div>
      </div>

      {/* Info area */}
      <div style={{ padding: '16px 20px 20px' }}>
        <p style={{
          fontSize: '13px', lineHeight: 1.7, color: C.muted,
          minHeight: '66px', margin: '0 0 16px',
        }}>
          {getDescription(item.name)}
        </p>

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '14px',
        }}>
          <p style={{
            fontSize: '26px', fontWeight: 800, color: C.goldLt,
            margin: 0, fontFamily: "'DM Sans', sans-serif",
          }}>
            NT${item.price}
          </p>
          <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
            已選 <span style={{ color: C.text, fontWeight: 600 }}>{qty}</span> 份
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <button
            type="button"
            className="add-btn"
            onClick={onAdd}
            style={{
              borderRadius: '20px', border: `1px solid ${C.goldBdr}`,
              background: C.goldDim, padding: '10px 18px',
              fontSize: '14px', fontWeight: 600, color: C.goldLt,
              cursor: 'pointer', fontFamily: FONT, transition: 'background 0.2s',
              minHeight: '44px',
            }}
          >
            + 加入選單
          </button>

          {qty > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="qty-minus"
                onClick={onRemove}
                style={{
                  width: '40px', height: '40px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', border: `1px solid ${C.border}`,
                  background: C.faint, color: C.text, fontSize: '18px',
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
              >−</button>
              <span style={{
                minWidth: '28px', textAlign: 'center',
                fontSize: '15px', fontWeight: 700, color: C.text,
              }}>
                {qty}
              </span>
              <button
                type="button"
                className="cart-btn"
                onClick={onAdd}
                style={{
                  width: '40px', height: '40px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', border: 'none',
                  background: C.gold, color: '#0D0D0F',
                  fontSize: '18px', fontWeight: 700,
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
              >+</button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
