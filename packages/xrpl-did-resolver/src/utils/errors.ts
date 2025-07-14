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
