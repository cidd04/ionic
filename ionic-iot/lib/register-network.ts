import { IonicLib } from 'ionic-lib'
import { data } from './data'

const registry = IonicLib.registries.ionic.create()
const vaultedProvider = new IonicLib.KeyProvider(data.seed, data.secret)

console.log('Registering this device to the ION Network..')
registry.create(vaultedProvider, data.secret).then(identityWallet => {
  console.log('DID : ' + identityWallet.newDid)
  console.log('Public Key : ' + JSON.stringify(identityWallet.didDocument.publicKey, null, 2))
  console.log('Service Endpoints : ' + JSON.stringify(identityWallet.didDocument.service, null, 2))
  console.log('Authentication Key : ' + JSON.stringify(identityWallet.didDocument.authentication, null, 2))
  console.log('\nRegistration Complete')
})
