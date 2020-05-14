import * as ed from "https://raw.githubusercontent.com/christianbundy/noble-ed25519/deno/index.ts";
import { Sha256 } from "https://deno.land/std/hash/sha256.ts";
import * as base64 from "https://denopkg.com/chiefbiiko/base64/mod.ts";
import { decodeString } from "https://deno.land/std/encoding/hex.ts";

const sha256 = (input) => new Sha256().update(input).digest();

const createKeys = () => {
  const PRIVATE_KEY = ed.utils.randomPrivateKey(); // 32-byte Uint8Array or string.

  return {
    getPublicKey: async () => await ed.getPublicKey(PRIVATE_KEY),
    sign: async (input) => decodeString(await ed.sign(input, PRIVATE_KEY)),
  };
};

let sequence = 1;
let previous = null;

const createAuthor = async () => {
  // Create a pair of public and private keys, which will be used for:
  //
  // - Signing public messages.
  // - Decrypting private messages.
  //
  // The public key is meant to be shared, the private key MUST NEVER BE SHARED.
  const keys = createKeys();

  // I don't remember why we only want the last 32 characters, but we
  // need to convert it to base64 and then decorate it with the `@` prefix
  // and the `.ed25519` suffix.
  const publicKeyBase64 = await keys.getPublicKey();
  const author = `@${base64.fromUint8Array(publicKeyBase64)}.ed25519`;

  const messages = [];

  return {
    createMessage: async (content) => {
      const value = {
        previous,
        sequence,
        author,
        timestamp: Date.now(),
        hash: "sha256",
        content,
      };

      // TODO: Can we avoid passing through to `crypto.createPrivateKey()` here?
      const payload = JSON.stringify(value, null, 2);

      const sign = await keys.sign(payload);
      const signature = base64.fromUint8Array(sign);

      // The .ed25519 suffix is customary.
      value.signature = `${signature}.ed25519`;

      // We get the key *after* the signature. This has made a lot of people
      // very angry and been widely regarded as a bad move.
      const hash = base64.fromUint8Array(
        sha256(JSON.stringify(value, null, 2))
      );

      // The `%` prefix and `.sha256` suffix are customary.
      const key = `%${hash}.sha256`;

      previous = key;
      sequence += 1;

      const message = { key, value };
      messages.push(message);

      return message;
    },
  };
};

const main = async () => {
  const alice = await createAuthor();

  const hello = await alice.createMessage({
    type: "post",
    text: "hello",
    source: "https://github.com/christianbundy/example-ssb",
  });
  const world = await alice.createMessage({
    type: "post",
    text: "deno",
    source: "https://github.com/christianbundy/example-ssb",
  });

  console.log(JSON.stringify([hello, world], null, 2));
};

main();
