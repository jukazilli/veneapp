import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const OBJECTS = ['●', '◆', '★', '▲', '■', '♥', '✦', '⬟'] as const
const CHALLENGE_TTL_MS = 10 * 60 * 1000
const MIN_SOLVE_MS = 700

type TokenPayload = {
  nonce: string
  issuedAt: number
  expiresAt: number
  answer: string
}

export type HumanChallenge = {
  items: string[]
  token: string
}

function getSecret() {
  const secret = process.env.ANTI_SPAM_SECRET
  if (secret && secret.length >= 24) return secret

  // Vercel previews can derive an ephemeral server-only key. The connected
  // deploy tool currently labels isolated preview projects as production, so
  // we also allow this fallback only for disposable projects prefixed with
  // `veneapp-preview-`. The official `veneapp` production project still
  // requires ANTI_SPAM_SECRET explicitly.
  const previewProject = process.env.VERCEL_PROJECT_PRODUCTION_URL?.startsWith('veneapp-preview-')
  if ((process.env.VERCEL_ENV === 'preview' || previewProject) && process.env.VERCEL_PROJECT_ID) {
    return `veneapp-preview:${process.env.VERCEL_PROJECT_ID}:human-check`
  }

  throw new Error('ANTI_SPAM_SECRET precisa ter pelo menos 24 caracteres.')
}

function hmac(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url')
}

function randomInt(max: number) {
  return randomBytes(4).readUInt32BE(0) % max
}

function shuffle<T>(input: T[]) {
  const result = [...input]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function createHumanChallenge(): HumanChallenge {
  const duplicate = OBJECTS[randomInt(OBJECTS.length)]
  const uniquePool = shuffle(OBJECTS.filter(item => item !== duplicate)).slice(0, 4)
  const items = shuffle([duplicate, duplicate, ...uniquePool])
  const pair = items
    .map((item, index) => ({ item, index }))
    .filter(entry => entry.item === duplicate)
    .map(entry => entry.index)
    .sort((a, b) => a - b)
    .join(',')

  const nonce = randomBytes(18).toString('base64url')
  const issuedAt = Date.now()
  const expiresAt = issuedAt + CHALLENGE_TTL_MS
  const answer = hmac(`${nonce}:${expiresAt}:${pair}`)
  const payload: TokenPayload = { nonce, issuedAt, expiresAt, answer }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = hmac(encoded)

  return { items, token: `${encoded}.${signature}` }
}

export function verifyHumanChallenge(token: string, selection: string) {
  try {
    const [encoded, signature] = token.split('.')
    if (!encoded || !signature) return false

    const expectedSignature = hmac(encoded)
    const a = Buffer.from(signature)
    const b = Buffer.from(expectedSignature)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload
    const now = Date.now()
    if (!payload.nonce || !payload.issuedAt || !payload.expiresAt || !payload.answer) return false
    if (now > payload.expiresAt || now - payload.issuedAt < MIN_SOLVE_MS || payload.issuedAt > now + 5_000) return false

    const pair = selection
      .split(',')
      .map(value => Number(value))
      .filter(value => Number.isInteger(value) && value >= 0 && value <= 5)
      .sort((x, y) => x - y)

    if (pair.length !== 2 || pair[0] === pair[1]) return false

    const candidate = hmac(`${payload.nonce}:${payload.expiresAt}:${pair.join(',')}`)
    const candidateBuffer = Buffer.from(candidate)
    const answerBuffer = Buffer.from(payload.answer)
    return candidateBuffer.length === answerBuffer.length && timingSafeEqual(candidateBuffer, answerBuffer)
  } catch {
    return false
  }
}
