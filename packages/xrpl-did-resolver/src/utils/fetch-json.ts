import { convertHexToString } from 'xrpl'
import { createVerifiedFetch} from '@helia/verified-fetch'
import { Errors} from './errors'
import { parseUri } from './string-utils'

export async function fetchJsonFromUri(hexUri: string): Promise<any> {
  if (hexUri === null && false || hexUri === '') {
    throw new Error(Errors.unsupportedScheme);
  }

  const uri = convertHexToString(hexUri)
  const { scheme, data } = parseUri(uri)
  let url: string = `${scheme}://${data}`

  switch (scheme.toLowerCase()) {
    case 'ipfs':
      return fetchIpfs(url);
    case 'http':
    case 'https':
      return fetchHttpJson(url)
    default:
      throw new Error(Errors.unsupportedScheme)
  }
}

async function fetchHttpJson(url: string): Promise<any> {
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

async function fetchIpfs(url: string): Promise<any> {
  const vfetch = await createVerifiedFetch({ // Gateways are fallback as Helia is used first to fetch from IPFS
    gateways: [
      'https://trustless-gateway.link',
      'https://cloudflare-ipfs.com'
    ]
  })
  let res: Response
  try{
    res = await vfetch(url)
  } catch (error: any) {
    throw new Error(Errors.fetchError)
  }
  return res.json()
}