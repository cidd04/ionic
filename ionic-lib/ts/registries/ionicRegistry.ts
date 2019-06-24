import { IdentityWallet } from '../identityWallet/identityWallet'
import { DidDocument } from '../identity/didDocument/didDocument'
import { IDidDocumentAttrs } from '../identity/didDocument/types'
import { SignedCredential } from '../credentials/signedCredential/signedCredential'
import { Identity } from '../identity/identity'
import {
  IRegistryCommitArgs,
  IRegistryStaticCreationArgs,
  IRegistry,
} from './types'
import { publicKeyToDID, sha256 } from '../utils/crypto'
import {
  IVaultedKeyProvider,
  IKeyDerivationArgs,
} from '../vaultedKeyProvider/types'
import { KeyTypes } from '../vaultedKeyProvider/types'
import {ISidetreeConnector} from "../sidetree/types";
import {ionicSidetreeAgent} from "../sidetree/sidetreeConnector";
import base64url from 'base64url';
import { sign as eccSign } from 'tiny-secp256k1'

/**
 * @class
 * Ionic specific Registry. Uses Sidetree for anchoring indentities and the resolution mechanism.
 */

export class IonicRegistry implements IRegistry {
  public sidetreeConnector: ISidetreeConnector

  /**
   * Registers a  new Ionic identity on Ion Network and returns an instance of the Identity Wallet class
   * @param vaultedKeyProvider - Instance of Vaulted Provider class storing password encrypted seed.
   * @param decryptionPassword - password used to decrypt seed in vault for key generation
   * @example `const identityWallet = await registry.create(vaultedProvider, 'password')`
   */

  public async create(
    vaultedKeyProvider: IVaultedKeyProvider,
    decryptionPassword: string,
  ): Promise<IdentityWallet> {
    const { ionicIdentityKey, ethereumKey } = KeyTypes

    const derivationArgs = {
      derivationPath: ionicIdentityKey,
      encryptionPass: decryptionPassword,
    }

    const publicIdentityKey = vaultedKeyProvider.getPublicKey(derivationArgs)

    const didDocument = await DidDocument.fromPublicKey(publicIdentityKey)
    //const didDocumentSignature = await vaultedKeyProvider.signDigestable(derivationArgs, didDocument)

    const privateIdentityKey = vaultedKeyProvider.getPrivateKey(derivationArgs)
    const encodedPayload = base64url.encode(JSON.stringify(didDocument.toJSON()));
    const jwsSigningInput = '.' + encodedPayload;
    const hash = sha256(Buffer.from(jwsSigningInput))

    const didDocumentSignature = eccSign(hash, privateIdentityKey)

    //didDocument.signature = didDocumentSignature.toString('hex')
    const identity = Identity.fromDidDocument({ didDocument })

    let identityWallet = new IdentityWallet({
      identity,
      vaultedKeyProvider,
      publicKeyMetadata: {
        derivationPath: ionicIdentityKey,
        keyId: didDocument.publicKey[0].id,
      },
    })
    identityWallet.newDid = publicKeyToDID(publicIdentityKey)

    await this.commit({
      identityWallet,
      vaultedKeyProvider,
      keyMetadata: {
        encryptionPass: decryptionPassword,
        derivationPath: ethereumKey,
      },
      didDocumentSignature
    })



    return identityWallet
  }

  /**
   * Stores the passed didDocument / public profile on IPFS and updates the mapping in the smart contract.
   * @param commitArgs - Data to be committed and vault to get private keys
   * @param commitArgs.vaultedKeyProvider - Vaulted key store
   * @param commitArgs.keyMetadata - Derivation path and decryption pass
   * @param commitArgs.identityWallet - Wallet containing did document and public profile
   * @deprecated Will be modified in next major release to not require access to the vault
   * @example `await registry.commit({ vaultedKeyProvider, keyMetadata, identityWallet })`
   */

  public async commit(commitArgs: IRegistryCommitArgs) {
    const { identityWallet, keyMetadata, vaultedKeyProvider, didDocumentSignature } = commitArgs

    const didDocument = identityWallet.didDocument
    const publicProfile = identityWallet.identity.publicProfile

    const remote = undefined
    const remotePubProf = remote && remote.publicProfile

    try {
      if (publicProfile) {
        // const publicProfileHash = await this.ipfsConnector.storeJSON({
        //   data: publicProfile.toJSON(),
        //   pin: true,
        // })
        // const publicProfileSection = generatePublicProfileServiceSection(
        //   didDocument.did,
        //   publicProfileHash,
        // )
        // didDocument.addServiceEndpoint(publicProfileSection)
      }

      if (remotePubProf && !publicProfile) {
        didDocument.resetServiceEndpoints()
      }

      const operation = {
          header: {
              operation: 'create',
              alg: 'ES256K',
              kid: didDocument.publicKey[0].id,
              proofOfWork: {}
          },
          payload: base64url.encode(JSON.stringify(didDocument.toJSON())),
          signature: base64url.encode(didDocumentSignature)
      }
      await this.sidetreeConnector.createDIDRecord(operation)
    } catch (error) {
      throw new Error(
        `Error occured while persisting identity data: ${error.message}`,
      )
    }
  }

