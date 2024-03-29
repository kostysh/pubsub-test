import { createLibp2p, Libp2pOptions } from 'libp2p';
import { createFromJSON } from '@libp2p/peer-id-factory';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { webSockets } from '@libp2p/websockets';
import peerKeyJson from '../peerKey.json';

export const decodeText = (buffer: BufferSource) =>
  new TextDecoder().decode(buffer);

export const options: Libp2pOptions = {
  addresses: {
    listen: [
      '/ip4/0.0.0.0/tcp/34421/ws',
    ]
  },
  transports: [webSockets()],
  streamMuxers: [mplex()],
  connectionEncryption: [noise()],
  pubsub: gossipsub({
    allowPublishToZeroPeers: true,
  }),
  // relay: {
  //   enabled: true,
  //   hop: {
  //     enabled: true,
  //   }
  // },
};

export const start = async (): Promise<void> => {
  console.log('🏃 Server starting...');
  const peerId = await createFromJSON(peerKeyJson);
  const libp2p = await createLibp2p({ peerId, ...options });

  process.once('SIGINT', async () => {
    await libp2p.stop();
    console.log('🚨 Disconnected due to SIGINT');
  });

  process.once('SIGTERM', async () => {
    await libp2p.stop();
    console.log('🚨 Disconnected due to SIGTERM');
  });

  libp2p.addEventListener('peer:discovery', async ({ detail }) => {
    const id = detail.id.toString();
    console.log('Peer discovery:', id);
  })

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
  console.log('🚀 Server started!', libp2p.getMultiaddrs());
};

process.once('unhandledRejection', async (error) => {
  console.log(error);
  process.exit(1);
});

start().catch((error) => {
  console.log(error);
  process.exit(1);
});
