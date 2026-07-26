"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { useRef, useMemo, useCallback } from "react";
import * as THREE from "three";

function AuroraMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<any>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(t * 0.15) * 0.2;
      meshRef.current.rotation.y = t * 0.08;
    }
    if (materialRef.current) {
      materialRef.current.distort = 0.3 + Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} scale={2.2}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          ref={materialRef}
          color="#6c5ce7"
          emissive="#4ecdc4"
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.1}
          distort={0.3}
          speed={2}
          wireframe
        />
      </mesh>
      <mesh scale={2.0}>
        <icosahedronGeometry args={[1, 3]} />
        <MeshDistortMaterial
          color="#a29bfe"
          emissive="#e8a0bf"
          emissiveIntensity={0.1}
          roughness={0.5}
          metalness={0.05}
          distort={0.2}
          speed={1.5}
          transparent
          opacity={0.3}
        />
      </mesh>
    </Float>
  );
}

function Particles({ count = 80 }: { count?: number }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  const sizes = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      s[i] = Math.random() * 0.03 + 0.01;
    }
    return s;
  }, [count]);

  const ref = useRef<THREE.Points>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y = t * 0.02;
      ref.current.rotation.x = Math.sin(t * 0.1) * 0.05;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#a29bfe"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function MouseLight() {
  const lightRef = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(t * 0.3) * 3;
      lightRef.current.position.y = Math.cos(t * 0.2) * 2 + 1;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      color="#4ecdc4"
      intensity={2}
      distance={10}
      decay={2}
    />
  );
}

export default function AuroraScene({
  className = "",
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3 * intensity} color="#b8a9e8" />
        <directionalLight
          position={[3, 4, 5]}
          intensity={0.6 * intensity}
          color="#6c5ce7"
        />
        <pointLight
          position={[-3, 2, 3]}
          intensity={0.4 * intensity}
          color="#e8a0bf"
          distance={10}
          decay={2}
        />
        <MouseLight />
        <AuroraMesh />
        <Particles count={60} />
      </Canvas>
    </div>
  );
}
