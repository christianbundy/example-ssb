const crypto = require("crypto")

const keyPair = crypto.generateKeyPairSync("ed25519", {
  publicKeyEncoding: {
    type: "spki",
    format: "der"
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "der"
  }
})

const publicKey = keyPair.publicKey.slice(-32).toString("base64")
const author = `@${publicKey}.ed25519`

const unsignedMessageObject = {
  previous: null,
  sequence: 1,
  author,
  timestamp: Date.now(),
  hash: "sha256",
  content: {
    type: "post",
    text: "hello world"
  }
}

const serialize = messageObject => JSON.stringify(messageObject, null, 2)
const copyObject = object => JSON.parse(JSON.stringify(object))

const unsignedMessageString = serialize(unsignedMessageObject)

// TODO: Can we avoid passing through to `crypto.createPrivateKey()` here?
const signature = crypto.sign(null, Buffer.from(unsignedMessageString), {
  key: keyPair.privateKey,
  format: "der",
  type: "pkcs8"
})

const signedMessage = copyObject(unsignedMessageObject)
signedMessage.signature = signature.toString("base64")

console.log(serialize(signedMessage))
