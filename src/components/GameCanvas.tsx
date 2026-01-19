"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import * as THREE from "three";
import type { CharacterData } from "../hooks/useGameBackend";

type MapId = "Arena" | "Quest Forest" | "Dungeon" | "Hunting Grounds";

type MapBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

type Enemy = {
  id: string;
  position: THREE.Vector3;
  hp: number;
  level: number;
  xpReward: number;
  goldDrop: number;
  mesh: THREE.Mesh;
};

type GameCanvasProps = {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  playerAddress: string | undefined;
  characterData?: CharacterData | null;
  walletSource?: "farcaster" | "browser";
  walletLabel?: string | null;
  username?: string | null;
  fid?: number | null;
};

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createCharacter() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.5;
  body.castShadow = true;
  group.add(body);

  const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 2.6;
  head.castShadow = true;
  group.add(head);

  const legGeo = new THREE.BoxGeometry(0.3, 1.2, 0.3);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.3, 0.6, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.3, 0.6, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  const armGeo = new THREE.BoxGeometry(0.25, 1, 0.25);
  const armMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });

  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.7, 1.8, 0);
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.7, 1.8, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  return { group, leftLeg, rightLeg, leftArm, rightArm };
}

function createEnemiesForMap(
  group: THREE.Group,
  bounds: MapBounds,
  baseLevel: number,
  color: number
): Enemy[] {
  const enemies: Enemy[] = [];
  const enemyCount = 3 + Math.floor(Math.random() * 3);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color });

  for (let i = 0; i < enemyCount; i += 1) {
    const x = randomInRange(bounds.minX + 2, bounds.maxX - 2);
    const z = randomInRange(bounds.minZ + 2, bounds.maxZ - 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 0.5, z);
    mesh.castShadow = true;
    group.add(mesh);

    const level = baseLevel + Math.floor(Math.random() * 3);

    enemies.push({
      id: `enemy-${Date.now()}-${i}-${Math.random().toString(16).slice(2)}`,
      position: mesh.position.clone(),
      hp: 10 + level * 5,
      level,
      xpReward: 5 + level * 2,
      goldDrop: 2 + level,
      mesh,
    });
  }

  return enemies;
}

