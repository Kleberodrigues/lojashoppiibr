import { useState } from 'react'
import type { ItemCarrinho, Cliente, MetodoPagamento, PixResponse, PedidoItem } from '../types'
import { criarPedidoAtomico, atualizarPaymentId } from '../lib/supabase'
import { gerarPix, criarPreferenciaCartao } from '../lib/mercadopago'

interface Props {
  itens: ItemCarrinho[]
  onVoltar: () => void
  onSucesso: (pixData: PixResponse | null) => void
}

function formatarPreco(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

function mascaraCPF(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4')
}

function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, '')
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3')
}

function mascaraCEP(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{5})(\d{0,3}).*/, '$1-$2')
}

function Input({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        {...props}
      />
    </div>
  )
}

export default function Checkout({ itens, onVoltar, onSucesso }: Props) {
  const [cliente, setCliente] = useState<Cliente>({
    nome: '', email: '', telefone: '', cpf: '',
    endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
  })
  const [metodo, setMetodo] = useState<MetodoPagamento>('pix')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)

  const total = itens.reduce((acc, i) => acc + i.produto.preco_venda * i.quantidade, 0)

  const setField = (field: keyof Omit<Cliente, 'endereco'>, value: string) =>
    setCliente(prev => ({ ...prev, [field]: value }))

  const setEnd = (field: keyof Cliente['endereco'], value: string) =>
    setCliente(prev => ({ ...prev, endereco: { ...prev.endereco, [field]: value } }))

  const buscarCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setCliente(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            rua: data.logradouro ?? prev.endereco.rua,
            bairro: data.bairro ?? prev.endereco.bairro,
            cidade: data.localidade ?? prev.endereco.cidade,
            estado: data.uf ?? prev.endereco.estado,
          },
        }))
      }
    } catch { /* silencioso */ }
    setBuscandoCep(false)
  }

  const itensPedido: PedidoItem[] = itens.map(i => ({
    produto_id: i.produto.id,
    sku: i.produto.sku,
    nome: i.produto.nome,
    preco_venda: i.produto.preco_venda,
    quantidade: i.quantidade,
    bling_id: i.produto.bling_id,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      if (metodo === 'pix') {
        const pixRes = await gerarPix(itensPedido, cliente, total)
        const result = await criarPedidoAtomico(itensPedido, cliente, total, 'pix')
        await atualizarPaymentId(result.pedido_id, pixRes.payment_id)
        onSucesso(pixRes)
      } else {
        const result = await criarPedidoAtomico(itensPedido, cliente, total, 'cartao')
        const initPoint = await criarPreferenciaCartao(result.pedido_id, itensPedido, cliente, total)
        window.location.href = initPoint
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao processar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onVoltar} className="text-gray-500 hover:text-gray-700 text-sm">← Voltar</button>
        <h1 className="text-2xl font-bold text-gray-800">Finalizar compra</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dados pessoais */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Dados pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Nome completo" required value={cliente.nome}
                onChange={e => setField('nome', e.target.value)} />
            </div>
            <Input label="E-mail" required type="email" value={cliente.email}
              onChange={e => setField('email', e.target.value)} />
            <Input label="WhatsApp" required placeholder="(11) 99999-9999" value={cliente.telefone}
              onChange={e => setField('telefone', mascaraTelefone(e.target.value))} />
            <Input label="CPF" required placeholder="000.000.000-00" value={cliente.cpf}
              onChange={e => setField('cpf', mascaraCPF(e.target.value))} />
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Endereço de entrega</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input label="CEP" required placeholder="00000-000" value={cliente.endereco.cep}
                onChange={e => {
                  const v = mascaraCEP(e.target.value)
                  setEnd('cep', v)
                  buscarCep(v)
                }}
              />
              {buscandoCep && <p className="text-xs text-gray-400 mt-1">Buscando CEP...</p>}
            </div>
            <div className="sm:col-span-2">
              <Input label="Rua" required value={cliente.endereco.rua}
                onChange={e => setEnd('rua', e.target.value)} />
            </div>
            <Input label="Número" required value={cliente.endereco.numero}
              onChange={e => setEnd('numero', e.target.value)} />
            <Input label="Complemento" value={cliente.endereco.complemento}
              onChange={e => setEnd('complemento', e.target.value)} />
            <Input label="Bairro" required value={cliente.endereco.bairro}
              onChange={e => setEnd('bairro', e.target.value)} />
            <Input label="Cidade" required value={cliente.endereco.cidade}
              onChange={e => setEnd('cidade', e.target.value)} />
            <Input label="Estado" required placeholder="SP" value={cliente.endereco.estado}
              maxLength={2}
              onChange={e => setEnd('estado', e.target.value.toUpperCase())} />
          </div>
        </div>

        {/* Pagamento */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Forma de pagamento</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['pix', 'cartao'] as MetodoPagamento[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMetodo(m)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${
                  metodo === m ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{m === 'pix' ? '📱' : '💳'}</span>
                <span className="font-semibold text-sm">{m === 'pix' ? 'PIX' : 'Cartão'}</span>
                <span className="text-xs text-gray-500">
                  {m === 'pix' ? 'Aprovação imediata' : 'Crédito / Débito'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="space-y-1.5 mb-3">
            {itens.map(item => (
              <div key={item.produto.id} className="flex justify-between text-sm text-gray-600">
                <span className="truncate mr-2 flex-1">{item.produto.nome} × {item.quantidade}</span>
                <span className="flex-shrink-0 font-medium">
                  {formatarPreco(item.produto.preco_venda * item.quantidade)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold text-orange-600">{formatarPreco(total)}</span>
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-4 rounded-xl font-bold text-lg transition-colors"
        >
          {loading
            ? 'Processando...'
            : metodo === 'pix'
            ? '📱 Gerar PIX — ' + formatarPreco(total)
            : '💳 Pagar com Cartão — ' + formatarPreco(total)}
        </button>
      </form>
    </div>
  )
}
