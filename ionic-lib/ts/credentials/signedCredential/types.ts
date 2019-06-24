import { ICredentialAttrs, IClaimSection } from '../credential/types'
import { ILinkedDataSignatureAttrs } from '../../linkedDataSignature/types'
import { BaseMetadata } from 'cred-types-jolocom-core'

export interface ISignedCredentialAttrs extends ICredentialAttrs {
  id: string
  issuer: string
  issuanceDate: string
  expirationDate?: string
  credentialSubject: IClaimSection
  proof: ILinkedDataSignatureAttrs
}

/* Allows for neat claim autocompletion based on metadata type */
export interface ISignedCredCreationArgs<T extends BaseMetadata> {
  metadata: T
  credentialSubject: T['claimInterface']
  subject: string
}

export interface IKeyMetadata {
  derivationPath: string
  keyId: string
}
