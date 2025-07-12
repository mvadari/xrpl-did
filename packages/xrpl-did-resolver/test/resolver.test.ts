import { Resolver, DIDDocument, Resolvable } from 'did-resolver'
import { getResolver } from '../src/resolver'
import { Client, DIDSet, Wallet, convertStringToHex } from 'xrpl'
import { fetchJsonFromUri, Errors } from '../src/utils'

const client = new Client('wss://s.devnet.rippletest.net:51233')

async function setDID(wallet: Wallet, document: DIDDocument): Promise<void> {
  const jsonDocument = JSON.stringify(document)
  const tx: DIDSet = {
    TransactionType: 'DIDSet',
    Account: wallet.address,
    DIDDocument: convertStringToHex(jsonDocument),
  }
  await client.submitAndWait(tx, { autofill: true, wallet })
}

describe('xrpl did resolver', () => {
  jest.setTimeout(20000)

  let wallet: Wallet
  let did: string
  // const validResponse: DIDDocument = {
  //   '@context': 'https://www.w3.org/ns/did/v1',
  //   id: did,
  //   publicKey: [
  //     {
  //       id: `${did}#owner`,
  //       type: 'EcdsaSecp256k1RecoveryMethod2020',
  //       controller: did,
  //       ethereumAddress: identity,
  //     },
  //   ],
  //   authentication: [`${did}#owner`],
  // }
  let validResponse: DIDDocument

  let didResolver: Resolvable

  beforeAll(async () => {
    didResolver = new Resolver(getResolver())
    await client.connect()
  })

  afterAll(async () => {
    await client.disconnect()
  })

  beforeEach(async () => {
    wallet = (await client.fundWallet()).wallet
    did = `did:xrpl:${wallet.address}`
    validResponse = {
      '@context': 'https://www.w3.org/ns/did/v1',
      id: did,
    }
  })

  it('resolves document', async () => {
    expect.assertions(2)
    await setDID(wallet, validResponse)
    const result = await didResolver.resolve(did)
    expect(result.didDocument).toEqual(validResponse)
    expect(result.didResolutionMetadata.contentType).toEqual('application/did+ld+json')
  })

  it('fails if the did is not a valid account', async () => {
    expect.assertions(1)
    const result = await didResolver.resolve(did)
    expect(result.didResolutionMetadata.error).toEqual('notFound')
  })

  it('fails if the did document is not valid json', async () => {
    expect.assertions(2)
    // @ts-expect-error -- string instead of valid object to test that error
    await setDID(wallet, 'document')
    const result = await didResolver.resolve(did)
    expect(result.didResolutionMetadata.error).toEqual('unsupportedFormat')
    expect(result.didResolutionMetadata.message).toMatch(
      /DID does not resolve to a valid document containing a JSON document/
    )
  })

  it('fails if the did document id does not match', async () => {
    expect.assertions(2)
    const wrongIdResponse = {
      ...validResponse,
      id: `did:xrpl:${Wallet.generate().address}`,
    }
    await setDID(wallet, wrongIdResponse)
    const result = await didResolver.resolve(did)
    expect(result.didResolutionMetadata.error).toEqual('notFound')
    expect(result.didResolutionMetadata.message).toMatch(/DID document id does not match requested DID/)
  })

  it('returns correct contentType without @context', async () => {
    expect.assertions(1)
    const noContextResponse = {
      ...validResponse,
    }
    delete noContextResponse['@context']
    await setDID(wallet, noContextResponse)
    const result = await didResolver.resolve(did)
    expect(result.didResolutionMetadata.contentType).toEqual('application/did+json')
  })

  it('resolves a valid HTTPS URI with correct JSON', async () => {
    const url = 'https://example.com/did.json'
    const hexUri = convertStringToHex(url)

    global.fetch = jest.fn().mockResolvedValueOnce({
      json: async () => ({
        id: 'did:xrpl:test123',
        '@context': 'https://www.w3.org/ns/did/v1',
      }),
    }) as any

    const result = await fetchJsonFromUri(hexUri)
    expect(result).toHaveProperty('id', 'did:xrpl:test123')
  })

  it('throws if the URI has unsupported scheme', async () => {
    const hexUri = convertStringToHex('ftp://example.com/invalid')

    await expect(fetchJsonFromUri(hexUri)).rejects.toThrow(Errors.unsupportedScheme)
  })

  it('throws if fetched content is not conform to the W3C spec (not a JSON object)', async () => {
    const url = 'https://example.com/invalid'
    const hexUri = convertStringToHex(url)

    global.fetch = jest.fn().mockResolvedValueOnce({
      json: async () => [1, 2, 3],
    }) as any

    await expect(fetchJsonFromUri(hexUri)).rejects.toThrow(Errors.invalidJson)
  })

  it('throws on fetch error', async () => {
    const url = 'https://example.com/fail'
    const hexUri = convertStringToHex(url)

    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(fetchJsonFromUri(hexUri)).rejects.toThrow(Errors.fetchError)
  })
})
