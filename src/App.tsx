import { useState } from 'react'
import type { ItemCarrinho, Pagina, PixResponse } from './types'
import Catalogo from './pages/Catalogo'
import Carrinho from './pages/Carrinho'
import Checkout from './pages/Checkout'
import PedidoSucesso from './pages/PedidoSucesso'

export default function App() {
  const [pagina, setPagina] = useState<Pagina>('catalogo')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [pixData, setPixData] = useState<PixResponse | null>(null)

  const adicionarAoCarrinho = (item: ItemCarrinho) => {
    setCarrinho(prev => {
      const existente = prev.find(i => i.produto.id === item.produto.id)
      if (existente) {
        return prev.map(i =>
          i.produto.id === item.produto.id
            ? { ...i, quantidade: Math.min(i.quantidade + item.quantidade, i.produto.estoque_atual) }
            : i
        )
      }
      return [...prev, item]
    })
  }

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(prev => prev.filter(i => i.produto.id !== produtoId))
  }

  const atualizarQuantidade = (produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removerDoCarrinho(produtoId)
      return
    }
    setCarrinho(prev =>
      prev.map(i => i.produto.id === produtoId ? { ...i, quantidade } : i)
    )
  }

  const limparCarrinho = () => setCarrinho([])
  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setPagina('catalogo')}
            className="text-xl font-bold tracking-tight hover:opacity-90 transition-opacity"
          >
            Achadinhos Shoppiibr
          </button>
          <button
            onClick={() => setPagina('carrinho')}
            className="relative flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors"
          >
            <span>Carrinho</span>
            {totalItens > 0 && (
              <span className="bg-white text-orange-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItens}
              </span>
            )}
          </button>
        </div>
      </header>

      {pagina === 'catalogo' && (
        <Catalogo
          onAdicionarAoCarrinho={adicionarAoCarrinho}
          onIrParaCarrinho={() => setPagina('carrinho')}
          carrinhoIds={carrinho.map(i => i.produto.id)}
        />
      )}
      {pagina === 'carrinho' && (
        <Carrinho
          itens={carrinho}
          onVoltar={() => setPagina('catalogo')}
          onCheckout={() => setPagina('checkout')}
          onRemover={removerDoCarrinho}
          onAtualizarQuantidade={atualizarQuantidade}
        />
      )}
      {pagina === 'checkout' && (
        <Checkout
          itens={carrinho}
          onVoltar={() => setPagina('carrinho')}
          onSucesso={(pix) => {
            setPixData(pix)
            limparCarrinho()
            setPagina('sucesso')
          }}
        />
      )}
      {pagina === 'sucesso' && (
        <PedidoSucesso
          pixData={pixData}
          onVoltar={() => {
            setPixData(null)
            setPagina('catalogo')
          }}
        />
      )}
    </div>
  )
}
