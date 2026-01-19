import { useState, useEffect } from "react";

export type CharacterData = {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpMax: number;
  gold: number;
  inventory: string[];
  equippedItem: string | null;
  questsCompleted: number;
  onchainBalance: number;
  ownedNfts: number;
};

export function useGameBackend(address: string | undefined) {
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCharacter = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (!address) {
          setCharacter({
            id: "guest",
            name: "Guest",
            level: 1,
            xp: 0,
            xpMax: 100,
            gold: 0,
            inventory: [],
            equippedItem: null,
            questsCompleted: 0,
            onchainBalance: 0,
            ownedNfts: 0,
          });
        } else {
          setCharacter({
            id: address,
            name: `Hero-${address.slice(0, 4)}`,
            level: 1,
            xp: 0,
            xpMax: 100,
            gold: 10,
            inventory: ["Wood Sword", "Health Potion"],
            equippedItem: "Wood Sword",
            questsCompleted: 0,
            onchainBalance: 0.25,
            ownedNfts: 2,
          });
        }
      } catch (e) {
        console.error("Failed to fetch character from backend", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacter();
  }, [address]);

  const addXp = async (amount: number) => {
    if (character) {
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              xp: Math.min(prev.xp + amount, prev.xpMax),
            }
          : null
      );
    }
  };

  const mintItem = async (itemName: string) => {
    if (!character) return;
    setCharacter((prev) =>
      prev
        ? {
            ...prev,
            inventory: [...prev.inventory, itemName],
            gold: prev.gold,
          }
        : null
    );
  };

  const completeQuest = async () => {
    if (!character) return;
    setCharacter((prev) =>
      prev
        ? {
            ...prev,
            questsCompleted: prev.questsCompleted + 1,
            gold: prev.gold + 5,
          }
        : null
    );
  };

  const mintCharacter = async () => {};

  const buyItem = async () => {};

  const sellItem = async () => {};

  const equipItem = async () => {};

  const unequipItem = async () => {};

  return {
    character,
    isLoading,
    addXp,
    mintItem,
    completeQuest,
    mintCharacter,
    buyItem,
    sellItem,
    equipItem,
    unequipItem,
  };
}
