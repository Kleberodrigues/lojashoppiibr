import { useState, useEffect, useCallback } from 'react'
import type { Produto, ItemCarrinho } from '../types'
import { buscarProdutos, buscarCategorias } from '../lib/supabase'

interface Props {
  onAdicionarAoCarrinho: (item: ItemCarrinho) => void
  onIrParaCarrinho: () => void
  carrinhoIds: string[]
}

const GRADE_LABEL: Record<string, string> = {
  A: 'Perfeito',
  B: 'Embalagem danificada ou pequenas avarias estéticas',
  C: 'Avariado',
}

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-red-100 text-red-700',
}

function formatarPreco(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

function calcularDesconto(venda: number, mercado: number) {
  if (!mercado || mercado <= venda) return 0
  return Math.round(((mercado - venda) / mercado) * 100)
}

function CardProduto({ produto, noCarrinho, onAdicionar }: {
  produto: Produto
  noCarrinho: boolean
  onAdicionar: () => void
}) {
  const desconto = calcularDesconto(produto.preco_venda, produto.preco_mercado)

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col overflow-hidden">
      <div className="relative bg-gray-100" style={{ paddingBottom: '100%', position: 'relative' }}>
        <div className="absolute inset-0">
          {produto.url_imagem_principal ? (
            <img
              src={produto.url_imagem_principal}
              alt={produto.nome}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">
              📦
            </div>
          )}
        </div>
        {desconto > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
            -{desconto}%
          </span>
        )}
        {produto.grade && (
          <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full z-10 ${GRADE_COLOR[produto.grade] ?? 'bg-gray-100 text-gray-600'}`}>
            Grau {produto.grade}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-1 truncate">{produto.categoria_ml}</p>
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 flex-1">{produto.nome}</h3>
        {produto.variacao_completa && (
          <p className="text-xs text-gray-500 truncate">{produto.variacao_completa}</p>
        )}
        <div className="mt-2">
          {produto.preco_mercado > produto.preco_venda && (
            <p className="text-xs text-gray-400 line-through">{formatarPreco(produto.preco_mercado)}</p>
          )}
          <p className="text-base font-bold text-orange-600">{formatarPreco(produto.preco_venda)}</p>
        </div>
        <button
          onClick={onAdicionar}
          disabled={noCarrinho}
          className={`mt-2 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            noCarrinho
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {noCarrinho ? '✓ No carrinho' : 'Adicionar'}
        </button>
      </div>
    </div>
  )
}

const POR_PAGINA = 24

export default function Catalogo({ onAdicionarAoCarrinho, onIrParaCarrinho, carrinhoIds }: Props) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [total, setTotal] = useState(0)
  const [categorias, setCategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [buscaInput, setBuscaInput] = useState('')
  const [categoria, setCategoria] = useState('')
  const [grade, setGrade] = useState('')
  const [pagina, setPagina] = useState(1)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const result = await buscarProdutos({ busca, categoria, grade, pagina, porPagina: POR_PAGINA })
      setProdutos(result.produtos)
      setTotal(result.total)
    } catch (e) {
      console.error('Erro ao buscar produtos:', e)
    } finally {
      setLoading(false)
    }
  }, [busca, categoria, grade, pagina])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    buscarCategorias().then(setCategorias).catch(console.error)
  }, [])

  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault()
    setBusca(buscaInput)
    setPagina(1)
  }

  const handleCategoria = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoria(e.target.value)
    setPagina(1)
  }

  const handleGrade = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGrade(e.target.value)
    setPagina(1)
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleBusca} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={buscaInput}
            onChange={e => setBuscaInput(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Buscar
          </button>
        </form>
        <select
          value={categoria}
          onChange={handleCategoria}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        >
          <option value="">Todas as categorias</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={grade}
          onChange={handleGrade}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        >
          <option value="">Todos os graus</option>
          <option value="A">Grau A — Perfeito</option>
          <option value="B">Grau B — Embalagem danificada / pequenas avarias</option>
          <option value="C">Grau C — Avariado</option>
        </select>
      </div>

      {/* Legenda de grades */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Grau A</span>
          <span className="text-gray-500">Perfeito</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Grau B</span>
          <span className="text-gray-500">Embalagem danificada ou pequenas avarias estéticas</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">Grau C</span>
          <span className="text-gray-500">Avariado</span>
        </span>
      </div>

      {/* Contador e link carrinho */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? 'Carregando...' : `${total.toLocaleString('pt-BR')} produtos encontrados`}
        </p>
        {carrinhoIds.length > 0 && (
          <button
            onClick={onIrParaCarrinho}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Ver carrinho ({carrinhoIds.length})
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : produtos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {produtos.map(produto => (
            <CardProduto
              key={produto.id}
              produto={produto}
              noCarrinho={carrinhoIds.includes(produto.id)}
              onAdicionar={() => onAdicionarAoCarrinho({ produto, quantidade: 1 })}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
          >
            ← Anterior
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {pagina} / {totalPaginas}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
