import type { ItemCarrinho } from '../types'

interface Props {
  itens: ItemCarrinho[]
  onVoltar: () => void
  onCheckout: () => void
  onRemover: (produtoId: string) => void
  onAtualizarQuantidade: (produtoId: string, quantidade: number) => void
}

function formatarPreco(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

export default function Carrinho({ itens, onVoltar, onCheckout, onRemover, onAtualizarQuantidade }: Props) {
  const subtotal = itens.reduce((acc, i) => acc + i.produto.preco_venda * i.quantidade, 0)
  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0)

  if (itens.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Seu carrinho está vazio</h2>
        <p className="text-gray-500 mb-6">Adicione produtos para continuar</p>
        <button
          onClick={onVoltar}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Ver produtos
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onVoltar} className="text-gray-500 hover:text-gray-700 text-sm">
          ← Continuar comprando
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Carrinho</h1>
      </div>

      <div className="space-y-3 mb-6">
        {itens.map(item => (
          <div key={item.produto.id} className="bg-white rounded-xl p-4 flex gap-4 shadow-sm border border-gray-100">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {item.produto.url_imagem_principal ? (
                <img
                  src={item.produto.url_imagem_principal}
                  alt={item.produto.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-800 text-sm line-clamp-2">{item.produto.nome}</h3>
              {item.produto.variacao_completa && (
                <p className="text-xs text-gray-500 mt-0.5">{item.produto.variacao_completa}</p>
              )}
              <p className="text-orange-600 font-bold mt-1 text-sm">{formatarPreco(item.produto.preco_venda)}</p>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <button
                onClick={() => onRemover(item.produto.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Remover
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAtualizarQuantidade(item.produto.id, item.quantidade - 1)}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-medium">{item.quantidade}</span>
                <button
                  onClick={() => onAtualizarQuantidade(item.produto.id, item.quantidade + 1)}
                  disabled={item.quantidade >= item.produto.estoque_atual}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {formatarPreco(item.produto.preco_venda * item.quantidade)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
          <span>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
        </div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-semibold text-gray-700">Total</span>
          <span className="text-2xl font-bold text-orange-600">{formatarPreco(subtotal)}</span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-lg transition-colors"
        >
          Finalizar compra
        </button>
      </div>
    </div>
  )
}
