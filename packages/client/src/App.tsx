import { useState, useCallback, useEffect } from 'react';
import { createLibp2p, Libp2pOptions, Libp2p } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { webSockets } from '@libp2p/websockets';
import { all } from '@libp2p/websockets/filters';
import { bootstrap } from '@libp2p/bootstrap';

export const encodeText = (test: string) =>
  new TextEncoder().encode(test);

export const decodeText = (buffer: BufferSource) =>
  new TextDecoder().decode(buffer);

export const options: Libp2pOptions = {
  transports: [webSockets({
    filter: all
  })],
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

export const App = () => {
  const [error, setError] = useState<string | undefined>();
  const [broadcasting, setBroadcasting] = useState<boolean>(false);
  const [lib, setLib] = useState<Libp2p | undefined>();
  const [peers, setPeers] = useState<number>(0);

  const startClient = useCallback(
    async () => {
      try {
        setError(undefined);
        const libp2p = await createLibp2p(options);

        libp2p.addEventListener('peer:discovery', async ({ detail }) => {
          const id = detail.id.toString();
          console.log('Peer discovery:', id);

          // libp2p.dial(detail.multiaddrs[0]).catch(err => {
          //   console.log(`Could not dial ${detail.id}`, err);
          // });
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
        async () => {
          try {
            setPeers(lib.getConnections().length);
            await lib.pubsub.publish('request', encodeText(`Dude!!! ${Date.now()}`));
          } catch (error) {
            console.log(error);
          }

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
