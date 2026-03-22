'use client'

import { useEffect } from 'react'
import OwnerSidebar  from './OwnerSidebar'

type OwnerDrawerProps = {
  open:      boolean
  storeSlug: string
  onClose:   () => void
}

export default function OwnerDrawer({ open, storeSlug, onClose }: OwnerDrawerProps) {

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className="md:hidden">
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`
          fixed inset-0 z-40
          bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="導航選單"
        className={`
          fixed top-0 left-0 bottom-0 z-50
          transition-transform duration-300 ease-in-out shadow-2xl
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <OwnerSidebar
          storeSlug={storeSlug}
          collapsed={false}
          onNavigate={onClose}
        />
      </div>
    </div>
  )
}
