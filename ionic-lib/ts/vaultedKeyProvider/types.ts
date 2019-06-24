import { IDigestable } from '../linkedDataSignature/types'

export enum KeyTypes {
  ionicIdentityKey = "m/73'/0'/0'/0",
  ethereumKey = "m/44'/60'/0'/0/0",
}

export interface IVaultedKeyProvider {
  getPublicKey: (derivationArgs: IKeyDerivationArgs) => Buffer
  getPrivateKey: (derivationArgs: IKeyDerivationArgs) => Buffer
  sign: (derivationArgs: IKeyDerivationArgs, digest: Buffer) => Buffer
  getPublicKeyAsync: (derivationArgs: IKeyDerivationArgs) => Promise<Buffer>
  getPrivateKeyAsync: (derivationArgs: IKeyDerivationArgs) => Promise<Buffer>
  signAsync: (derivationArgs: IKeyDerivationArgs, digest: Buffer) => Promise<Buffer>
  signDigestable: (
    derivationArgs: IKeyDerivationArgs,
    toSign: IDigestable,
  ) => Promise<Buffer>
}

export interface IKeyDerivationArgs {
  encryptionPass: string
  derivationPath: string
}

export interface IProviderConfig {
    protocol: string
    host: string
    port: number
    path: string
}

export interface ISignPayload {
    masterKeyId: string
    path: string
    message: string
}

export interface ISignResult {
    signature: string
}

export interface IKeysPayload {
    masterKeyId: string
    path: string
}

export interface IKeysResult {
    privateKey: string
    publicKey: string
}