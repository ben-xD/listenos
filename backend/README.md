# ʕ •́؈•̀) `worker-typescript-template`

A batteries included template for kick starting a TypeScript Cloudflare worker project.

## Note: You must use [wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install-update) 1.17 or newer to use this template.

## Getting started

- Oops, workers KV is really slow. 10+ seconds for data to be available, even for the same location which wrote the data. KV is eventually consistent. Also, see https://community.cloudflare.com/t/how-truly-slow-is-workers-kv/218196
- Never use Workers KV. You have to use Durable objects for storing lists of documents (other durable objects).
- For example, you have a list of games, and each game has state.
    - Instead of storing the game IDs in KV, where the keys are the game IDs, and the value is the durable object ID.
    - You should store them in a separate Durable object which has a list.
    - There is no mechanism for controlling which parts of the world the game IDs are up to date. You just have to wait for it if you use KV.
    - Unbearably and inconsistently slow.

### Pre-requisites
- Install `nvm`: follow [Installing and Updating](https://github.com/nvm-sh/nvm#installing-and-updating)
- [Wrangler beta](https://github.com/cloudflare/wrangler2): install with `npm install wrangler@beta`
    - We use Wrangler beta because [Wrangler doesn't support the "environments" in each worker](https://community.cloudflare.com/t/worker-environments-inconsistency/344083/4).

### Launching

- Use node v16: run `nvm use`
- Dev: run `npx wrangler dev --env staging src/index.ts`
    - If connecting via Android, make sure to run `adb reverse tcp:8787 tcp:8787`. Otherwise, you may face `SocketException: Connection refused (OS Error: Connection refused, errno = 111), address = localhost, port = 46694`.
- Publish to Cloudflare: run `npx wrangler publish src/index.ts --env staging`
    - previously: `npx wrangler publish`
- Publish to production or staging: run `npx wrangler publish --env staging src/index.ts`

### Other useful commands
- Create KV namespace: `wrangler kv:namespace create "SESSIONS" -e "production"`

## Original README:

## 🔋 Getting Started

This template is meant to be used with [Wrangler](https://github.com/cloudflare/wrangler). If you are not already familiar with the tool, we recommend that you install the tool and configure it to work with your [Cloudflare account](https://dash.cloudflare.com). Documentation can be found [here](https://developers.cloudflare.com/workers/tooling/wrangler/).

To generate using Wrangler, run this command:

```bash
wrangler generate my-ts-project https://github.com/cloudflare/worker-typescript-template
```

### 👩 💻 Developing

[`src/index.ts`](./src/index.ts) calls the request handler in [`src/handler.ts`](./src/handler.ts), and will return the [request method](https://developer.mozilla.org/en-US/docs/Web/API/Request/method) for the given request.

### 🧪 Testing

This template comes with jest tests which simply test that the request handler can handle each request method. `npm test` will run your tests.

### ✏️ Formatting

This template uses [`prettier`](https://prettier.io/) to format the project. To invoke, run `npm run format`.

### 👀 Previewing and Publishing

For information on how to preview and publish your worker, please see the [Wrangler docs](https://developers.cloudflare.com/workers/tooling/wrangler/commands/#publish).

## 🤢 Issues

If you run into issues with this specific project, please feel free to file an issue [here](https://github.com/cloudflare/worker-typescript-template/issues). If the problem is with Wrangler, please file an issue [here](https://github.com/cloudflare/wrangler/issues).

## ⚠️ Caveats

The `service-worker-mock` used by the tests is not a perfect representation of the Cloudflare Workers runtime. It is a general approximation. We recommend that you test end to end with `wrangler dev` in addition to a [staging environment](https://developers.cloudflare.com/workers/tooling/wrangler/configuration/environments/) to test things before deploying.
