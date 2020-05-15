const { createAuthor } = require("./");

const alice = createAuthor();

const hello = alice.createMessage({
  type: "post",
  text: "hello",
  source: "https://github.com/christianbundy/example-ssb",
});

const world = alice.createMessage({
  type: "post",
  text: "world",
  source: "https://github.com/christianbundy/example-ssb",
});

console.log(JSON.stringify([hello, world], null, 2));
