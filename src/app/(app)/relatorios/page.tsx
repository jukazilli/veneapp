import Link from 'next/link'
import { money } from '@/lib/format'
import { loadReportData, reportBaseDate, type ReportPeriod } from '@/lib/report-data'

function reportPeriod(value?: string): ReportPeriod {
  return value === 'day' || value === 'month' ? value : 'week'
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string; date?: string }> }) {
  const params = await searchParams
  const period = reportPeriod(params.period)
  const report = await loadReportData(period, reportBaseDate(params.date))
  const queryDate = encodeURIComponent(report.selectedDate)
  const rangeLabel = report.startLocal === report.finalDay
    ? report.startLocal.split('-').reverse().join('/')
    : `${report.startLocal.split('-').reverse().join('/')} até ${report.finalDay.split('-').reverse().join('/')}`

  return <main className="stack">
    <div className="header">
      <div><div className="eyebrow">{report.scope}</div><h1>Relatórios</h1><p className="muted">{rangeLabel}</p></div>
      <Link className="button button-secondary" href={`/relatorios/pdf?period=${period}&date=${queryDate}`}>Exportar PDF</Link>
    </div>
    <div className="segmented segmented-3">
      <Link href={`/relatorios?period=day&date=${queryDate}`} className={period === 'day' ? 'active' : ''}>Dia</Link>
      <Link href={`/relatorios?period=week&date=${queryDate}`} className={period === 'week' ? 'active' : ''}>Semana</Link>
      <Link href={`/relatorios?period=month&date=${queryDate}`} className={period === 'month' ? 'active' : ''}>Mês</Link>
    </div>
    <form className="report-filter card" method="get">
      <input type="hidden" name="period" value={period} />
      <div className="field"><label>Data de referência</label><input className="input" type="date" name="date" defaultValue={report.selectedDate} /></div>
      <button className="button button-primary" type="submit">Aplicar filtro</button>
    </form>
    <div className="kpis">
      <div className="kpi"><div className="kpi-label">Faturamento</div><div className="kpi-value">{money(report.revenue)}</div></div>
      <div className="kpi"><div className="kpi-label">Comissões</div><div className="kpi-value">{money(report.commission)}</div></div>
      <div className="kpi"><div className="kpi-label">Pagamentos</div><div className="kpi-value">{money(report.paid)}</div></div>
      <div className="kpi"><div className="kpi-label">{report.balanceLabel} acumulado</div><div className="kpi-value">{money(report.outstanding)}</div></div>
    </div>
    <div className="card stack">
      <div className="row-between"><span>Atendimentos concluídos</span><strong>{report.completed}</strong></div><div className="divider" />
      <div className="row-between"><span>Cancelamentos</span><strong>{report.cancellations}</strong></div><div className="divider" />
      <div className="row-between"><span>Não compareceu</span><strong>{report.noShows}</strong></div><div className="divider" />
      <div className="row-between"><span>Movimento líquido do período</span><strong>{money(report.netMovement)}</strong></div>
    </div>
  </main>
}
