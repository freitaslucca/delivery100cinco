/**
 * No-op stubs.
 *
 * Versões anteriores usavam Socket.IO, mas a Vercel (plano Hobby/Pro) não suporta
 * conexões WebSocket persistentes em serverless functions. O frontend agora faz
 * polling do endpoint /api/orders a cada 3s pra detectar novos pedidos e mudanças
 * de status. Mantemos os helpers exportados pra não quebrar imports nas rotas —
 * mas eles não fazem nada em produção serverless.
 */

export function emitNewOrder(_order: unknown): void {
  // no-op
}

export function emitStatusChanged(_order: unknown): void {
  // no-op
}

export function emitOrderDeleted(_id: string): void {
  // no-op
}
