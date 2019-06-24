import { IdentityWallet } from '../identityWallet/identityWallet'
import {
  IVaultedKeyProvider,
  IKeyDerivationArgs,
} from '../vaultedKeyProvider/types'
import { Identity } from '../identity/identity'
import {ISidetreeConnector} from "../sidetree/types";


export interface IRegistryStaticCreationArgs {
  sidetreeConnector: ISidetreeConnector
}

export interface IRegistryCommitArgs {
  vaultedKeyProvider: IVaultedKeyProvider
  keyMetadata: IKeyDerivationArgs
  identityWallet: IdentityWallet
  didDocumentSignature: Buffer
}

export interface ISigner {
  did: string
  keyId: string
}

export interface IRegistry {
  create: (
    vaultedKeyProvider: IVaultedKeyProvider,
    decryptionPassword: string,
  ) => Promise<IdentityWallet>
  commit: (commitArgs: IRegistryCommitArgs) => Promise<void>
  resolve: (did) => Promise<Identity>
  authenticate: (
    vaultedKeyProvider: IVaultedKeyProvider,
    derivationArgs: IKeyDerivationArgs,
  ) => Promise<IdentityWallet>
}
