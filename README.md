# Example SSB

A small example of creating an SSB feed with only a few lines of JavaScript.

Pairs well with [HTTP-SSB](https://github.com/christianbundy/http-ssb).

If you want to try creating two messages and uploading them to a Glitch site:

```sh
node test.js | \
curl --header 'Content-Type: application/json' --data '@-' https://daily-alluring-robe.glitch.me
```
