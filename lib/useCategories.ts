'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CategoryRow = { id: string; name: string; sort_order: number }

export function useCategories(storeSlug: string) {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!storeSlug) return
    const supabase = createClient()
    const { data } = await supabase
      .from('categories')
      .select('id, name, sort_order')
      .eq('store_slug', storeSlug)
      .order('sort_order', { ascending: true })
    setCategories(data ?? [])
    setLoading(false)
  }, [storeSlug])

  useEffect(() => { refetch() }, [refetch])

  return { categories, loading, refetch }
}
