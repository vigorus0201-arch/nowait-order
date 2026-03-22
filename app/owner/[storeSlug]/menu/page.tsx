'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────
type MenuItem = {
  id: string
  store_slug: string
  name: string
  price: number
  category: string | null
  image_url: string | null
  available: boolean
  sort_order: number
  created_at: string
}

type FormData = {
  name: string
  price: string
  category: string
  image_url: string
  available: boolean
}

type CategoryRow = { id: string; name: string; sort_order: number }

const EMPTY_FORM: FormData = {
  name: '', price: '', category: '', image_url: '', available: true,
}

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
  greenDim: 'rgba(46,204,138,0.12)',
  greenBdr: 'rgba(46,204,138,0.2)',
  red:      '#E85B5B',
  redDim:   'rgba(232,91,91,0.12)',
  redBdr:   'rgba(232,91,91,0.2)',
  blue:     '#5B9CF6',
  blueDim:  'rgba(91,156,246,0.12)',
  text:     '#F0EDE8',
  muted:    'rgba(240,237,232,0.45)',
  faint:    'rgba(240,237,232,0.12)',
}
const FONT = "'DM Sans', 'Noto Serif TC', sans-serif"
const TABLE_COLS = '64px 1fr 120px 110px 110px 160px'

export default function MenuPage() {
  const params    = useParams()
  const storeSlug = params?.storeSlug as string

  // ── Menu items state ────────────────────────────────────────────────────────
  const [items,          setItems]          = useState<MenuItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search,         setSearch]         = useState('')
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editItem,       setEditItem]       = useState<MenuItem | null>(null)
  const [form,           setForm]           = useState<FormData>(EMPTY_FORM)
  const [saving,         setSaving]         = useState(false)
  const [deleteConfirm,  setDeleteConfirm]  = useState<string | null>(null)
  const [toast,          setToast]          = useState<{ msg: string; ok: boolean } | null>(null)
  const [clock,          setClock]          = useState('')

  // ── Category management state ───────────────────────────────────────────────
  const [categories,    setCategories]   = useState<CategoryRow[]>([])
  const [catLoading,    setCatLoading]   = useState(true)
  const [catError,      setCatError]     = useState<string | null>(null)
  const [showCatPanel,  setShowCatPanel] = useState(true)
  const [catInput,      setCatInput]     = useState('')
  const [catSaving,     setCatSaving]    = useState(false)
  const [catDeleteId,   setCatDeleteId]  = useState<string | null>(null)

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setClock(now.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  // ── Fetch menu items ────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('menu').select('*').eq('store_slug', storeSlug)
      .order('category', { ascending: true }).order('sort_order', { ascending: true })
    if (error) { console.error(error); setLoading(false); return }
    if (data) setItems(data as MenuItem[])
    setLoading(false)
  }, [storeSlug])

  // ── Fetch categories ────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories').select('id, name, sort_order')
      .eq('store_slug', storeSlug)
      .order('sort_order', { ascending: true })
    if (error) {
      // Table doesn't exist yet → show setup hint
      if ((error as { code?: string }).code === 'PGRST205' || error.message?.includes("doesn't exist") || error.message?.includes('relation') || error.message?.includes('schema cache')) {
        setCatError('table_missing')
      } else {
        setCatError(error.message)
      }
      setCatLoading(false)
      return
    }
    setCatError(null)
    setCategories(data ?? [])
    setCatLoading(false)
  }, [storeSlug])

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => { fetchCategories() }, [fetchCategories])

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const catNames     = categories.map(c => c.name)
  const catOrderMap  = new Map(categories.map((c, i) => [c.name, i]))
  const countAvail   = items.filter((i) => i.available === true).length
  const countUnavail = items.filter((i) => i.available === false).length

  const filtered = items
    .filter((i) => {
      const cat = i.category || '其他'
      const matchCat    = activeCategory === 'all' || cat === activeCategory
      const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
    .sort((a, b) => {
      const catA = catOrderMap.get(a.category || '') ?? 999
      const catB = catOrderMap.get(b.category || '') ?? 999
      if (catA !== catB) return catA - catB
      return a.sort_order - b.sort_order
    })

  // ── Modal ──────────────────────────────────────────────────────────────────
  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (item: MenuItem) => {
    setEditItem(item)
    setForm({ name: item.name, price: String(item.price), category: item.category || '', image_url: item.image_url || '', available: item.available })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditItem(null); setForm(EMPTY_FORM) }

  // ── Save item ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { showToast('請輸入品項名稱', false); return }
    const price = parseFloat(form.price)
    if (isNaN(price) || price < 0) { showToast('請輸入正確價格', false); return }
    setSaving(true)
    const supabase = createClient()
    const payload = { store_slug: storeSlug, name: form.name.trim(), price, category: form.category.trim() || null, image_url: form.image_url.trim() || null, available: form.available }
    if (editItem) {
      const { error } = await supabase.from('menu').update(payload).eq('id', editItem.id)
      if (error) showToast('更新失敗：' + error.message, false)
      else { showToast('品項已更新'); await fetchItems(); closeModal() }
    } else {
      const { error } = await supabase.from('menu').insert(payload)
      if (error) showToast('新增失敗：' + error.message, false)
      else { showToast('品項已新增'); await fetchItems(); closeModal() }
    }
    setSaving(false)
  }

  // ── Toggle available ───────────────────────────────────────────────────────
  const toggleAvailable = async (item: MenuItem) => {
    const newVal = !item.available
    const supabase = createClient()
    const { error } = await supabase.from('menu').update({ available: newVal }).eq('id', item.id)
    if (error) { showToast('更新失敗', false); return }
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: newVal } : i))
    showToast(newVal ? '已上架' : '已下架')
  }

  // ── Delete item ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('menu').delete().eq('id', id)
    if (error) { showToast('刪除失敗', false); return }
    setItems((prev) => prev.filter((i) => i.id !== id))
    setDeleteConfirm(null)
    showToast('品項已刪除')
  }

  // ── Category CRUD ──────────────────────────────────────────────────────────
  const addCategory = async () => {
    const name = catInput.trim()
    if (!name) return
    setCatSaving(true)
    const supabase = createClient()
    const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 0
    const { error } = await supabase.from('categories').insert({ store_slug: storeSlug, name, sort_order: nextOrder })
    if (error) showToast('新增失敗：' + error.message, false)
    else { setCatInput(''); await fetchCategories(); showToast(`已新增「${name}」`) }
    setCatSaving(false)
  }

  const deleteCategory = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { showToast('刪除失敗', false); return }
    await fetchCategories()
    showToast('分類已刪除')
    setCatDeleteId(null)
  }

  const moveCat = async (id: string, dir: -1 | 1) => {
    const idx     = categories.findIndex(c => c.id === id)
    const swapIdx = idx + dir
    if (idx < 0 || swapIdx < 0 || swapIdx >= categories.length) return
    const a = categories[idx]
    const b = categories[swapIdx]
    const supabase = createClient()
    await Promise.all([
      supabase.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    await fetchCategories()
  }

  // ── Reorder menu item within same category ─────────────────────────────────
  const moveItem = async (id: string, dir: -1 | 1) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const catItems = [...items]
      .filter(i => i.category === item.category)
      .sort((a, b) => a.sort_order - b.sort_order)
    const idx = catItems.findIndex(i => i.id === id)
    const swapIdx = idx + dir
    if (idx < 0 || swapIdx < 0 || swapIdx >= catItems.length) return
    const a = catItems[idx]
    const b = catItems[swapIdx]
    const supabase = createClient()
    await Promise.all([
      supabase.from('menu').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('menu').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    await fetchItems()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: '8px', padding: '10px 14px', fontSize: '14px',
    color: C.text, outline: 'none', boxSizing: 'border-box',
    fontFamily: FONT, transition: 'border-color 0.2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '7px',
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, fontFamily: FONT, WebkitFontSmoothing: 'antialiased', color: C.text }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:10px; }
        .menu-row:hover      { background:rgba(255,255,255,0.025) !important; }
        .icon-btn-edit:hover { border-color:${C.gold} !important; background:${C.goldDim} !important; }
        .icon-btn-del:hover  { border-color:${C.red}  !important; background:${C.redDim}  !important; }
        .filter-chip:hover   { border-color:${C.gold} !important; color:${C.goldLt} !important; background:${C.goldDim} !important; }
        .stat-card:hover     { transform:translateY(-2px); border-color:rgba(255,255,255,0.12) !important; }
        .add-btn:hover       { transform:translateY(-1px); box-shadow:0 8px 24px rgba(200,151,58,0.4) !important; }
        .cat-input:focus     { border-color:${C.gold} !important; outline:none; }
        .cat-item:hover      { background:rgba(255,255,255,0.04) !important; }
        .cat-move-btn:hover  { border-color:${C.gold} !important; color:${C.goldLt} !important; }
      `}</style>

      {toast && (
        <div style={{ position:'fixed', top:'20px', left:'50%', transform:'translateX(-50%)', zIndex:999, background:toast.ok?'#1A2A1A':'#2A1A1A', border:`1px solid ${toast.ok?C.greenBdr:C.redBdr}`, color:toast.ok?C.green:C.red, padding:'11px 22px', borderRadius:'12px', fontSize:'13px', fontWeight:700, whiteSpace:'nowrap', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast.ok ? '✓  ' : '✕  '}{toast.msg}
        </div>
      )}

      <div style={{ padding: '40px 44px' }}>

        {/* ── Top Bar ── */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'36px' }}>
          <div>
            <h1 style={{ fontWeight:900, fontSize:'32px', color:C.text, letterSpacing:'-0.01em', lineHeight:1, margin:0 }}>菜單管理</h1>
            <p style={{ fontSize:'13px', color:C.muted, marginTop:'8px' }}>管理您的品項、分類、價格與供應狀態</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ fontSize:'12px', color:C.muted, background:C.card, border:`1px solid ${C.border}`, padding:'8px 16px', borderRadius:'10px' }}>{clock}</div>
            <button onClick={openAdd} className="add-btn" style={{ display:'flex', alignItems:'center', gap:'8px', background:`linear-gradient(135deg, ${C.gold}, #A0722A)`, color:'#0D0D0F', fontWeight:700, fontSize:'13px', padding:'10px 20px', borderRadius:'10px', border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(200,151,58,0.3)', fontFamily:FONT, transition:'all 0.2s' }}>
              ＋ 新增品項
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'32px' }}>
          {[
            { icon:'🍜', value:items.length,         label:'菜單總數', top:C.gold,  bg:C.goldDim,  trend:null },
            { icon:'✅', value:countAvail,            label:'供應中',   top:C.green, bg:C.greenDim, trend:countAvail===items.length&&items.length>0?'● 全上架':null },
            { icon:'⏸', value:countUnavail,          label:'暫停供應', top:C.red,   bg:C.redDim,   trend:null },
            { icon:'🏷️', value:categories.length,    label:'分類數量', top:C.blue,  bg:C.blueDim,  trend:null },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'16px', padding:'22px 24px', position:'relative', overflow:'hidden', transition:'transform 0.2s, border-color 0.2s', animation:`fadeUp 0.4s ${0.05+i*0.05}s ease both`, cursor:'default' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg, ${s.top}, transparent)` }} />
              {s.trend && <span style={{ position:'absolute', top:'22px', right:'22px', fontSize:'11px', fontWeight:600, padding:'3px 8px', borderRadius:'6px', background:s.bg, color:s.top }}>{s.trend}</span>}
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', marginBottom:'16px' }}>{s.icon}</div>
              <div style={{ fontSize:'36px', fontWeight:700, lineHeight:1, marginBottom:'6px', color:s.top }}>{s.value}</div>
              <div style={{ fontSize:'12px', color:C.muted, fontWeight:500, letterSpacing:'0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Category Management Panel ── */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'20px', overflow:'hidden', marginBottom:'24px', animation:'fadeUp 0.4s 0.2s ease both' }}>
          <button
            onClick={() => setShowCatPanel(!showCatPanel)}
            style={{ width:'100%', padding:'18px 24px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:FONT }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:C.gold, boxShadow:`0 0 8px ${C.gold}` }} />
              <span style={{ fontSize:'16px', fontWeight:600, color:C.text }}>分類管理</span>
              {!catLoading && (
                <span style={{ fontSize:'11px', fontWeight:600, padding:'3px 8px', borderRadius:'6px', background:C.goldDim, color:C.goldLt }}>
                  {categories.length} 個分類
                </span>
              )}
            </div>
            <span style={{ color:C.muted, fontSize:'12px', display:'inline-block', transition:'transform 0.2s', transform:showCatPanel?'rotate(180deg)':'none' }}>▾</span>
          </button>

          {showCatPanel && (
            <div style={{ borderTop:`1px solid ${C.border}`, padding:'20px 24px' }}>
              {catLoading ? (
                <p style={{ color:C.muted, fontSize:'13px', textAlign:'center', padding:'16px 0' }}>載入中...</p>
              ) : catError === 'table_missing' ? (
                <div style={{ background:'rgba(232,91,91,0.08)', border:`1px solid ${C.redBdr}`, borderRadius:'12px', padding:'16px 20px', marginBottom:'16px' }}>
                  <p style={{ color:C.red, fontWeight:700, fontSize:'13px', margin:'0 0 8px' }}>⚠️ categories 資料表尚未建立</p>
                  <p style={{ color:C.muted, fontSize:'12px', lineHeight:1.7, margin:'0 0 12px' }}>請到 Supabase SQL Editor 執行以下 SQL，建立分類功能：</p>
                  <pre style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'12px', fontSize:'11px', color:C.text, overflowX:'auto', margin:0, lineHeight:1.6 }}>{`CREATE TABLE IF NOT EXISTS public.categories (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  store_slug text    NOT NULL,
  name       text    NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Auth write" ON public.categories FOR ALL USING (auth.role() = 'authenticated');`}</pre>
                  <button onClick={fetchCategories} style={{ marginTop:'12px', padding:'7px 16px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, color:C.muted, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:FONT }}>
                    重新檢查
                  </button>
                </div>
              ) : catError ? (
                <p style={{ color:C.red, fontSize:'13px', padding:'8px 0', margin:0 }}>載入失敗：{catError}</p>
              ) : categories.length === 0 ? (
                <p style={{ color:C.faint, fontSize:'13px', textAlign:'center', padding:'16px 0', margin:0 }}>尚無分類，請在下方新增第一個分類</p>
              ) : (
                <div style={{ marginBottom:'16px' }}>
                  {categories.map((cat, i) => {
                    const itemCount = items.filter(item => (item.category || '') === cat.name).length
                    return (
                      <div key={cat.id} className="cat-item" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', marginBottom:'4px', transition:'background 0.15s' }}>
                        <span style={{ width:'22px', height:'22px', borderRadius:'6px', background:C.goldDim, color:C.goldLt, fontSize:'11px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                        <span style={{ flex:1, fontSize:'14px', fontWeight:600, color:C.text }}>{cat.name}</span>
                        <span style={{ fontSize:'11px', color:C.faint, flexShrink:0 }}>{itemCount} 項</span>
                        <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                          <button onClick={() => moveCat(cat.id, -1)} disabled={i===0} className="cat-move-btn" style={{ width:'28px', height:'28px', borderRadius:'7px', border:`1px solid ${C.border}`, background:i===0?'transparent':C.surface, color:i===0?C.faint:C.muted, cursor:i===0?'not-allowed':'pointer', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>▲</button>
                          <button onClick={() => moveCat(cat.id, 1)} disabled={i===categories.length-1} className="cat-move-btn" style={{ width:'28px', height:'28px', borderRadius:'7px', border:`1px solid ${C.border}`, background:i===categories.length-1?'transparent':C.surface, color:i===categories.length-1?C.faint:C.muted, cursor:i===categories.length-1?'not-allowed':'pointer', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>▼</button>
                          <button onClick={() => setCatDeleteId(cat.id)} className="icon-btn-del" style={{ width:'28px', height:'28px', borderRadius:'7px', border:`1px solid ${C.border}`, background:C.surface, color:C.muted, cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>🗑</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div style={{ display:'flex', gap:'8px' }}>
                <input
                  type="text" value={catInput}
                  onChange={(e) => setCatInput(e.target.value)}
                  onKeyDown={(e) => e.key==='Enter' && addCategory()}
                  placeholder="輸入新分類名稱，按 Enter 或點新增..."
                  className="cat-input"
                  style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'10px 14px', fontSize:'14px', color:C.text, outline:'none', fontFamily:FONT, transition:'border-color 0.2s' }}
                />
                <button
                  onClick={addCategory}
                  disabled={catSaving || !catInput.trim()}
                  style={{ padding:'10px 20px', borderRadius:'8px', border:'none', background:catInput.trim()?`linear-gradient(135deg, ${C.gold}, #A0722A)`:C.faint, color:catInput.trim()?'#0D0D0F':C.muted, fontSize:'13px', fontWeight:700, cursor:catInput.trim()?'pointer':'not-allowed', fontFamily:FONT, whiteSpace:'nowrap', transition:'all 0.2s' }}
                >
                  {catSaving ? '...' : '＋ 新增'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Menu Panel ── */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'20px', overflow:'hidden', animation:'fadeUp 0.4s 0.25s ease both' }}>

          {/* Panel Header */}
          <div style={{ padding:'22px 28px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
            <div style={{ fontSize:'16px', fontWeight:600, display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:C.gold, boxShadow:`0 0 8px ${C.gold}` }} />
              菜單品項列表
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', background:C.surface, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'7px 14px' }}>
                <span style={{ color:C.muted, fontSize:'13px' }}>🔍</span>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜尋品項…" style={{ background:'none', border:'none', outline:'none', color:C.text, fontSize:'13px', fontFamily:FONT, width:'140px' }} />
              </div>
              {['all', ...catNames].map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className="filter-chip"
                  style={{ padding:'7px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:500, cursor:'pointer', border:`1px solid ${activeCategory===cat?C.gold:C.border}`, background:activeCategory===cat?C.goldDim:C.surface, color:activeCategory===cat?C.goldLt:C.muted, transition:'all 0.2s', fontFamily:FONT }}>
                  {cat === 'all' ? '全部' : cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height:'1px', background:`linear-gradient(90deg, ${C.goldDim}, transparent 60%)` }} />

          {/* Table Head */}
          <div style={{ display:'grid', gridTemplateColumns:TABLE_COLS, padding:'12px 28px', background:C.surface, borderBottom:`1px solid ${C.border}`, alignItems:'center' }}>
            {['', '品項名稱', '分類', '售價', '狀態', '操作'].map((h, i) => (
              <div key={i} style={{ fontSize:'11px', fontWeight:600, color:C.faint, letterSpacing:'0.08em', textTransform:'uppercase', textAlign:i===3?'right':i===4?'center':i===5?'right':'left' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding:'60px 20px', textAlign:'center', color:C.muted }}>
              <div style={{ fontSize:'48px', marginBottom:'16px' }}>⏳</div>
              <p style={{ fontSize:'14px' }}>載入中...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'60px 20px', textAlign:'center', color:C.muted }}>
              <div style={{ fontSize:'48px', marginBottom:'16px' }}>🫙</div>
              <p style={{ fontSize:'14px' }}>{search ? '沒有符合條件的品項' : '尚未建立任何品項'}</p>
            </div>
          ) : (() => {
            // Build per-category position maps for ▲▼ enable/disable
            const catGroups = new Map<string, string[]>()
            filtered.forEach(i => {
              const k = i.category || '其他'
              if (!catGroups.has(k)) catGroups.set(k, [])
              catGroups.get(k)!.push(i.id)
            })
            return filtered.map((item, idx) => {
              const catIds   = catGroups.get(item.category || '其他') ?? []
              const posInCat = catIds.indexOf(item.id)
              const isFirst  = posInCat === 0
              const isLast   = posInCat === catIds.length - 1
              return (
                <div key={item.id} className="menu-row"
                  style={{ display:'grid', gridTemplateColumns:TABLE_COLS, padding:'16px 28px', borderBottom:idx<filtered.length-1?`1px solid ${C.border}`:'none', alignItems:'center', transition:'background 0.15s', cursor:'default', opacity:item.available?1:0.6 }}>
                  <div>
                    <div style={{ width:'44px', height:'44px', borderRadius:'10px', background:'linear-gradient(135deg, #2A2010, #1A1808)', border:`1px solid ${C.goldBdr}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', overflow:'hidden' }}>
                      {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'9px' }} onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} /> : '🍽️'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:'15px', fontWeight:600, color:C.text, marginBottom:'4px' }}>{item.name}</div>
                    <div style={{ fontSize:'11px', color:C.faint, letterSpacing:'0.04em' }}>#{item.id.slice(0,6).toUpperCase()}</div>
                  </div>
                  <div>
                    <span style={{ display:'inline-block', padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:600, background:C.goldDim, color:C.goldLt, border:`1px solid ${C.goldBdr}` }}>
                      {item.category || '其他'}
                    </span>
                  </div>
                  <div style={{ fontSize:'16px', fontWeight:700, color:C.goldLt, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
                    <span style={{ fontSize:'11px', fontWeight:500, color:C.muted, marginRight:'2px' }}>NT$</span>{fmt(item.price)}
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <button onClick={() => toggleAvailable(item)}
                      style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:600, cursor:'pointer', border:`1px solid ${item.available?C.greenBdr:C.redBdr}`, background:item.available?C.greenDim:C.redDim, color:item.available?C.green:C.red, fontFamily:FONT }}>
                      <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
                      {item.available ? '供應中' : '已停售'}
                    </button>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'4px' }}>
                    <button onClick={() => moveItem(item.id, -1)} disabled={isFirst} className="cat-move-btn" title="上移" style={{ width:'28px', height:'28px', borderRadius:'7px', border:`1px solid ${C.border}`, background:isFirst?'transparent':C.surface, color:isFirst?C.faint:C.muted, cursor:isFirst?'not-allowed':'pointer', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', flexShrink:0 }}>▲</button>
                    <button onClick={() => moveItem(item.id, 1)} disabled={isLast} className="cat-move-btn" title="下移" style={{ width:'28px', height:'28px', borderRadius:'7px', border:`1px solid ${C.border}`, background:isLast?'transparent':C.surface, color:isLast?C.faint:C.muted, cursor:isLast?'not-allowed':'pointer', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', flexShrink:0 }}>▼</button>
                    <button onClick={() => openEdit(item)} className="icon-btn-edit" title="編輯" style={{ width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${C.border}`, background:C.surface, cursor:'pointer', fontSize:'13px', transition:'all 0.15s' }}>✏️</button>
                    <button onClick={() => setDeleteConfirm(item.id)} className="icon-btn-del" title="刪除" style={{ width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${C.border}`, background:C.surface, cursor:'pointer', fontSize:'13px', transition:'all 0.15s' }}>🗑</button>
                  </div>
                </div>
              )
            })
          })()}
        </div>

      </div>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:40, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'20px', width:'100%', maxWidth:'520px', boxShadow:'0 32px 80px rgba(0,0,0,0.6)', overflow:'hidden', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'22px 28px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div>
                <p style={{ fontSize:'11px', fontWeight:700, color:C.gold, textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 5px' }}>{editItem?'編輯品項':'新增品項'}</p>
                <h2 style={{ fontSize:'19px', fontWeight:800, color:C.text, margin:0 }}>{editItem?editItem.name:'填寫品項資料'}</h2>
              </div>
              <button onClick={closeModal} style={{ width:'34px', height:'34px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.surface, color:C.muted, fontSize:'16px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            <div style={{ padding:'22px 28px', display:'flex', flexDirection:'column', gap:'16px', overflowY:'auto' }}>
              <div>
                <label style={labelStyle}>品項名稱 *</label>
                <input style={inputStyle} type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="例如：招牌牛肉麵" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                <div>
                  <label style={labelStyle}>價格 (NT$) *</label>
                  <input style={inputStyle} type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="150" min="0" />
                </div>
                <div>
                  <label style={labelStyle}>分類</label>
                  <select style={{ ...inputStyle, cursor:'pointer', appearance:'none' }} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                    <option value="">請選擇分類</option>
                    {catNames.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>圖片網址（選填）</label>
                <input style={inputStyle} type="url" value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
                {form.image_url && (
                  <div style={{ marginTop:'10px', borderRadius:'10px', overflow:'hidden', border:`1px solid ${C.goldBdr}`, height:'120px', background:C.surface }}>
                    <img src={form.image_url} alt="預覽" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
                  </div>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.surface, border:`1px solid ${C.border}`, borderRadius:'12px', padding:'14px 18px' }}>
                <div>
                  <p style={{ fontSize:'14px', fontWeight:600, color:C.text, margin:'0 0 3px' }}>立即上架</p>
                  <p style={{ fontSize:'12px', color:C.muted, margin:0 }}>關閉後客人將看不到此品項</p>
                </div>
                <button onClick={() => setForm((p) => ({ ...p, available: !p.available }))} style={{ width:'46px', height:'26px', borderRadius:'13px', border:'none', cursor:'pointer', position:'relative', background:form.available?C.green:'rgba(255,255,255,0.1)', transition:'background 0.2s', flexShrink:0 }}>
                  <span style={{ position:'absolute', top:'3px', left:form.available?'23px':'3px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.3)', transition:'left 0.2s' }} />
                </button>
              </div>
            </div>

            <div style={{ padding:'16px 28px', borderTop:`1px solid ${C.border}`, display:'flex', gap:'10px', background:C.surface, flexShrink:0 }}>
              <button onClick={closeModal} style={{ flex:1, padding:'12px', border:`1px solid ${C.border}`, borderRadius:'12px', background:'transparent', color:C.muted, fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:FONT }}>取消</button>
              <button onClick={handleSave} disabled={saving} style={{ flex:2, padding:'12px', border:'none', borderRadius:'12px', background:saving?'rgba(255,255,255,0.1)':`linear-gradient(135deg, ${C.gold}, #A0722A)`, color:saving?C.muted:'#0D0D0F', fontSize:'14px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:FONT, boxShadow:saving?'none':'0 4px 14px rgba(200,151,58,0.35)' }}>
                {saving ? '儲存中...' : editItem ? '儲存修改' : '新增品項'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Item Confirm ── */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:C.card, border:`1px solid ${C.redBdr}`, borderRadius:'20px', width:'100%', maxWidth:'380px', padding:'36px 28px', textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:C.redDim, border:`1px solid ${C.redBdr}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', margin:'0 auto 20px' }}>🗑️</div>
            <p style={{ fontSize:'18px', fontWeight:800, color:C.text, margin:'0 0 8px' }}>確定要刪除這個品項？</p>
            <p style={{ fontSize:'14px', color:C.muted, margin:'0 0 28px', lineHeight:1.6 }}>刪除後無法復原，請確認後再操作</p>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex:1, padding:'13px', border:`1px solid ${C.border}`, borderRadius:'12px', background:'transparent', color:C.muted, fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:FONT }}>取消</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex:1, padding:'13px', border:'none', borderRadius:'12px', background:C.red, color:'#fff', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:FONT, boxShadow:'0 4px 12px rgba(232,91,91,0.4)' }}>確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Category Confirm ── */}
      {catDeleteId && (() => {
        const delCat     = categories.find(c => c.id === catDeleteId)
        const affectedN  = items.filter(i => (i.category || '') === delCat?.name).length
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div style={{ background:C.card, border:`1px solid ${C.redBdr}`, borderRadius:'20px', width:'100%', maxWidth:'360px', padding:'30px 24px', textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:C.redDim, border:`1px solid ${C.redBdr}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', margin:'0 auto 14px' }}>🏷️</div>
              <p style={{ fontSize:'16px', fontWeight:800, color:C.text, margin:'0 0 8px' }}>
                刪除「{delCat?.name}」分類？
              </p>
              {affectedN > 0 ? (
                <div style={{ background:'rgba(232,91,91,0.08)', border:`1px solid ${C.redBdr}`, borderRadius:'10px', padding:'10px 14px', margin:'0 0 20px', textAlign:'left' }}>
                  <p style={{ fontSize:'13px', color:C.red, fontWeight:700, margin:'0 0 4px' }}>
                    ⚠️ 此分類有 {affectedN} 個品項
                  </p>
                  <p style={{ fontSize:'12px', color:C.muted, margin:0, lineHeight:1.6 }}>
                    品項本身不會被刪除，但分類欄位將清空，在品項列表中顯示為無分類。
                  </p>
                </div>
              ) : (
                <p style={{ fontSize:'13px', color:C.muted, margin:'0 0 22px', lineHeight:1.6 }}>此分類目前沒有品項，刪除後無法復原。</p>
              )}
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => setCatDeleteId(null)} style={{ flex:1, padding:'12px', border:`1px solid ${C.border}`, borderRadius:'10px', background:'transparent', color:C.muted, fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:FONT }}>取消</button>
                <button onClick={() => deleteCategory(catDeleteId)} style={{ flex:1, padding:'12px', border:'none', borderRadius:'10px', background:C.red, color:'#fff', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:FONT }}>確認刪除</button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
