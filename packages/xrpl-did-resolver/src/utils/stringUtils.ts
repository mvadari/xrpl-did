import { Errors } from './errors'
import { convertHexToString } from 'xrpl'

export function parseHexJson(hex: string): any {
  try {
    return JSON.parse(convertHexToString(hex))
  } catch {
    throw new Error(Errors.invalidJson)
  }
}

export function parseUri(uri: string): { scheme: string; data: string } {
  let parsed: URL
  try {
    parsed = new URL(uri)
  } catch {
    throw new Error(Errors.invalidDid)
  }

  const scheme = parsed.protocol.replace(/:$/, '')
  if (scheme === 'ipfs') {
    const cid = parsed.host + parsed.pathname
    if (!cid) {
      throw new Error(Errors.invalidDid)
    }
    return { scheme, data: cid }
  }

  return { scheme, data: parsed.href }
}
