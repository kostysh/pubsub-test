# Testing of `libp2p` pub/sub features

These packages are demonstrate pub/sub between nodes in browser and standalone (node.js) via centralized standalone node (node.js) over websockets transport.

## Packages

- `server`: central libp2p server (node.js) for client connection. Receives all messages
- `node`: standalone (node.js) node. Emits events. Receives messages from the `client`
- `client`: standalone (browser) node. Emits events. Receives messages from the `node`

## Setup

- Start `yarn` command for all packages.
- ./packages/server: `yarn start:dev`
- ./packages/node: `yarn start:dev`
- ./packages/client: `yarn start` -> open browser https://localhost:3000
