import { useState, useCallback, useEffect } from 'react';
import { createLibp2p, Libp2pOptions, Libp2p } from 'libp2p';
import { bootstrap } from '@libp2p/bootstrap';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';

export const encodeText = (test: string) =>
  new TextEncoder().encode(test);

export const decodeText = (buffer: BufferSource) =>
  new TextDecoder().decode(buffer);

export const topic = 'wt_test_pubsub/v1';

export const options: Libp2pOptions = {
  transports: [webSockets()],
  streamMuxers: [mplex()],
  connectionEncryption: [noise()],
  peerDiscovery: [
    bootstrap({
      list: [
        '/ip4/104.131.131.82/tcp/443/wss/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
      ],
      timeout: 1000,
      tagName: 'bootstrap',
      tagValue: 50,
      tagTTL: 120000,
    }),
  ],
  pubsub: gossipsub(),
};

export const App = () => {
  const [error, setError] = useState<string | undefined>();
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [broadcasting, setBroadcasting] = useState<boolean>(false);
  const [lib, setLib] = useState<Libp2p | undefined>();

  const startClient = useCallback(
    async () => {
      try {
        setError(undefined);
        const libp2p = await createLibp2p(options);

        libp2p.addEventListener('peer:discovery', async ({ detail }) => {
          console.log('Peer:', detail.id.toString());
          await libp2p.peerStore.addressBook.set(detail.id, detail.multiaddrs);
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
      {error && (
        <div>🚨 {error}</div>
      )}
    </>
  );
};
