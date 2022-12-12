import { createLibp2p, Libp2pOptions } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import wrtc from '@koush/wrtc';
import { webRTCStar } from '@libp2p/webrtc-star';
import { webSockets } from '@libp2p/websockets';

export const decodeText = (buffer: BufferSource) =>
  new TextDecoder().decode(buffer);

export const topic = 'wt_test_pubsub/v1';

export const webRtc = webRTCStar({ wrtc });

export const options: Libp2pOptions = {
  addresses: {
    listen: [
      '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
      '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
    ]
  },
  transports: [webRtc.transport, webSockets(), tcp()],
  streamMuxers: [mplex()],
  connectionEncryption: [noise()],
  peerDiscovery: [
    webRtc.discovery,
  ],
  pubsub: gossipsub({
    allowPublishToZeroPeers: true,
  }),
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
    // console.log('Peer:', detail.id.toString());
    libp2p.dial(detail.id).catch(err => {
      // console.log(`Could not dial ${detail.id}`, err);
    });
  });

  libp2p.connectionManager.addEventListener('peer:connect', async ({ detail }) => {
    // const id = detail.id.toString();
    // console.log('Peer connected:', id);
  });

  libp2p.connectionManager.addEventListener('peer:disconnect', async ({ detail }) => {
    // const id = detail.id.toString();
    // console.log('Peer disconnected:', id);
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
