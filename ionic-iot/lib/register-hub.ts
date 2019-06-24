import { IonicLib } from 'ionic-lib'
import { data } from './data'
import {JSONWebToken} from "ionic-lib/js/interactionTokens/JSONWebToken";
import fetch from 'node-fetch'
import {CredentialsReceive} from "ionic-lib/js/interactionTokens/credentialsReceive";

const registry = IonicLib.registries.ionic.create()
const vaultedKeyProvider = new IonicLib.KeyProvider(data.seed, data.secret)
const fs = require('fs')

console.log('Requesting this device for Hub Access..')
registry
  .authenticate(vaultedKeyProvider, {
    derivationPath: IonicLib.KeyTypes.ionicIdentityKey,
    encryptionPass: data.secret
  })
  .then(async iw => {
    const credentialRequest = await iw.create.interactionTokens.request.share({
      callbackURL: 'http://localhost:9000/access/hub',
        credentialRequirements: [{
          type: ['Credential', 'ProofOfAccessCredential'],
          constraints: []
        }],
      }, data.secret)
      const { token } = await fetch(credentialRequest.interactionToken.callbackURL, {
        method: 'POST',
        body: JSON.stringify({ token: credentialRequest.encode() }),
        headers: { 'Content-Type': 'application/json' },
      }).then(body => {
        console.log('Request Successful')
        return body.json()
      })
      // console.log('token: ' + token)
      const jwt = JSONWebToken.decode<CredentialsReceive>(token)
      const credentialResponse = jwt.payload.interactionToken as CredentialsReceive
      // const parsed = await JolocomLib.parse.interactionToken.fromJWT(token)
      credentialResponse.signedCredentials.map(credential => {
        // console.log(credential)
        console.log('Credential Name: ' + credential.name)
        console.log('Credential Issuer: ' + credential.issuer)
        console.log('Claim: ' + JSON.stringify(credential.claim, null, 2))
        console.log('Proof: ' + JSON.stringify(credential.proof, null, 2))
        fs.writeFile('claim.json', JSON.stringify(credential), 'utf8', function readFileCallback(err, data) {
          if (err) {
            console.log(err);
          } else {}
        })
      })
  })