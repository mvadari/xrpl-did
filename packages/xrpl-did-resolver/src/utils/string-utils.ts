import { Errors } from './errors'
import { convertHexToString } from 'xrpl'

export function parseUri(uri: string): { scheme: string; data: string } {
  const m = uri.match(/^([a-z0-9]+):\/\/(.+)$/i)
  if (!m) {
    throw new Error(Errors.invalidDid)
  }
  return { scheme: m[1], data: m[2] }
}

export function parseHexJson(hex: string): any {
  try {
    return JSON.parse(convertHexToString(hex))
  } catch {
    throw new Error(Errors.invalidJson)
  }
}