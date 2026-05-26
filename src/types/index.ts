export interface Produto {
  id: string
  sku: string
  nome: string
  descricao: string | null
  preco_venda: number
  preco_mercado: number
  estoque_atual: number
  categoria_ml: string | null
  url_imagem_principal: string | null
  urls_imagens_extras: string[] | null
  variacao: string | null
  variacao_completa: string | null
  tamanho: string | null
  grade: string | null
  condicao: string | null
  bling_id: string | null
  marca: string | null
  peso_bruto: number
  largura_cm: number
  altura_cm: number
  profundidade_cm: number
}

export interface ItemCarrinho {
  produto: Produto
  quantidade: number
}

export interface Cliente {
  nome: string
  email: string
  telefone: string
  cpf: string
  endereco: {
    rua: string
    numero: string
    complemento: string
    bairro: string
    cidade: string
    estado: string
    cep: string
  }
}

export interface PedidoItem {
  produto_id: string
  sku: string
  nome: string
  preco_venda: number
  quantidade: number
  bling_id: string | null
}

export type Pagina = 'catalogo' | 'carrinho' | 'checkout' | 'sucesso'

export type MetodoPagamento = 'pix' | 'cartao'

export interface PixResponse {
  qr_code: string
  qr_code_base64: string
  copia_e_cola: string
  payment_id: string
}
