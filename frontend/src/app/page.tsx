"use client";

import {
  WagmiProvider,
  createConfig,
  http,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GameCanvas from "../components/GameCanvas";
import { FarcasterProvider, useFarcasterIdentity } from "../components/FarcasterProvider";
import { useGameBackend } from "../hooks/useGameBackend";

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [injected()],
});

const queryClient = new QueryClient();

function GameContainer() {
  const {
    isConnected,
    walletAddress,
    connect,
    disconnect,
    isReady,
    walletSource,
    walletLabel,
    username,
    fid,
  } = useFarcasterIdentity();
  const { character } = useGameBackend(isConnected ? walletAddress : undefined);

  if (!isReady) return <div style={{ color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>Loading...</div>;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          height: "auto",
          maxHeight: 954,
          aspectRatio: "9/16",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid #1f2937",
          background: "#000",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Minimal Header */}
        <div
          style={{
            padding: "8px 0",
            background: "#0f172a",
            color: "#64748b",
            fontSize: 10,
            fontWeight: 700,
            display: "flex",
            justifyContent: "center",
            borderBottom: "1px solid #1e293b",
            letterSpacing: 1,
            textTransform: "uppercase"
          }}
        >
          Onchain RPG
        </div>

        <div
          style={{
            flex: 1,
            position: "relative",
            background: "#000"
          }}
        >
          <GameCanvas
            isConnected={isConnected}
            connect={connect}
            disconnect={disconnect}
            playerAddress={walletAddress}
            characterData={character}
            walletSource={walletSource}
            walletLabel={walletLabel}
            username={username}
            fid={fid}
          />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider>
          <main
            style={{
              width: "100vw",
              height: "100vh",
              overflow: "hidden",
              backgroundColor: "#020617",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GameContainer />
          </main>
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
