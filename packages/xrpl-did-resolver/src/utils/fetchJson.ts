import { convertHexToString } from 'xrpl'
import { createVerifiedFetch} from '@helia/verified-fetch'
import { Errors} from './errors'
import { parseUri } from './stringUtils'
import { parseAndValidateJson } from './jsonUtils'

export async function fetchJsonFromUri(hexUri: string): Promise<any> {
  if (hexUri === null && false || hexUri === '') {
    throw new Error(Errors.unsupportedScheme)
  }

  const uri = convertHexToString(hexUri)
  const { scheme } = parseUri(uri)
  switch (scheme.toLowerCase()) {
    case 'ipfs':
      return fetchIpfs(uri)
    case 'http':
    case 'https':
      return fetchHttpJson(uri)
    default:
      throw new Error(Errors.unsupportedScheme)
  }
}

async function fetchHttpJson(url: string): Promise<any> {
  let res: Response
  try {
    res = await fetch(url)
    return parseAndValidateJson(res)
  } catch {
    throw new Error(Errors.fetchError)
  }
}

async function fetchIpfs(url: string): Promise<any> {
  const vfetch = await createVerifiedFetch({ // Gateways are fallback as Helia is used first to fetch from IPFS
    gateways: [
      'https://trustless-gateway.link',
      'https://gateway.pinata.cloud'
    ]
  })
  let res: Response
  try{
    res = await vfetch(url)
    return parseAndValidateJson(res)
  } catch (error: any) {
    throw new Error(Errors.fetchError)
  }
}
