import {data} from "./data";
import {IonicLib} from "ionic-lib";
import fetch from 'node-fetch'
import { verify as eccVerify } from 'tiny-secp256k1'
import * as crypto from 'crypto'

const fs = require('fs')
const https = require('https');
const registry = IonicLib.registries.ionic.create()
const vaultedKeyProvider = new IonicLib.KeyProvider(data.seed, data.secret)

//1. Get DID Document from Verifiable Credential issuer DID
let rawdata = fs.readFileSync('claim.json');
let signedCredential = JSON.parse(rawdata);

//2. Hit serviceEndpoint
console.log('Software Upgrade start.');
registry
  .authenticate(vaultedKeyProvider, {
    derivationPath: IonicLib.KeyTypes.ionicIdentityKey,
    encryptionPass: data.secret
  })
  .then(async iw => {
    const credentialResponse = await iw.create.interactionTokens.response.share({
    callbackURL: '',
      suppliedCredentials: [signedCredential] // Provide signed credentials of requested type
    },
    data.secret, // The password to decrypt the seed for key generation as part of signing the JWT
    undefined)
    // console.log(credentialResponse)
    const result = await fetch('http://localhost:9000/hub', {
      method: 'POST',
      body: JSON.stringify({ token: credentialResponse.encode() }),
      headers: { 'Content-Type': 'application/json' },
    }).then(body => {
      console.log('Authentication Successful. This device is authorized to access the Hub')
      return body.json()
    })
    // console.log(result)
    const file = fs.createWriteStream("file.dat");
    console.log('Latest Version is ' + result.version)
    console.log('Current Version is 1.0.0')
    console.log('Software Update is available')
    console.log('Downloading latest software from: ' + result.downloadUrl + ' ...')
    https.get(result.downloadUrl, function(response) {
      response.pipe(file)
      console.log('Download Successful.')
      console.log('Verifying signature...')
      fs.readFile('claim.json', function(err, data) {
        // const verifier = crypto.createVerify('RSA-SHA256')
        // console.log(data)
        // verifier.update(data)
        console.log('Image Signature: ' + result.imageSignature)
        console.log('Public Key Hex : ' + result.publicKeyHex)
        console.log('Type : ' + result.type)
        const publicKeyBuf = Buffer.from(result.publicKeyHex, 'hex')
        const signatureBuf = Buffer.from(result.imageSignature, 'hex')
        const hash = crypto.createHash('sha256')
          .update(data)
          .digest()
        const out = eccVerify(hash, publicKeyBuf, signatureBuf)

        // const hex = hash.toString('hex')
        console.log('Verification successful.')
        console.log(out ? 'Software is OK and is ready for installation': 'Software is corrupted')
      })
    });
  })