  /**
   * Resolves a ionic did and returns an {@link Identity} class instance
   * @param did - The ionic did to resolve
   * @example `const serviceIdentity = await registry.resolve('did:jolo:...')`
   */

  public async resolve(did): Promise<Identity> {
    try {
      const didObj = await this.sidetreeConnector.resolveDID(did) as IDidDocumentAttrs

      if (!didObj) {
          throw new Error('No record for DID found.')
      }

      const didDocument = DidDocument.fromJSON(didObj)

      const publicProfileSection = didDocument.service.find(
        endpoint => endpoint.type === 'IonicPublicProfile',
      )

      const publicProfile =
        publicProfileSection &&
        (await this.fetchPublicProfile(publicProfileSection.serviceEndpoint))

      return Identity.fromDidDocument({
        didDocument,
        publicProfile,
      })
    } catch (error) {
      throw new Error(`Could not retrieve DID Document. ${error.message}`)
    }
  }

  /**
   * Derives the identity public key, fetches the public
   *   profile and did document, and instantiates an identity wallet
   *   with the vault, decryption pass, and and key metadata
   * @param vaultedKeyProvider - Vaulted key store
   * @param derivationArgs - password for the vault and derivation path
   * @example `const wallet = registry.authenticate(vault, { derivationPath: '...', encryptionPass: '...'})`
   */

  public async authenticate(
    vaultedKeyProvider: IVaultedKeyProvider,
    derivationArgs: IKeyDerivationArgs,
  ): Promise<IdentityWallet> {
    const publicIdentityKey = vaultedKeyProvider.getPublicKey(derivationArgs)
    const did = publicKeyToDID(publicIdentityKey)
    //const did = derivationArgs.id
    const identity = await this.resolve(did)

    const publicKeyMetadata = {
      derivationPath: derivationArgs.derivationPath,
      keyId: did + identity.publicKeySection[0].id,
    }

    return new IdentityWallet({
      vaultedKeyProvider,
      identity,
      publicKeyMetadata,
    })
  }

  /**
   * Fetches the public profile signed credential form ipfs
   * @param entry - IPFS hash of public profile credential
   * @example `const pubProf = await registry.fetchPublicProfile('ipfs://Qm...')`
   * @internal
   */

  public async fetchPublicProfile(entry: string): Promise<SignedCredential> {
    // const hash = entry.replace('ipfs://', '')
    // const publicProfile = (await this.ipfsConnector.catJSON(
    //   hash,
    // )) as ISignedCredentialAttrs
    //
    // return SignedCredential.fromJSON(publicProfile)
    return undefined
  }

  /**
   * Proxies to this.resolve, but catches error and returns undefined
   * @param did - The ionic did to resolve
   * @example `const serviceIdentity = await registry.resolveSafe('did:jolo:...')`
   * @internal
   */

  public async resolveSafe(did: string): Promise<Identity> {
    try {
      return await this.resolve(did)
    } catch {
      return
    }
  }
}

/**
 * Returns a instance of the Ionic registry given connector, defaults to Ionic defined connectors.
 * @param configuration - Connectors required for smart contract, storage, and anchoring interactions
 * @param configuration.ipfsConnector - Instance of class implementing the {@link IIpfsConnector} interface
 * @param configuration.ethereumConnector - Instance of class implementing the {@link IEthereumConnector} interface
 * @param configuration.contracts - Classes for interacting with Smart ContractsAdapter, implementing {@link IContractsGateway} and {@link IContractsAdapter}
 * @example `const registry = createIonicRegistry()`
 */

export const createIonicRegistry = (
  configuration: IRegistryStaticCreationArgs = {
    sidetreeConnector: ionicSidetreeAgent
  },
): IonicRegistry => {
  const { sidetreeConnector } = configuration
  const ionicRegistry = new IonicRegistry()

    ionicRegistry.sidetreeConnector = sidetreeConnector

  return ionicRegistry
}
