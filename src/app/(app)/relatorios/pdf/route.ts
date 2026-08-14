import PDFDocument from 'pdfkit'
import { money } from '@/lib/format'
import { loadReportData, reportBaseDate, type ReportPeriod } from '@/lib/report-data'

export const runtime = 'nodejs'

function safeMoney(value: number) {
  return money(value).replace(/\u00a0/g, ' ')
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const rawPeriod = url.searchParams.get('period')
  const period: ReportPeriod = rawPeriod === 'day' || rawPeriod === 'month' ? rawPeriod : 'week'
  const report = await loadReportData(period, reportBaseDate(url.searchParams.get('date') || undefined))

  const document = new PDFDocument({ size: 'A4', margin: 52, info: { Title: 'Relatório Veneapp' } })
  const chunks: Buffer[] = []
  const pdf = new Promise<Buffer>((resolve, reject) => {
    document.on('data', (chunk: Buffer) => chunks.push(chunk))
    document.on('end', () => resolve(Buffer.concat(chunks)))
    document.on('error', reject)
  })

  document.font('Helvetica-Bold').fontSize(22).fillColor('#0b0b0f').text('Veneapp')
  document.font('Helvetica').fontSize(11).fillColor('#746772').text(`${report.scope} · ${report.startLocal.split('-').reverse().join('/')} a ${report.finalDay.split('-').reverse().join('/')}`)
  document.moveDown(1.5)

  const rows: Array<[string, string]> = [
    ['Faturamento bruto', safeMoney(report.grossRevenue)],
    ['Líquido do atendente', safeMoney(report.attendantNet)],
    ['Comissão a pagar', safeMoney(report.commission)],
    ['Comissão paga', safeMoney(report.commissionPaid)],
    ['Saldo de comissão acumulado', safeMoney(report.commissionBalance)],
    ['Atendimentos concluídos', String(report.completed)],
    ['Cancelamentos', String(report.cancellations)],
    ['Não compareceu', String(report.noShows)],
  ]

  for (const [label, value] of rows) {
    const y = document.y
    document.font('Helvetica').fontSize(11).fillColor('#746772').text(label, 52, y, { width: 330 })
    document.font('Helvetica-Bold').fillColor('#0b0b0f').text(value, 390, y, { width: 150, align: 'right' })
    document.moveDown(0.8)
    document.moveTo(52, document.y).lineTo(543, document.y).strokeColor('#f0d9e4').stroke()
    document.moveDown(0.8)
  }

  document.moveDown(1)
  document.font('Helvetica').fontSize(9).fillColor('#746772').text(`Gerado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date())}`)
  document.end()

  const buffer = await pdf
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="veneapp-relatorio-${period}-${report.selectedDate}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
