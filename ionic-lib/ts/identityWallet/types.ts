import { Identity } from '../identity/identity'
import { IVaultedKeyProvider, KeyTypes } from '../vaultedKeyProvider/types'
import { IKeyMetadata } from '../credentials/signedCredential/types'
import {
  ICredentialOfferAttrs,
  ICredentialRequestAttrs,
  ICredentialResponseAttrs,
  ICredentialsReceiveAttrs,
} from '../interactionTokens/interactionTokens.types'

export interface IIdentityWalletCreateArgs {
  vaultedKeyProvider: IVaultedKeyProvider
  identity: Identity
  publicKeyMetadata: IKeyMetadata
}

export type PublicKeyMap = { [key in keyof typeof KeyTypes]?: string }

export type CredentialShareRequestCreationArgs = ICredentialRequestAttrs
export type CredentialShareResponseCreationArgs = ICredentialResponseAttrs
export type CredentialOfferRequestCreationArgs = ICredentialOfferAttrs
export type CredentialOfferResponseCreationArgs = ICredentialsReceiveAttrs

export interface AuthCreationArgs {
  callbackURL: string
  description?: string
}

