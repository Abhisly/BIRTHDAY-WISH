"use client";

import React, { useState } from "react";
import SceneOne from "@/components/SceneOne";
import SceneTwo from "@/components/SceneTwo";
import SceneThree from "@/components/SceneThree";
import BackgroundParticles from "@/components/effects/BackgroundParticles";
import CursorGlow from "@/components/effects/CursorGlow";
import SceneFour from "@/components/SceneFour";
import SceneFive from "@/components/SceneFive";

export default function Home() {
  const [scene, setScene] = useState(1);
  const [particleMode, setParticleMode] = useState<"normal" | "dissolve" | "explode">("normal");

  return (
    <main className="relative w-full h-full min-h-dvh bg-[#050505] overflow-hidden select-none">
      {/* 1. Interactive Background Particles */}
      <BackgroundParticles
        mode={particleMode}
        onExplodeComplete={() => {
          // Callback from particle system when explosion completes
        }}
      />

      {/* 2. Premium Cinematic SVG Noise Texture Overlay */}
      <div className="noise-overlay" />

      {/* 3. Custom Physics-based Cursor Tracking */}
      <CursorGlow />

      {/* 4. Scene Mount Controller */}
      <div className="relative w-full h-full min-h-dvh z-20">
        {scene === 1 && (
          <SceneOne
            setParticleMode={setParticleMode}
            onComplete={() => {
              setScene(2);
            }}
          />
        )}

        {scene === 2 && (
          <SceneTwo
            setParticleMode={setParticleMode}
            onComplete={() => {
              setScene(3);
            }}
          />
        )}

        {scene === 3 && (
          <SceneThree onComplete={() => setScene(4)} />
        )}

        {scene === 4 && (
          <SceneFour onComplete={() => setScene(5)} />
        )}

        {scene === 5 && (
          <SceneFive />
        )}
      </div>

      {/* Local custom styles for noise and final animation states */}
      <style jsx>{`
        .noise-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.015;
          pointer-events: none;
          z-index: 35;
          mix-blend-mode: overlay;
        }
        @keyframes whiteout-lock {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
