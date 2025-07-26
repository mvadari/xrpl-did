import { DIDDocument, DIDResolutionResult, DIDResolver, ParsedDID } from 'did-resolver'
import { Client, LedgerEntry, LedgerEntryResponse } from 'xrpl'
import { fetchJsonFromUri } from './utils/fetchJson'
import { parseHexJson } from './utils/stringUtils'
import { Errors } from './utils/errors'

const XRPL_NODE = 'wss://s.devnet.rippletest.net:51233'

async function getDIDObject(address: string): Promise<LedgerEntry.DID> {
  const client = new Client(XRPL_NODE)
  await client.connect()
  let result: LedgerEntryResponse
  try {
    result = await client.request({
      command: 'ledger_entry',
      did: address,
    })
  } catch (e: any) {
    if (e.message === 'entryNotFound') {
      throw new Error(Errors.notFound)
    }
    console.log(e.message)
    throw e
  } finally {
    await client.disconnect()
  }

  return result.result.node as unknown as LedgerEntry.DID
}

async function getDID(address: string): Promise<any> {
  const object = await getDIDObject(address)
  if (object.LedgerEntryType !== 'DID') {
    throw new Error('WTFFFFF')
  }
  if (object.DIDDocument != null) {
    return parseHexJson(object.DIDDocument)
  }
  if (object.URI != null) {
    return fetchJsonFromUri(object.URI)
  }

  return null
}

async function processDID(
  did: string,
  address: string
): Promise<{ result?: any; error?: { error: string; message: string } }> {
  let result: any
  try {
    result = await getDID(address)
    if (typeof result !== 'object') {
      return {
        error: {
          error: Errors.unsupportedFormat,
          message: 'DID does not resolve to a valid document containing a JSON document',
        },
      }
    }
    const docIdMatchesDid = result?.id === did
    if (!docIdMatchesDid) {
      return {
        error: {
          error: Errors.notFound,
          message: 'resolver_error: DID document id does not match requested DID',
        },
      }
    }
  } catch (error: any) {
    if (error.message === Errors.notFound) {
      return { error: { error: 'notFound', message: 'notFound' } }
    } else {
      console.log(error.message)
      return {
        error: {
          error: Errors.unsupportedFormat,
          message: `resolver_error: DID must resolve to a valid document containing a JSON document: ${error}`,
        },
      }
    }
  }
  return { result }
}

export function getResolver(): Record<string, DIDResolver> {
  async function resolve(did: string, parsed: ParsedDID): Promise<DIDResolutionResult> {
    const address = parsed.id

    const didDocumentMetadata = {}
    const result = await processDID(did, address)
    if (result.error) {
      return {
        didDocument: null,
        didDocumentMetadata,
        didResolutionMetadata: result.error,
      }
    }
    const didDocument: DIDDocument | null = result.result

    const contentType =
      typeof didDocument?.['@context'] !== 'undefined' ? 'application/did+ld+json' : 'application/did+json'

    return {
      didDocument,
      didDocumentMetadata,
      didResolutionMetadata: { contentType },
    }
  }

  return { xrpl: resolve }
}
