import { createLibp2p, Libp2pOptions } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { webSockets } from '@libp2p/websockets';
import { bootstrap } from '@libp2p/bootstrap';

export const decodeText = (buffer: BufferSource) =>
  new TextDecoder().decode(buffer);

export const options: Libp2pOptions = {
  transports: [webSockets()],
  streamMuxers: [mplex()],
  connectionEncryption: [noise()],
  pubsub: gossipsub({
    allowPublishToZeroPeers: true,
  }),
  peerDiscovery: [
    bootstrap({
      list: [
        '/ip4/127.0.0.1/tcp/34421/ws/p2p/QmcXbDrzUU5ERqRaronWmAJXwe6c7AEkS7qdcsjgEuWPCf'
      ]
    }),
  ],
};

export const start = async (): Promise<void> => {
  console.log('🏃 Node starting...');
  const libp2p = await createLibp2p(options);

  process.once('SIGINT', async () => {
    await libp2p.stop();
    console.log('🚨 Disconnected due to SIGINT');
  });

  process.once('SIGTERM', async () => {
    await libp2p.stop();
    console.log('🚨 Disconnected due to SIGTERM');
  });

  // libp2p.addEventListener('peer:discovery', async ({ detail }) => {
  //   const id = detail.id.toString();
  //   console.log('Peer discovery:', id);
  // });

  libp2p.addEventListener('peer:connect', async ({ detail }) => {
    const id = detail.id.toString();
    console.log('Peer connected:', id);
  });

  libp2p.addEventListener('peer:disconnect', async ({ detail }) => {
    const id = detail.id.toString();
    console.log('Peer disconnected:', id);
  });

  libp2p.pubsub.addEventListener('message', ({ detail }) => {
    console.log(
      `Message: ${decodeText(detail.data)} on topic ${detail.topic}`
    );
  });

  libp2p.pubsub.subscribe('request');

  await libp2p.start();
  console.log('🚀 Node started!', libp2p.peerId.toString());

  setInterval(
    async () => {
      try {
        await libp2p.pubsub.publish('request', new TextEncoder().encode(`Hello! ${Date.now()}`));
      } catch (error) {
        console.log(error);
      }
    },
    5000
  );
};

process.once('unhandledRejection', async (error) => {
  console.log(error);
  process.exit(1);
});

start().catch((error) => {
  console.log(error);
  process.exit(1);
});
