"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { base } from "wagmi/chains";
import sdk from "@farcaster/frame-sdk";

type FarcasterContextValue = {
  isConnected: boolean;
  fid: number | null;
  walletAddress: string | undefined;
  connect: () => Promise<void>;
  disconnect: () => void;
  isReady: boolean;
  walletSource: "farcaster" | "browser";
  walletLabel: string | null;
  username: string | null;
  profileImageUrl: string | null;
};

const FarcasterContext = createContext<FarcasterContextValue | undefined>(
  undefined
);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const { address, isConnected: wagmiIsConnected, connector } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const [isReady, setIsReady] = useState(false);
  const [fid, setFid] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [walletSource, setWalletSource] = useState<"farcaster" | "browser">(
    "browser"
  );

  useEffect(() => {
    const load = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          setFid(context.user.fid);
          setUsername(context.user.username ?? null);
          setProfileImageUrl(context.user.pfpUrl ?? null);
          setWalletSource("farcaster");
          
          sdk.actions.ready();
        } else {
          setWalletSource("browser");
        }
      } catch (err) {
        console.warn("Farcaster SDK load failed or not in frame", err);
        setWalletSource("browser");
      } finally {
        setIsReady(true);
      }
    };
    load();
  }, []);

  const connect = async () => {
    try {
      // In a real frame, we might use sdk.actions.signIn() or similar if available,
      // but typically frames rely on the user's connected wallet in the frame host 
      // or an injected provider. Wagmi handles injected providers well.
      const connector = connectors[0];
      if (connector) {
        await connectAsync({ connector, chainId: base.id });
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const disconnect = async () => {
    await disconnectAsync();
  };

  const effectiveUsername = username || (wagmiIsConnected ? "HeroUser" : null);

  return (
    <FarcasterContext.Provider
      value={{
        isConnected: wagmiIsConnected,
        fid,
        walletAddress: address,
        connect,
        disconnect,
        isReady,
        walletSource,
        walletLabel: connector?.name ?? null,
        username: effectiveUsername,
        profileImageUrl,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcasterIdentity() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error(
      "useFarcasterIdentity must be used within a FarcasterProvider"
    );
  }
  return context;
}
