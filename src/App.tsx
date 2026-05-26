import { useState } from 'react'
import type { ItemCarrinho, Pagina, PixResponse } from './types'
import Catalogo from './pages/Catalogo'
import Carrinho from './pages/Carrinho'
import Checkout from './pages/Checkout'
import PedidoSucesso from './pages/PedidoSucesso'

function IconCarrinho() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}

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
    if (quantidade <= 0) { removerDoCarrinho(produtoId); return }
    setCarrinho(prev => prev.map(i => i.produto.id === produtoId ? { ...i, quantidade } : i))
  }

  const limparCarrinho = () => setCarrinho([])
  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0)

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f0' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-md" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <button onClick={() => setPagina('catalogo')} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="Shoppiibr" className="h-11 w-11 rounded-full object-cover ring-2 ring-white/30" />
            <div className="text-left hidden sm:block">
              <p className="text-white font-bold text-lg leading-tight">Achadinhos</p>
              <p className="text-orange-100 text-xs font-medium leading-tight">Shoppiibr Variedades</p>
            </div>
          </button>

          <button
            onClick={() => setPagina('carrinho')}
            className="relative flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-xl transition-all"
            style={{ background: 'rgba(0,0,0,0.2)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.2)')}
          >
            <IconCarrinho />
            <span className="hidden sm:inline">Carrinho</span>
            {totalItens > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
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
          onSucesso={(pix) => { setPixData(pix); limparCarrinho(); setPagina('sucesso') }}
        />
      )}
      {pagina === 'sucesso' && (
        <PedidoSucesso
          pixData={pixData}
          onVoltar={() => { setPixData(null); setPagina('catalogo') }}
        />
      )}
    </div>
  )
}