function createMapEnvironment(mapId: MapId): {
  group: THREE.Group;
  bounds: MapBounds;
  enemies: Enemy[];
} {
  const group = new THREE.Group();

  const baseBounds: MapBounds = {
    minX: -20,
    maxX: 20,
    minZ: -20,
    maxZ: 20,
  };

  const width = baseBounds.maxX - baseBounds.minX;
  const depth = baseBounds.maxZ - baseBounds.minZ;

  let groundColor = 0x0f172a;

  if (mapId === "Quest Forest") {
    groundColor = 0x14532d;
  } else if (mapId === "Dungeon") {
    groundColor = 0x020617;
  } else if (mapId === "Arena") {
    groundColor = 0x1e293b;
  } else if (mapId === "Hunting Grounds") {
    groundColor = 0x166534;
  }

  const groundGeometry = new THREE.PlaneGeometry(width, depth, 1, 1);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: groundColor,
    roughness: 0.9,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  if (mapId === "Quest Forest") {
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x854d0e });
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x22c55e });
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });

    for (let i = 0; i < 12; i += 1) {
      const x = randomInRange(baseBounds.minX + 2, baseBounds.maxX - 2);
      const z = randomInRange(baseBounds.minZ + 2, baseBounds.maxZ - 2);

      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 8);
      const trunk = new THREE.Mesh(trunkGeo, trunkMaterial);
      trunk.position.set(x, 0.6, z);
      trunk.castShadow = true;
      group.add(trunk);

      const foliageGeo = new THREE.SphereGeometry(0.9, 12, 12);
      const foliage = new THREE.Mesh(foliageGeo, foliageMaterial);
      foliage.position.set(x, 1.6, z);
      foliage.castShadow = true;
      group.add(foliage);
    }

    for (let i = 0; i < 8; i += 1) {
      const x = randomInRange(baseBounds.minX + 2, baseBounds.maxX - 2);
      const z = randomInRange(baseBounds.minZ + 2, baseBounds.maxZ - 2);

      const rockGeo = new THREE.DodecahedronGeometry(0.5, 0);
      const rock = new THREE.Mesh(rockGeo, rockMaterial);
      rock.position.set(x, 0.3, z);
      rock.castShadow = true;
      group.add(rock);
    }
  }

  if (mapId === "Dungeon") {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const wallThickness = 1;
    const wallHeight = 3;

    const wallGeoX = new THREE.BoxGeometry(width, wallHeight, wallThickness);
    const wallGeoZ = new THREE.BoxGeometry(wallThickness, wallHeight, depth);

    const wallNorth = new THREE.Mesh(wallGeoX, wallMaterial);
    wallNorth.position.set(0, wallHeight / 2, baseBounds.minZ);
    wallNorth.castShadow = true;
    group.add(wallNorth);

    const wallSouth = new THREE.Mesh(wallGeoX, wallMaterial);
    wallSouth.position.set(0, wallHeight / 2, baseBounds.maxZ);
    wallSouth.castShadow = true;
    group.add(wallSouth);

    const wallWest = new THREE.Mesh(wallGeoZ, wallMaterial);
    wallWest.position.set(baseBounds.minX, wallHeight / 2, 0);
    wallWest.castShadow = true;
    group.add(wallWest);

    const wallEast = new THREE.Mesh(wallGeoZ, wallMaterial);
    wallEast.position.set(baseBounds.maxX, wallHeight / 2, 0);
    wallEast.castShadow = true;
    group.add(wallEast);
  }

  if (mapId === "Arena") {
    const boundaryMaterial = new THREE.MeshStandardMaterial({ color: 0xf97316 });
    const ringGeo = new THREE.RingGeometry(10, 10.4, 32);
    const ring = new THREE.Mesh(ringGeo, boundaryMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.receiveShadow = true;
    group.add(ring);
  }

  if (mapId === "Hunting Grounds") {
    const nodeMaterial = new THREE.MeshStandardMaterial({ color: 0xfacc15 });

    for (let i = 0; i < 10; i += 1) {
      const x = randomInRange(baseBounds.minX + 3, baseBounds.maxX - 3);
      const z = randomInRange(baseBounds.minZ + 3, baseBounds.maxZ - 3);

      const nodeGeo = new THREE.SphereGeometry(0.3, 10, 10);
      const node = new THREE.Mesh(nodeGeo, nodeMaterial);
      node.position.set(x, 0.4, z);
      node.castShadow = true;
      group.add(node);
    }
  }

  let enemies: Enemy[] = [];

  if (mapId === "Quest Forest") {
    enemies = createEnemiesForMap(group, baseBounds, 1, 0xff4b4b);
  } else if (mapId === "Dungeon") {
    enemies = createEnemiesForMap(group, baseBounds, 3, 0xef4444);
  } else if (mapId === "Arena") {
    enemies = createEnemiesForMap(group, baseBounds, 5, 0xdc2626);
  } else if (mapId === "Hunting Grounds") {
    enemies = createEnemiesForMap(group, baseBounds, 2, 0xfb7185);
  }

  return { group, bounds: baseBounds, enemies };
}

