import type { Cliente, PedidoItem, PixResponse } from '../types'

const N8N_BASE = import.meta.env.VITE_N8N_BASE as string

export async function gerarPix(
  itens: PedidoItem[],
  cliente: Cliente,
  total: number
): Promise<PixResponse> {
  const res = await fetch(`${N8N_BASE}/webhook/mp-criar-pix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itens, cliente, total }),
  })
  if (!res.ok) throw new Error('Erro ao gerar PIX. Tente novamente.')
  return res.json()
}

export async function criarPreferenciaCartao(
  pedidoId: string,
  itens: PedidoItem[],
  cliente: Cliente,
  total: number
): Promise<string> {
  const res = await fetch(`${N8N_BASE}/webhook/mp-criar-preferencia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pedido_id: pedidoId, itens, cliente, total }),
  })
  if (!res.ok) throw new Error('Erro ao criar pagamento com cartão. Tente novamente.')
  const data = await res.json()
  return data.init_point as string
}
