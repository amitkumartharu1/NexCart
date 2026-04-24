"use client";

import { Suspense, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, PresentationControls } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import Link from "next/link";

// ---------------------------------------------------------------------------
// GLB Model Viewer
// ---------------------------------------------------------------------------

function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={1.8}
      position={[0, -1, 0]}
    />
  );
}

// Fallback spinning box when no model URL
function SpinningBox() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.x += delta * 0.5;
    ref.current.rotation.y += delta * 0.8;
  });
  return (
    <mesh ref={ref} scale={1.5}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

// Floating particles
function Particles({ count = 60 }: { count?: number }) {
  const positions = new Float32Array(
    Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * 8)
  );
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#a78bfa" transparent opacity={0.6} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// ThreeDShowcaseSection
// ---------------------------------------------------------------------------

interface Props {
  title?: string | null;
  subtitle?: string | null;
  assetUrl?: string | null;
  assetType?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  ctaStyle?: string | null;
  mode: "static" | "3d" | "4d";
  settings?: Record<string, unknown> | null;
}

export function ThreeDShowcaseSection({ title, subtitle, assetUrl, assetType, ctaText, ctaUrl, ctaStyle }: Props) {
  const isModel = assetType === "model3d" && assetUrl;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        minHeight: 480,
        background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)",
      }}
    >
      {/* Neon glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }} />

      {/* Three.js Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-5, 5, -5]} intensity={0.8} color="#6366f1" />
          <pointLight position={[5, -5, 5]} intensity={0.6} color="#ec4899" />

          <Suspense fallback={null}>
            <PresentationControls
              global
              snap
              zoom={0.8}
              rotation={[0, -Math.PI / 4, 0]}
              polar={[-Math.PI / 4, Math.PI / 4]}
              azimuth={[-Math.PI / 4, Math.PI / 4]}
            >
              {isModel ? <GLBModel url={assetUrl!} /> : <SpinningBox />}
            </PresentationControls>

            <Environment preset="city" />
            <ContactShadows
              position={[0, -2, 0]}
              opacity={0.4}
              scale={8}
              blur={2}
              far={4}
              color="#1a1a2e"
            />
            <Particles />
          </Suspense>

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI * 0.75}
          />
        </Canvas>
      </div>

      {/* Text overlay — bottom-left glassmorphism panel */}
      {(title || subtitle || ctaText) && (
        <div className="absolute bottom-6 left-6 right-6 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-6 backdrop-blur-xl border border-white/10"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            {title && (
              <h3 className="text-2xl font-black text-white mb-1">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-white/60 mb-4">{subtitle}</p>
            )}
            {ctaText && ctaUrl && (
              <Link
                href={ctaUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 0 20px rgba(99,102,241,0.5)",
                }}
              >
                {ctaText}
              </Link>
            )}
          </motion.div>
        </div>
      )}

      {/* "Drag to rotate" hint */}
      <div className="absolute top-4 right-4 z-10">
        <span className="text-xs text-white/40 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
          Drag to rotate
        </span>
      </div>
    </div>
  );
}
