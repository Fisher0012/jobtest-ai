// Free link storage for report access (shared across API routes)
// Token-based free access with 7-day expiration

export type FreeLinkData = {
  url: string
  expiresAt: number
}

const FREE_LINKS = new Map<string, FreeLinkData>()

export function createFreeLink(url: string, expiresInMs: number = 7 * 24 * 60 * 60 * 1000): string {
  const token = crypto.randomUUID()
  const expiresAt = Date.now() + expiresInMs
  FREE_LINKS.set(token, { url, expiresAt })
  return token
}

export function validateFreeLink(token: string): { valid: boolean; url?: string; expiresIn?: number } {
  const linkData = FREE_LINKS.get(token)
  if (!linkData) {
    return { valid: false }
  }

  const now = Date.now()
  if (now > linkData.expiresAt) {
    FREE_LINKS.delete(token)
    return { valid: false }
  }

  const expiresIn = Math.floor((linkData.expiresAt - now) / (1000 * 60)) // minutes
  return { valid: true, url: linkData.url, expiresIn }
}

export function deleteFreeLink(token: string): boolean {
  return FREE_LINKS.delete(token)
}
