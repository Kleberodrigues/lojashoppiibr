import { useState, useEffect, useCallback } from 'react'
import type { Produto, ItemCarrinho } from '../types'
import { buscarProdutos, buscarCategorias } from '../lib/supabase'

interface Props {
  onAdicionarAoCarrinho: (item: ItemCarrinho) => void
  onIrParaCarrinho: () => void
  carrinhoIds: string[]
}

const GRADE_CONFIG: Record<string, { label: string; desc: string; bg: string; text: string; border: string; icon: string }> = {
  A: { label: 'Grade A', desc: 'Produto perfeito, sem defeitos', bg: '#f0fdf4', text: '#15803d', border: '#86efac', icon: '✦' },
  B: { label: 'Grade B', desc: 'Embalagem danificada ou pequenas avarias estéticas', bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd', icon: '◈' },
  C: { label: 'Grade C', desc: 'Produto avariado', bg: '#fefce8', text: '#a16207', border: '#fde047', icon: '▲' },
}

const GRADE_BADGE: Record<string, string> = {
  A: 'bg-green-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-amber-400 text-white',
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
  const gradeConfig = produto.grade ? GRADE_CONFIG[produto.grade] : null

  return (
    <div
      className="bg-white flex flex-col overflow-hidden transition-all duration-200 cursor-pointer"
      style={{ borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #ebebeb' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
    >
      {/* Imagem */}
      <div className="relative bg-gray-50" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0">
          {produto.url_imagem_principal ? (
            <img
              src={produto.url_imagem_principal}
              alt={produto.nome}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={e => {
                const img = e.currentTarget
                img.style.display = 'none'
                const fallback = img.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className="w-full h-full items-center justify-center text-gray-200 text-4xl"
            style={{ display: produto.url_imagem_principal ? 'none' : 'flex' }}
          >
            📦
          </div>
        </div>
        {desconto > 0 && (
          <span className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-lg z-10"
            style={{ background: '#ef4444', fontSize: 11 }}>
            -{desconto}%
          </span>
        )}
        {produto.grade && (
          <span className={`absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-lg z-10 ${GRADE_BADGE[produto.grade] ?? 'bg-gray-400'}`}
            style={{ fontSize: 11 }}>
            Grade {produto.grade}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        {produto.categoria_ml && (
          <p className="text-xs font-medium mb-1 line-clamp-1" style={{ color: '#9ca3af', fontSize: 10 }}>{produto.categoria_ml}</p>
        )}
        <h3 className="text-sm font-semibold line-clamp-2 flex-1" style={{ color: '#1f2937', lineHeight: 1.4 }}>{produto.nome}</h3>
        {produto.variacao_completa && (
          <p className="text-xs mt-1 line-clamp-1" style={{ color: '#9ca3af' }}>{produto.variacao_completa}</p>
        )}
        {gradeConfig && (
          <p className="text-xs mt-1 font-medium" style={{ color: gradeConfig.text }}>{gradeConfig.icon} {gradeConfig.label}</p>
        )}
        <div className="mt-2">
          {produto.preco_mercado > produto.preco_venda && (
            <p className="text-xs line-through" style={{ color: '#d1d5db' }}>{formatarPreco(produto.preco_mercado)}</p>
          )}
          <p className="font-bold" style={{ color: '#ea580c', fontSize: 17 }}>{formatarPreco(produto.preco_venda)}</p>
        </div>
        <button
          onClick={onAdicionar}
          disabled={noCarrinho}
          className="mt-3 w-full py-2 rounded-xl text-sm font-semibold transition-all"
          style={noCarrinho
            ? { background: '#dcfce7', color: '#16a34a', cursor: 'default' }
            : { background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }
          }
        >
          {noCarrinho ? '✓ Adicionado' : 'Adicionar'}
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
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [busca, categoria, grade, pagina])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { buscarCategorias().then(setCategorias).catch(console.error) }, [])

  const handleBusca = (e: React.FormEvent) => { e.preventDefault(); setBusca(buscaInput); setPagina(1) }
  const handleCategoria = (e: React.ChangeEvent<HTMLSelectElement>) => { setCategoria(e.target.value); setPagina(1) }
  const handleGrade = (e: React.ChangeEvent<HTMLSelectElement>) => { setGrade(e.target.value); setPagina(1) }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Barra de busca e filtros */}
      <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm" style={{ border: '1px solid #ebebeb' }}>
        <form onSubmit={handleBusca} className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={buscaInput}
            onChange={e => setBuscaInput(e.target.value)}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ background: '#f8f8f8', border: '1.5px solid #e5e7eb', fontSize: 14 }}
            onFocus={e => (e.target.style.borderColor = '#f97316')}
            onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
          />
          <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            Buscar
          </button>
        </form>
        <div className="flex gap-2 flex-wrap">
          <select value={categoria} onChange={handleCategoria}
            className="flex-1 min-w-0 rounded-xl px-3 py-2 text-sm outline-none bg-white"
            style={{ border: '1.5px solid #e5e7eb', color: '#374151' }}>
            <option value="">Todas as categorias</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={grade} onChange={handleGrade}
            className="rounded-xl px-3 py-2 text-sm outline-none bg-white"
            style={{ border: '1.5px solid #e5e7eb', color: '#374151' }}>
            <option value="">Todas as grades</option>
            <option value="A">Grade A — Perfeito</option>
            <option value="B">Grade B — Avaria estética</option>
            <option value="C">Grade C — Avariado</option>
          </select>
        </div>
      </div>

      {/* Legenda de grades — destaque */}
      <div className="mb-5 rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #ebebeb' }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#1f2937' }}>
          <span className="text-white font-bold text-sm">📋 Entenda as Grades</span>
          <span className="text-gray-400 text-xs">— Qualidade dos produtos de logística reversa</span>
        </div>
        <div className="grid grid-cols-3 divide-x" style={{ background: 'white', borderTop: '1px solid #f3f4f6' }}>
          {Object.entries(GRADE_CONFIG).map(([key, cfg]) => (
            <div key={key} className="p-3 flex flex-col gap-1" style={{ background: cfg.bg }}>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: GRADE_BADGE[key]?.includes('green') ? '#22c55e' : GRADE_BADGE[key]?.includes('blue') ? '#3b82f6' : '#f59e0b' }}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs leading-snug" style={{ color: cfg.text, fontWeight: 500 }}>{cfg.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contador */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
          {loading ? 'Carregando...' : `${total.toLocaleString('pt-BR')} produtos`}
        </p>
        {carrinhoIds.length > 0 && (
          <button onClick={onIrParaCarrinho}
            className="text-sm font-semibold transition-colors"
            style={{ color: '#ea580c' }}>
            Ver carrinho ({carrinhoIds.length})
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl animate-pulse" style={{ height: 280, background: '#f3f4f6' }} />
          ))}
        </div>
      ) : produtos.length === 0 ? (
        <div className="text-center py-20" style={{ color: '#9ca3af' }}>
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-medium">Nenhum produto encontrado</p>
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
        <div className="mt-10 flex justify-center items-center gap-3">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 bg-white"
            style={{ border: '1.5px solid #e5e7eb', color: '#374151' }}>
            ← Anterior
          </button>
          <span className="text-sm font-medium px-3" style={{ color: '#6b7280' }}>{pagina} / {totalPaginas}</span>
          <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 bg-white"
            style={{ border: '1.5px solid #e5e7eb', color: '#374151' }}>
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
