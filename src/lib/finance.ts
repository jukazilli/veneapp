type CommissionRow = {
  commission_amount: number | string | null
  price?: number | string | null
  net_amount?: number | string | null
  status?: string
}

type PaymentRow = {
  amount: number | string | null
}

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function commissionAmountFor(priceValue: number, mode: 'fixed' | 'percentage', configuredValue: number) {
  const price = numeric(priceValue)
  const commissionValue = numeric(configuredValue)
  const amount = mode === 'percentage' ? price * commissionValue / 100 : commissionValue
  return Math.round(amount * 100) / 100
}

export function completedCommissionTotal(rows: CommissionRow[]) {
  return rows.reduce((sum, row) => {
    if (row.status && row.status !== 'completed') return sum
    return sum + numeric(row.commission_amount)
  }, 0)
}

export function paymentTotal(rows: PaymentRow[]) {
  return rows.reduce((sum, row) => sum + numeric(row.amount), 0)
}

export function outstandingCommissionBalance(commissions: CommissionRow[], payments: PaymentRow[]) {
  return completedCommissionTotal(commissions) - paymentTotal(payments)
}

export function completedFinancialTotals(rows: CommissionRow[]) {
  return rows.reduce((totals, row) => {
    if (row.status && row.status !== 'completed') return totals

    const grossRevenue = numeric(row.price)
    const commission = numeric(row.commission_amount)
    const attendantNet = row.net_amount === null || row.net_amount === undefined
      ? grossRevenue - commission
      : numeric(row.net_amount)

    return {
      grossRevenue: totals.grossRevenue + grossRevenue,
      commission: totals.commission + commission,
      attendantNet: totals.attendantNet + attendantNet,
    }
  }, { grossRevenue: 0, commission: 0, attendantNet: 0 })
}
