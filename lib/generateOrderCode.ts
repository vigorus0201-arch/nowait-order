import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generate a daily-sequential order code: YYYYMMDD-0001
 * Queries DB for the highest sequence number today, then increments.
 */
export async function generateOrderCode(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  storeSlug: string,
): Promise<string> {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm   = String(now.getMonth() + 1).padStart(2, '0')
  const dd   = String(now.getDate()).padStart(2, '0')
  const datePrefix = `${yyyy}${mm}${dd}`

  // Find the latest order_code for today in this store
  const { data } = await supabase
    .from('orders')
    .select('order_code')
    .eq('store_slug', storeSlug)
    .like('order_code', `${datePrefix}-%`)
    .order('order_code', { ascending: false })
    .limit(1)

  let seq = 1
  if (data && data.length > 0) {
    const lastCode = (data[0].order_code as string) ?? ''
    const parts = lastCode.split('-')
    if (parts.length === 2) {
      const lastSeq = parseInt(parts[1], 10)
      if (!isNaN(lastSeq)) seq = lastSeq + 1
    }
  }

  return `${datePrefix}-${String(seq).padStart(4, '0')}`
}