export default function GameCanvas({
  isConnected,
  connect,
  disconnect,
  playerAddress,
  characterData,
  walletSource,
  walletLabel,
  username,
  fid,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const pressedKeysRef = useRef<Record<string, boolean>>({});
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeMap, setActiveMap] = useState<MapId>("Quest Forest");
  const [enemiesNearby, setEnemiesNearby] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<
    "Guild" | "Achievements" | "Events" | "Settings" | "Help"
  >("Guild");
  const enemiesRef = useRef<Enemy[]>([]);
  const mapBoundsRef = useRef<MapBounds>({
    minX: -25,
    maxX: 25,
    minZ: -25,
    maxZ: 25,
  });
  const lastNearbyCountRef = useRef(0);
  const [cooldowns, setCooldowns] = useState<{ attack: boolean; skill1: boolean; skill2: boolean }>({
    attack: false,
    skill1: false,
    skill2: false,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
      setIsDesktop(window.innerWidth >= 768);
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const { group: mapGroup, bounds, enemies } = createMapEnvironment(activeMap);
    scene.add(mapGroup);
    mapBoundsRef.current = bounds;
    enemiesRef.current = enemies;

    const { group: player, leftLeg, rightLeg, leftArm, rightArm } = createCharacter();
    scene.add(player);

    camera.position.set(0, 8, 12);
    camera.lookAt(player.position);

    const speed = 0.15;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      let moved = false;
      const keys = pressedKeysRef.current;

      if (keys.KeyW || keys.ArrowUp) {
        player.position.z -= speed;
        player.rotation.y = Math.PI;
        moved = true;
      }
      if (keys.KeyS || keys.ArrowDown) {
        player.position.z += speed;
        player.rotation.y = 0;
        moved = true;
      }
      if (keys.KeyA || keys.ArrowLeft) {
        player.position.x -= speed;
        player.rotation.y = -Math.PI / 2;
        moved = true;
      }
      if (keys.KeyD || keys.ArrowRight) {
        player.position.x += speed;
        player.rotation.y = Math.PI / 2;
        moved = true;
      }

      if (moved) {
        const boundsCurrent = mapBoundsRef.current;
        player.position.x = Math.max(
          boundsCurrent.minX,
          Math.min(boundsCurrent.maxX, player.position.x)
        );
        player.position.z = Math.max(
          boundsCurrent.minZ,
          Math.min(boundsCurrent.maxZ, player.position.z)
        );

        const time = Date.now() * 0.01;
        leftLeg.rotation.x = Math.sin(time) * 0.5;
        rightLeg.rotation.x = Math.sin(time + Math.PI) * 0.5;
        leftArm.rotation.x = Math.sin(time + Math.PI) * 0.5;
        rightArm.rotation.x = Math.sin(time) * 0.5;

        const targetX = player.position.x;
        const targetZ = player.position.z + 10;
        camera.position.x += (targetX - camera.position.x) * 0.1;
        camera.position.z += (targetZ - camera.position.z) * 0.1;
        camera.lookAt(player.position);
      } else {
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
      }

      const allEnemies = enemiesRef.current;
      const nearbyRadius = 6;
      let nearbyCount = 0;
      for (let i = 0; i < allEnemies.length; i += 1) {
        const enemy = allEnemies[i];
        const dx = enemy.position.x - player.position.x;
        const dz = enemy.position.z - player.position.z;
        const distanceSq = dx * dx + dz * dz;
        if (distanceSq <= nearbyRadius * nearbyRadius) {
          nearbyCount += 1;
        }
      }

      if (lastNearbyCountRef.current !== nearbyCount) {
        lastNearbyCountRef.current = nearbyCount;
        setEnemiesNearby(nearbyCount);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      resizeObserver.disconnect();
      renderer.dispose();
      mapGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => {
              if (m instanceof THREE.Material) {
                m.dispose();
              }
            });
          } else if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      player.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      enemiesRef.current = [];
      if (container) container.innerHTML = "";
    };
  }, [activeMap]);

  const handleKeyDown = (e: KeyboardEvent) => {
    pressedKeysRef.current[e.code] = true;
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    pressedKeysRef.current[e.code] = false;
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (activeTab !== null) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const threshold = 10;
    // Tap logic
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      // Tap detected
      return;
    }

    // Swipe logic
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) simulateKey("KeyD", 300);
      else simulateKey("KeyA", 300);
    } else {
      if (dy > 0) simulateKey("KeyS", 300);
      else simulateKey("KeyW", 300);
    }
  };

  const simulateKey = (code: string, duration: number) => {
    pressedKeysRef.current[code] = true;
    setTimeout(() => {
      pressedKeysRef.current[code] = false;
    }, duration);
  };

  const handleCombatAction = (action: "attack" | "skill1" | "skill2") => {
    if (cooldowns[action]) return;

    // Stub combat action
    console.log(`Combat Action Triggered: ${action}`);

    // Set cooldown
    setCooldowns((prev) => ({ ...prev, [action]: true }));

    // Reset cooldown after delay
    const duration = action === "attack" ? 500 : action === "skill1" ? 2000 : 5000;
    setTimeout(() => {
      setCooldowns((prev) => ({ ...prev, [action]: false }));
    }, duration);
  };

  const quests = [
    {
      id: "fc-login",
      icon: "🟪",
      title: "Cast Your First Spell",
      desc: "Connect your Farcaster identity",
      reward: "+50 XP",
    },
    {
      id: "base-move",
      icon: "⛓️",
      title: "Walk the Base Realm",
      desc: "Move 100 steps on-chain",
      reward: "+20 Gold",
    },
    {
      id: "slay",
      icon: "🐲",
      title: "First Blood",
      desc: "Defeat your first monster",
      reward: "🪙 1 Token",
    },
  ];

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        outline: "none",
        backgroundColor: "#020617",
        overflow: "hidden",
      }}
      onClick={(e) => {
        if (activeTab !== null) return;
        e.currentTarget.focus();
      }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {!isDesktop && (
        <>
          {/* Mobile D-Pad (Bottom Left) */}
          <div
            style={{
              position: "absolute",
              bottom: 100,
              left: 20,
              width: 120,
              height: 120,
              zIndex: 20,
              pointerEvents: "none",
            }}
          >
            {/* Up */}
            <div
              onTouchStart={(e) => {
                e.stopPropagation();
                pressedKeysRef.current["KeyW"] = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                pressedKeysRef.current["KeyW"] = false;
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 40,
                width: 40,
                height: 40,
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: 8,
                pointerEvents: "auto",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.7)",
                fontSize: 20,
              }}
            >
              ▲
            </div>
            {/* Down */}
            <div
              onTouchStart={(e) => {
                e.stopPropagation();
                pressedKeysRef.current["KeyS"] = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                pressedKeysRef.current["KeyS"] = false;
              }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 40,
                width: 40,
                height: 40,
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: 8,
                pointerEvents: "auto",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.7)",
                fontSize: 20,
              }}
            >
              ▼
            </div>
            {/* Left */}
            <div
              onTouchStart={(e) => {
                e.stopPropagation();
                pressedKeysRef.current["KeyA"] = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                pressedKeysRef.current["KeyA"] = false;
              }}
              style={{
                position: "absolute",
                top: 40,
                left: 0,
                width: 40,
                height: 40,
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: 8,
                pointerEvents: "auto",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.7)",
                fontSize: 20,
              }}
            >
              ◀
            </div>
            {/* Right */}
            <div
              onTouchStart={(e) => {
                e.stopPropagation();
                pressedKeysRef.current["KeyD"] = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                pressedKeysRef.current["KeyD"] = false;
              }}
              style={{
                position: "absolute",
                top: 40,
                right: 0,
                width: 40,
                height: 40,
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: 8,
                pointerEvents: "auto",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.7)",
                fontSize: 20,
              }}
            >
              ▶
            </div>
          </div>

          {/* Mobile Combat Buttons (Bottom Right) */}
          <div
            style={{
              position: "absolute",
              bottom: 100,
              right: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "flex-end",
              zIndex: 20,
              pointerEvents: "none",
            }}
          >
            {/* Skill 2 */}
            <div
              onTouchStart={(e) => {
                e.stopPropagation();
                handleCombatAction("skill2");
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: cooldowns.skill2
                  ? "rgba(15, 23, 42, 0.6)"
                  : "rgba(59, 130, 246, 0.6)",
                border: "2px solid rgba(255, 255, 255, 0.5)",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 12,
                marginRight: 40,
                opacity: cooldowns.skill2 ? 0.5 : 1,
              }}
            >
              S2
            </div>
            {/* Skill 1 */}
            <div
              onTouchStart={(e) => {
                e.stopPropagation();
                handleCombatAction("skill1");
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: cooldowns.skill1
                  ? "rgba(15, 23, 42, 0.6)"
                  : "rgba(168, 85, 247, 0.6)",
                border: "2px solid rgba(255, 255, 255, 0.5)",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 14,
                marginRight: 20,
                opacity: cooldowns.skill1 ? 0.5 : 1,
              }}
            >
              S1
            </div>
            {/* Attack */}
            <div
              onTouchStart={(e) => {
                e.stopPropagation();
                handleCombatAction("attack");
              }}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: cooldowns.attack
                  ? "rgba(15, 23, 42, 0.6)"
                  : "rgba(220, 38, 38, 0.8)",
                border: "2px solid rgba(255, 255, 255, 0.8)",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                opacity: cooldowns.attack ? 0.5 : 1,
                boxShadow: "0 0 15px rgba(220, 38, 38, 0.4)",
              }}
            >
              ⚔️
            </div>
          </div>
        </>
      )}

      {/* Top Left HUD - Identity */}
      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        pointerEvents: "none",
        color: "#fff",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        textShadow: "0 2px 4px rgba(0,0,0,0.8)",
        zIndex: 15,
      }}>
        <div style={{ fontWeight: "bold", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
          {username || "Guest"} 
          {fid && <span style={{ fontSize: 12, opacity: 0.7, fontWeight: "normal" }}>#{fid}</span>}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
          {playerAddress ? `${playerAddress.slice(0, 6)}...${playerAddress.slice(-4)}` : "No Wallet"}
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 6 }}>
          Map: {activeMap}
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
          Enemies nearby: {enemiesNearby}
        </div>
        {characterData && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: "#4ade80", fontWeight: "bold", marginBottom: 2 }}>
              Level {characterData.level}
            </div>
            <div style={{ 
              width: 120, 
              height: 8, 
              background: "rgba(30, 41, 59, 0.8)", 
              borderRadius: 4, 
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden"
            }}>
              <div style={{ 
                width: `${(characterData.xp / Math.max(characterData.xpMax, 1)) * 100}%`, 
                height: "100%", 
                background: "#4ade80",
                boxShadow: "0 0 8px rgba(74, 222, 128, 0.5)"
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Left HUD - Stats (Only if character exists) */}
      {characterData && (
        <div style={{
          position: "absolute",
          bottom: 60,
          left: 16,
          pointerEvents: "none",
          color: "#e2e8f0",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 13,
          textShadow: "0 2px 4px rgba(0,0,0,0.8)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          zIndex: 10,
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 16 }}>💰</span> {characterData.gold}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 16 }}>🎒</span> {characterData.inventory.length}
            </div>
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
             Equipped: <span style={{ color: "#fff" }}>{characterData.equippedItem || "None"}</span>
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 12,
          top: "auto",
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          zIndex: 10,
        }}
      >
        {["Profile", "Market", "Quests", "Leaderboard", "More"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(activeTab === tab ? null : tab)}
            style={{
              flex: 1,
              padding: "10px 0",
              background: activeTab === tab ? "#3b82f6" : "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(148,163,184,0.3)",
              borderRadius: 12,
              color: "#f9fafb",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "center",
              backdropFilter: "blur(10px)",
              transition: "all 0.15s ease-out",
              letterSpacing: 0.3,
              textTransform: "uppercase",
              boxShadow: activeTab === tab ? "0 0 10px rgba(59, 130, 246, 0.4)" : "none",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active Tab Modal */}
      {activeTab && (
        <div style={{
          position: "absolute",
          top: "auto",
          bottom: 88,
          left: "50%",
          transform: "translate(-50%, 0)",
          width: "90%",
          maxWidth: 360,
          maxHeight: "75%",
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(51, 65, 85, 1)",
          borderRadius: 20,
          padding: 20,
          color: "#fff",
          zIndex: 30,
          boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.7)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{activeTab}</h3>
            <button 
              onClick={() => setActiveTab(null)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto" }}>
            {activeTab === "Profile" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                <div>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Wallets</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { name: "MetaMask (Web)", id: "metamask", isConnected: walletLabel?.toLowerCase().includes("meta") && isConnected },
                      { name: "Base Wallet", id: "base", isConnected: walletLabel?.toLowerCase().includes("coinbase") && isConnected },
                      { name: "Farcaster Mini App", id: "farcaster", isConnected: walletSource === "farcaster" && isConnected }
                    ].map((w) => (
                      <div key={w.id} style={{
                        background: "rgba(30, 41, 59, 0.5)",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.05)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{w.name}</div>
                          <div style={{ fontSize: 11, color: w.isConnected ? "#4ade80" : "#94a3b8" }}>
                            {w.isConnected ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span>Connected</span>
                                {playerAddress && w.isConnected && (
                                  <span style={{ 
                                    background: "rgba(255,255,255,0.1)", 
                                    padding: "1px 4px", 
                                    borderRadius: 4, 
                                    fontSize: 10,
                                    fontFamily: "monospace",
                                    color: "#e2e8f0"
                                  }}>
                                    {playerAddress.slice(0, 6)}...{playerAddress.slice(-4)}
                                  </span>
                                )}
                              </div>
                            ) : "Not Connected"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => {
                              if (isConnected) {
                                disconnect();
                              } else {
                                connect();
                              }
                            }}
                            style={{
                              padding: "4px 10px",
                              fontSize: 11,
                              borderRadius: 999,
                              border: "1px solid rgba(148,163,184,0.7)",
                              background: isConnected ? "rgba(127,29,29,0.85)" : "rgba(22,101,52,0.9)",
                              color: "#f9fafb",
                              cursor: "pointer",
                              fontWeight: 500,
                            }}
                          >
                            {isConnected ? "Disconnect" : "Connect"}
                          </button>
                          {w.id === "farcaster" && w.isConnected && (
                            <button
                              onClick={() => alert("Syncing Farcaster data...")}
                              style={{
                                padding: "4px 8px",
                                fontSize: 10,
                                background: "#2563eb",
                                border: "none",
                                borderRadius: 4,
                                color: "#fff",
                                cursor: "pointer",
                              }}
                            >
                              Sync
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inventory Section */}
                <div>
                   <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Inventory</h4>
                   <div style={{
                     background: "rgba(30, 41, 59, 0.3)",
                     borderRadius: 12,
                     padding: 12,
                     minHeight: 100,
                     border: "1px solid rgba(255,255,255,0.05)"
                   }}>
                      {!characterData ? (
                        <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: 20 }}>
                          Connect wallet to view inventory
                        </div>
                      ) : characterData.inventory.length === 0 ? (
                        <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: 20 }}>
                          No items found
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: 8 }}>
                          {characterData.inventory.map((item, idx) => (
                            <div key={idx} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "rgba(15, 23, 42, 0.6)",
                              padding: 8,
                              borderRadius: 8
                            }}>
                              <span style={{ fontSize: 13 }}>{item}</span>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button style={{ fontSize: 10, padding: "2px 6px", background: "#334155", border: "none", borderRadius: 4, color: "#fff", cursor: "pointer" }}>Equip</button>
                                <button style={{ fontSize: 10, padding: "2px 6px", background: "#0f172a", border: "1px solid #334155", borderRadius: 4, color: "#94a3b8", cursor: "pointer" }}>Sell</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                   {characterData && (
                     <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                       <button style={{
                         fontSize: 11,
                         padding: "6px 12px",
                         background: "#16a34a",
                         border: "none",
                         borderRadius: 6,
                         color: "#fff",
                         fontWeight: 600,
                         cursor: "pointer"
                       }}>
                         + Buy Item
                       </button>
                     </div>
                   )}
                </div>

              </div>
            ) : activeTab === "Quests" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 14,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Map
                  </h4>
                  <select
                    value={activeMap}
                    onChange={(e) => setActiveMap(e.target.value as MapId)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid rgba(51,65,85,1)",
                      background: "rgba(15,23,42,0.9)",
                      color: "#e5e7eb",
                      fontSize: 13,
                    }}
                  >
                    <option value="Quest Forest">Quest Forest</option>
                    <option value="Dungeon">Dungeon</option>
                    <option value="Arena">Arena</option>
                    <option value="Hunting Grounds">Hunting Grounds</option>
                  </select>
                </div>

                <div
                  style={{
                    background: "rgba(15,23,42,0.9)",
                    borderRadius: 12,
                    border: "1px solid rgba(51,65,85,1)",
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {activeMap === "Quest Forest" &&
                      "Quest Forest – Early-game quests and exploration."}
                    {activeMap === "Dungeon" &&
                      "Dungeon – Tighter spaces with tougher enemies."}
                    {activeMap === "Arena" &&
                      "Arena – PvP-style battleground placeholder."}
                    {activeMap === "Hunting Grounds" &&
                      "Hunting Grounds – AFK-style XP and loot zone."}
                  </div>
                  <div style={{ color: "#94a3b8" }}>
                    Enemies nearby: {enemiesNearby}
                  </div>
                </div>

                <div>
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 14,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Active Quests
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {quests.map((quest) => (
                      <div
                        key={quest.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: 12,
                          background: "rgba(30, 41, 59, 0.4)",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          borderRadius: 16,
                          backdropFilter: "blur(5px)",
                        }}
                      >
                        {/* Icon */}
                        <div
                          style={{
                            fontSize: 24,
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(15, 23, 42, 0.6)",
                            borderRadius: 12,
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                          }}
                        >
                          {quest.icon}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#f8fafc",
                              marginBottom: 2,
                            }}
                          >
                            {quest.title}
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>
                            {quest.desc}
                          </div>
                        </div>

                        {/* Reward */}
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#4ade80",
                            background: "rgba(74, 222, 128, 0.1)",
                            padding: "4px 8px",
                            borderRadius: 8,
                            border: "1px solid rgba(74, 222, 128, 0.2)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {quest.reward}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === "More" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: isDesktop ? "row" : "column",
                    gap: 8,
                  }}
                >
                  {["Guild", "Achievements", "Events", "Settings", "Help"].map(
                    (tab) => (
                      <button
                        key={tab}
                        onClick={() =>
                          setActiveSubTab(
                            tab as
                              | "Guild"
                              | "Achievements"
                              | "Events"
                              | "Settings"
                              | "Help"
                          )
                        }
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          borderRadius: 999,
                          border:
                            activeSubTab === tab
                              ? "1px solid rgba(59,130,246,1)"
                              : "1px solid rgba(51,65,85,1)",
                          background:
                            activeSubTab === tab
                              ? "rgba(37,99,235,0.25)"
                              : "rgba(15,23,42,0.9)",
                          color:
                            activeSubTab === tab ? "#e5f2ff" : "#cbd5f5",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          letterSpacing: 0.3,
                          textTransform: "uppercase",
                        }}
                      >
                        {tab}
                      </button>
                    )
                  )}
                </div>

                <div
                  style={{
                    background: "rgba(15,23,42,0.9)",
                    borderRadius: 12,
                    border: "1px solid rgba(51,65,85,1)",
                    padding: 16,
                    fontSize: 14,
                    color: "#e5e7eb",
                  }}
                >
                  {activeSubTab === "Guild" && "Guild info goes here"}
                  {activeSubTab === "Achievements" &&
                    "Achievements will appear here"}
                  {activeSubTab === "Events" && "Events / quests here"}
                  {activeSubTab === "Settings" && "Settings panel"}
                  {activeSubTab === "Help" && "Help / FAQ"}
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: 14,
                  color: "#94a3b8",
                  textAlign: "center",
                  padding: 40,
                }}
              >
                {activeTab} feature coming soon...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
