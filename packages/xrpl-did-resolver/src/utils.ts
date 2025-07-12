import { convertHexToString } from 'xrpl'

export enum Errors {
  /**
   * The resolver has failed to construct the DID document.
   * This can be caused by a network issue, a wrong registry address or malformed logs while parsing the registry
   * history. Please inspect the `DIDResolutionMetadata.message` to debug further.
   */
  notFound = 'notFound',

  /**
   * The resolver does not know how to resolve the given DID. Most likely it is not a `did:ethr`.
   */
  invalidDid = 'invalidDid',

  /**
   * The resolver is misconfigured or is being asked to resolve a `DID` anchored on an unknown network
   */
  unknownNetwork = 'unknownNetwork',

  /**
   * The resolver does not support the 'accept' format requested with `DIDResolutionOptions`
   */
  unsupportedFormat = 'unsupportedFormat',

  /**
   * A network or IPFS/HTTP(S) fetch error occurred.
   */
  fetchError = 'fetchError',

  /**
   * The DIDDocument JSON is invalid or cannot be parsed.
   */
  invalidJson = 'invalidJson',

  /**
   * The URI scheme in the DID object is not supported (example: not ipfs:// or http(s)://).
   */
  unsupportedScheme = 'unsupportedScheme',
}

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

async function fetchJson(url: string): Promise<any> {
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    throw new Error(Errors.fetchError)
  }
  let doc: unknown
  try {
    doc = await res.json()
  } catch {
    throw new Error(Errors.invalidJson)
  }
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    throw new Error(Errors.invalidJson)
  }
  return doc
}

export async function fetchJsonFromUri(hexUri: string): Promise<any> {
  const uri = convertHexToString(hexUri)
  const { scheme, data } = parseUri(uri)
  let url: string

  switch (scheme.toLowerCase()) {
    case 'ipfs':
      url = `https://gateway.pinata.cloud/ipfs/${data}`
      break;
    case 'http':
    case 'https':
      url = `${scheme}://${data}`
      break
    default:
      throw new Error(Errors.unsupportedScheme)
  }
  return fetchJson(url)
}
