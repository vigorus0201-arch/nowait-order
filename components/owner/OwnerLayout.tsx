'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import OwnerSidebar from './OwnerSidebar'
import OwnerHeader  from './OwnerHeader'
import OwnerDrawer  from './OwnerDrawer'

type OwnerLayoutProps = {
  storeSlug: string
  children:  React.ReactNode
}

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '':        { title: '營運總覽', subtitle: '今日營運摘要與快速入口' },
  '/menu':   { title: '菜單管理', subtitle: '管理品項、上下架與售價' },
  '/pos':    { title: '老闆點單', subtitle: '現場幫客人快速建立訂單' },
  '/orders': { title: '訂單查詢', subtitle: '查看今日與歷史訂單' },
}

function resolvePageMeta(pathname: string, storeSlug: string) {
  const base    = `/owner/${storeSlug}`
  const segment = pathname.startsWith(base) ? pathname.slice(base.length) : ''
  // 處理子路由（如 /menu/new 也顯示菜單管理）
  const key     = Object.keys(PAGE_META)
    .filter(k => k !== '')
    .find(k => segment.startsWith(k))
    ?? (segment === '' ? '' : null)

  return key !== null && key !== undefined
    ? PAGE_META[key]
    : { title: '老闆後台', subtitle: storeSlug }
}

export default function OwnerLayout({ storeSlug, children }: OwnerLayoutProps) {
  const router   = useRouter()
  const pathname = usePathname()

  const [mounted,    setMounted]    = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed,  setCollapsed]  = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // iPad 偵測
  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth >= 768 && window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // 換頁關 Drawer
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Auth 檢查（UI 遮罩層，MVP 用）
  useEffect(() => {
    if (!mounted) return
    const ok   = localStorage.getItem('owner_authenticated')
    const slug = localStorage.getItem('owner_store_slug')
    if (!ok || slug !== storeSlug) {
      router.replace('/owner/login')
    }
  }, [mounted, router, storeSlug])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('owner_authenticated')
    localStorage.removeItem('owner_store_slug')
    router.replace('/owner/login')
  }, [router])

  const { title, subtitle } = useMemo(
    () => resolvePageMeta(pathname, storeSlug),
    [pathname, storeSlug]
  )

  if (!mounted) return null

  return (
    <div className="min-h-screen text-white flex" style={{ background: '#0D0D0F' }}>

      {/* Desktop / iPad Sidebar */}
      <div className="hidden md:flex flex-col flex-shrink-0">
        <OwnerSidebar storeSlug={storeSlug} collapsed={collapsed} />
      </div>

      {/* Mobile Drawer */}
      <OwnerDrawer
        open={drawerOpen}
        storeSlug={storeSlug}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <OwnerHeader
          title={title}
          subtitle={subtitle}
          storeSlug={storeSlug}
          showMenuButton={true}
          onMenuClick={() => setDrawerOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-5 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  )
}
