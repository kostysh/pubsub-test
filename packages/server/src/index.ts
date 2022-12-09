import { createLibp2p, Libp2pOptions } from 'libp2p';
import { bootstrap } from '@libp2p/bootstrap';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';

export const decodeText = (buffer: BufferSource) =>
  new TextDecoder().decode(buffer);

export const topic = 'wt_test_pubsub/v1';

export const options: Libp2pOptions = {
  transports: [tcp()],
  streamMuxers: [mplex()],
  connectionEncryption: [noise()],
  peerDiscovery: [
    bootstrap({
      list: [
        '/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
      ],
      timeout: 1000,
      tagName: 'bootstrap',
      tagValue: 50,
      tagTTL: 120000,
    }),
  ],
  pubsub: gossipsub(),
};

export const main = async (): Promise<void> => {
  console.log('🏃 Server starting...');
  const libp2p = await createLibp2p(options);

  process.once('SIGINT', async () => {
    await libp2p.stop();
    console.log('🚨 Disconnected due to SIGINT');
  });

  process.once('SIGTERM', async () => {
    await libp2p.stop();
    console.log('🚨 Disconnected due to SIGTERM');
  });

  libp2p.addEventListener('peer:discovery', ({ detail }) => {
    console.log('Peer:', detail.id.toString());
  });

  libp2p.pubsub.addEventListener('message', ({ detail }) => {
    console.log(
      `Message: ${decodeText(detail.data)} on topic ${detail.topic}`
    );
  });

  libp2p.pubsub.subscribe(topic);
  console.log(`✅ Server subscribed to the ${topic} topic`);

  await libp2p.start();
  console.log('🚀 Server started!');
};

process.once('unhandledRejection', async (error) => {
  console.log(error);
  process.exit(1);
});

main().catch((error) => {
  console.log(error);
  process.exit(1);
});
