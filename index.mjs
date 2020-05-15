import * as ed from "https://deno.land/x/ed25519/mod.ts";
import { Sha256 } from "https://deno.land/std/hash/sha256.ts";
import * as base64 from "https://denopkg.com/chiefbiiko/base64/mod.ts";

// Always verify signatures.
const paranoid = false;

const sha256 = (input) => new Sha256().update(input).digest();

const createKeys = () => {
  const PRIVATE_KEY = ed.utils.randomPrivateKey();

  // This is all kind of a mess. Do we always have to `Uint8Array.from()`?
  return {
    getPublicKey: async () => await ed.getPublicKey(PRIVATE_KEY),
    sign: async (message) =>
      await ed.sign(new TextEncoder().encode(message), PRIVATE_KEY),
    verify: async (signature, message) =>
      await ed.verify(
        signature,
        new TextEncoder().encode(message),
        await ed.getPublicKey(PRIVATE_KEY)
      ),
  };
};

export const createAuthor = async () => {
  // Metadata
  const keys = createKeys();
  const author = `@${base64.fromUint8Array(await keys.getPublicKey())}.ed25519`;

  // State
  const messages = [];
  let sequence = 1;
  let previous = null;

  // Method (`createMessage`)
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

      const payload = JSON.stringify(value, null, 2);

      const signature = await keys.sign(payload);

      if (paranoid === true) {
        const isValid = await keys.verify(signature, payload);

        if (isValid === false) {
          throw new Error("Signature must be valid");
        }
      }

      // The .ed25519 suffix is customary.
      value.signature = `${base64.fromUint8Array(signature)}.sig.ed25519`;

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
