import crypto from "crypto"

const ALGO = "aes-256-gcm"
const IV_BYTES = 12

function deriveKey(secret: string): Buffer {
  if (!secret || secret.length < 8) {
    throw new Error(
      "SuperFrete crypto: missing or too short secret (expected COOKIE_SECRET)"
    )
  }
  return crypto.createHash("sha256").update(secret).digest()
}

export type EncryptedBlob = {
  cipher: string
  iv: string
  tag: string
}

export function encryptSecret(plaintext: string, secret: string): EncryptedBlob {
  const iv = crypto.randomBytes(IV_BYTES)
  const key = deriveKey(secret)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    cipher: enc.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  }
}

export function decryptSecret(blob: EncryptedBlob, secret: string): string {
  const key = deriveKey(secret)
  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(blob.iv, "base64")
  )
  decipher.setAuthTag(Buffer.from(blob.tag, "base64"))
  const dec = Buffer.concat([
    decipher.update(Buffer.from(blob.cipher, "base64")),
    decipher.final(),
  ])
  return dec.toString("utf8")
}

export function maskToken(token: string | null | undefined): string {
  if (!token) return ""
  if (token.length <= 12) return "****"
  return `${token.slice(0, 6)}…${token.slice(-4)}`
}

export function verifyHmac(
  payloadRaw: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature || !secret) return false
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payloadRaw)
    .digest("hex")
  const sig = signature.replace(/^sha256=/, "")
  const a = Buffer.from(expected, "hex")
  const b = Buffer.from(sig, "hex")
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
