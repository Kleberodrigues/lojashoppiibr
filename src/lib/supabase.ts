import { createClient } from '@supabase/supabase-js'
import type { Produto, PedidoItem, Cliente } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface FiltrosProduto {
  busca?: string
  categoria?: string
  grade?: string
  pagina?: number
  porPagina?: number
}

export async function buscarProdutos(filtros: FiltrosProduto = {}) {
  const { busca, categoria, grade, pagina = 1, porPagina = 24 } = filtros
  const from = (pagina - 1) * porPagina
  const to = from + porPagina - 1

  let query = supabase
    .from('produtos_loja')
    .select('*', { count: 'exact' })
    .order('preco_venda', { ascending: true })
    .range(from, to)

  if (busca) query = query.ilike('nome', `%${busca}%`)
  if (categoria) query = query.eq('categoria_ml', categoria)
  if (grade) query = query.eq('grade', grade)

  const { data, error, count } = await query
  if (error) throw error
  return { produtos: (data ?? []) as Produto[], total: count ?? 0 }
}

export async function buscarCategorias(): Promise<string[]> {
  const { data, error } = await supabase
    .from('produtos_loja')
    .select('categoria_ml')
    .not('categoria_ml', 'is', null)

  if (error) throw error
  const todas = (data ?? []).map((d: { categoria_ml: string }) => d.categoria_ml).filter(Boolean) as string[]
  return [...new Set(todas)].sort()
}

export async function criarPedidoAtomico(
  itens: PedidoItem[],
  cliente: Cliente,
  total: number,
  metodo: 'pix' | 'cartao'
): Promise<{ pedido_id: string }> {
  const { data, error } = await supabase.rpc('criar_pedido_atomico', {
    p_itens: itens,
    p_cliente: cliente,
    p_total: total,
    p_payment_method: metodo,
  })
  if (error) throw error
  return data as { pedido_id: string }
}

export async function atualizarPaymentId(pedidoId: string, paymentId: string) {
  const { error } = await supabase.rpc('atualizar_payment_id', {
    p_pedido_id: pedidoId,
    p_payment_id: paymentId,
  })
  if (error) throw error
}
