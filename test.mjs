import { createAuthor } from "./index.mjs";

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
