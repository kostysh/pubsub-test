import { useState, useCallback, useEffect } from 'react';
import { createLibp2p, Libp2pOptions, Libp2p } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import wrtc from 'wrtc';
import { webRTCStar } from '@libp2p/webrtc-star';
import { webSockets } from '@libp2p/websockets';

export const encodeText = (test: string) =>
  new TextEncoder().encode(test);

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
  transports: [webRtc.transport, webSockets()],
  streamMuxers: [mplex()],
  connectionEncryption: [noise()],
  peerDiscovery: [
    webRtc.discovery,
  ],
  pubsub: gossipsub({
    allowPublishToZeroPeers: true,
  }),
};

export const App = () => {
  const [error, setError] = useState<string | undefined>();
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [broadcasting, setBroadcasting] = useState<boolean>(false);
  const [lib, setLib] = useState<Libp2p | undefined>();
  const [peers, setPeers] = useState<number>(0);

  const startClient = useCallback(
    async () => {
      try {
        setError(undefined);
        const libp2p = await createLibp2p(options);

        libp2p.addEventListener('peer:discovery', async ({ detail }) => {
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
        setSubscribed(true);

        await libp2p.start();
        setLib(libp2p);
      } catch (error) {
        console.log(error);
        setError('Something went wrong...');
      }
    },
    []
  );

  useEffect(() => {
    startClient();
  }, [startClient]);

  useEffect(() => {
    if (lib) {
      setInterval(
        () => {
          setPeers(lib.connectionManager.getConnections().length);
          lib.pubsub.publish(topic, encodeText(`Hello! ${Date.now()}`));
        },
        5000
      );
      setBroadcasting(true);
    }
  }, [lib, startClient]);

  return (
    <>
      {lib !== undefined && (
        <div>✅ Client started</div>
      )}
      {subscribed && (
        <div>✅ Subscribed to {topic} topic</div>
      )}
      {broadcasting && (
        <div>✅ Broadcasting started</div>
      )}
      <div>✅ Peers {peers}</div>
      {error && (
        <div>🚨 {error}</div>
      )}
    </>
  );
};
