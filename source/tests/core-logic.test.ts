import test from 'node:test'
import assert from 'node:assert/strict'

import { createHumanChallenge, verifyHumanChallenge } from '../src/lib/human-challenge.ts'
import {
  dayBounds,
  nextQuarterHourString,
  periodBounds,
  shiftLocalDate,
  zonedLocalToIso,
} from '../src/lib/dates.ts'
import { money, whatsappUrl } from '../src/lib/format.ts'
import { outstandingCommissionBalance } from '../src/lib/finance.ts'

process.env.ANTI_SPAM_SECRET = 'veneapp-test-secret-with-more-than-24-characters'

function matchingPair(items: string[]) {
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (items[i] === items[j]) return `${i},${j}`
    }
  }
  throw new Error('Nenhum par duplicado encontrado')
}

test('anti-spam aceita apenas o par visual duplicado', () => {
  const realNow = Date.now
  let clock = 1_800_000_000_000
  Date.now = () => clock
  try {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const challenge = createHumanChallenge()
      assert.equal(challenge.items.length, 6)
      clock += 1_000

      const pair = matchingPair(challenge.items)
      assert.equal(verifyHumanChallenge(challenge.token, pair), true)

      const [correctA, correctB] = pair.split(',').map(Number)
      const wrong = [0, 1, 2, 3, 4, 5]
        .filter(index => index !== correctA && index !== correctB)
        .slice(0, 2)
        .join(',')
      assert.equal(verifyHumanChallenge(challenge.token, wrong), false)
      clock += 1_000
    }
  } finally {
    Date.now = realNow
  }
})

test('anti-spam rejeita envio rápido demais, token adulterado e seleção inválida', () => {
  const realNow = Date.now
  let clock = 1_800_000_000_000
  Date.now = () => clock
  try {
    const challenge = createHumanChallenge()
    const pair = matchingPair(challenge.items)
    assert.equal(verifyHumanChallenge(challenge.token, pair), false)
    clock += 1_000
    assert.equal(verifyHumanChallenge(`${challenge.token}x`, pair), false)
    assert.equal(verifyHumanChallenge(challenge.token, '0,0'), false)
    assert.equal(verifyHumanChallenge(challenge.token, '0,9'), false)
  } finally {
    Date.now = realNow
  }
})

test('converte horário local de São Paulo para UTC corretamente', () => {
  assert.equal(zonedLocalToIso('2026-08-12', '22:00'), '2026-08-13T01:00:00.000Z')
})

test('calcula limites do dia em São Paulo', () => {
  assert.deepEqual(dayBounds('2026-08-12'), {
    start: '2026-08-12T03:00:00.000Z',
    end: '2026-08-13T03:00:00.000Z',
  })
})

test('calcula semana de segunda a segunda', () => {
  const bounds = periodBounds('week', new Date('2026-08-12T15:00:00.000Z'))
  assert.equal(bounds.startLocal, '2026-08-10')
  assert.equal(bounds.endLocal, '2026-08-17')
})

test('navegação de datas e próximo quarto de hora funcionam', () => {
  assert.equal(shiftLocalDate('2026-08-31', 1), '2026-09-01')
  assert.deepEqual(nextQuarterHourString(new Date('2026-08-13T01:07:00.000Z')), {
    date: '2026-08-12',
    time: '22:15',
  })
})

test('formatação monetária e link de WhatsApp', () => {
  assert.match(money(1234.5), /1\.234,50/)
  assert.equal(whatsappUrl('(47) 99999-1234'), 'https://wa.me/5547999991234')
  assert.equal(whatsappUrl('+55 47 99999-1234'), 'https://wa.me/5547999991234')
  assert.equal(whatsappUrl(''), null)
})


test('saldo de comissão é acumulado e preserva dívida de períodos anteriores', () => {
  const commissions = [
    { status: 'completed', commission_amount: 50 },
    { status: 'completed', commission_amount: '30.50' },
    { status: 'cancelled', commission_amount: 100 },
  ]
  const payments = [{ amount: 20 }, { amount: '10.50' }]
  assert.equal(outstandingCommissionBalance(commissions, payments), 50)
})
