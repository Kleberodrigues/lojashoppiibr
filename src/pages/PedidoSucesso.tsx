import { useState } from 'react'
import type { PixResponse } from '../types'

interface Props {
  pixData: PixResponse | null
  onVoltar: () => void
}

export default function PedidoSucesso({ pixData, onVoltar }: Props) {
  const [copiado, setCopiado] = useState(false)

  const copiarPix = async () => {
    if (!pixData?.copia_e_cola) return
    try {
      await navigator.clipboard.writeText(pixData.copia_e_cola)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    } catch { /* fallback silencioso */ }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      {pixData ? (
        <>
          <div className="text-5xl mb-3">📱</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pague com PIX</h1>
          <p className="text-gray-500 mb-6 text-sm">
            Escaneie o QR code ou copie o código abaixo. O PIX expira em 30 minutos.
          </p>

          {pixData.qr_code_base64 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 inline-block mb-5">
              <img
                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                alt="QR Code PIX"
                className="w-52 h-52 mx-auto"
              />
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left border border-gray-200">
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">PIX Copia e Cola</p>
            <p className="text-xs text-gray-700 break-all font-mono leading-relaxed select-all">
              {pixData.copia_e_cola}
            </p>
          </div>

          <button
            onClick={copiarPix}
            className={`w-full py-3 rounded-xl font-semibold text-white mb-4 transition-colors ${
              copiado ? 'bg-green-500' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {copiado ? '✓ Copiado!' : 'Copiar código PIX'}
          </button>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700 text-left">
            <p className="font-semibold mb-1">Após o pagamento</p>
            <p>Você receberá a confirmação pelo WhatsApp assim que o pagamento for aprovado.</p>
          </div>
        </>
      ) : (
        <>
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pedido realizado!</h1>
          <p className="text-gray-500 mb-6 text-sm">
            Você foi redirecionado para o pagamento. Após a confirmação, entraremos em contato pelo WhatsApp.
          </p>
        </>
      )}

      <button
        onClick={onVoltar}
        className="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
      >
        ← Continuar comprando
      </button>
    </div>
  )
}
