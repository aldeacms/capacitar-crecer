import { NextRequest, NextResponse } from 'next/server'

/**
 * Página intermediaria que hace el POST form hacia Transbank.
 *
 * Transbank requiere que el redirect sea un POST con token_ws como campo oculto,
 * NO una redirección GET. Esta ruta sirve un HTML que auto-envía el formulario.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tbkUrl = searchParams.get('tbk_url')
  const tbkToken = searchParams.get('tbk_token')

  if (!tbkUrl || !tbkToken) {
    return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 })
  }

  // Sanitize: solo permitir URLs de Transbank
  const decodedUrl = decodeURIComponent(tbkUrl)
  const isTransbankUrl =
    decodedUrl.startsWith('https://webpay3gint.transbank.cl') ||
    decodedUrl.startsWith('https://webpay3g.transbank.cl')

  if (!isTransbankUrl) {
    return NextResponse.json({ error: 'URL no permitida' }, { status: 400 })
  }

  const decodedToken = decodeURIComponent(tbkToken)

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirigiendo a Transbank...</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
    .card { text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,.08); max-width: 360px; width: 100%; }
    .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #28B4AD; border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { color: #64748b; font-size: .9rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <p>Redirigiendo a Transbank WebPay...</p>
  </div>
  <form id="tbk" action="${decodedUrl}" method="POST" style="display:none">
    <input type="hidden" name="token_ws" value="${decodedToken}" />
  </form>
  <script>document.getElementById('tbk').submit();</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
