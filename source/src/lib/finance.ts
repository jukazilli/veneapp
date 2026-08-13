type CommissionRow = {
  commission_amount: number | string | null
  status?: string
}

type PaymentRow = {
  amount: number | string | null
}

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
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
