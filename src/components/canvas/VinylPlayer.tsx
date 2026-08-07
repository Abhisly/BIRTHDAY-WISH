"use client";

import React from "react";
import Image from "next/image";

interface VinylPlayerProps {
  isPlaying: boolean;
}

export default function VinylPlayer({ isPlaying }: VinylPlayerProps) {
  return (
    <div className="relative w-64 h-64 md:w-[380px] md:h-[380px] flex items-center justify-center select-none group">
      {/* Glossy 3D Reflection overlay/lighting glow */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/50 via-transparent to-white/15 pointer-events-none z-10 mix-blend-overlay" 
      />
      
      {/* Outer ambient red glow breathing behind the disk */}
      <div 
        className={`absolute inset-[-20px] rounded-full bg-[#C1121F]/20 blur-[50px] transition-all duration-1000 vinyl-ambient-glow ${
          isPlaying ? "opacity-100 scale-110" : "opacity-40 scale-100"
        }`} 
      />

      {/* Rotating Vinyl Record Disk - Masked into a perfect circle */}
      <div 
        className={`w-full h-full rounded-full overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.85)] relative transform-gpu transition-all duration-1000 vinyl-disk ${
          isPlaying ? "animate-spin-slow-active" : "animate-spin-slow"
        }`}
        style={{
          boxShadow: isPlaying 
            ? "0 0 50px 10px rgba(193, 18, 31, 0.45), 0 0 100px 30px rgba(0, 0, 0, 0.9)" 
            : "0 0 40px 5px rgba(0, 0, 0, 0.8)"
        }}
      >
        {/* The AVIF red vinyl image */}
        <Image 
          src="/DISK/red-vinyl-record-isolated-white-background_118047-14959.avif" 
          alt="Red Vinyl Record" 
          width={380}
          height={380}
          className="w-full h-full object-cover scale-[1.38] pointer-events-none"
          priority
        />

        {/* Center ruby glow overlay that expands and grows brighter during transition */}
        <div
          className="absolute inset-0 m-auto w-32 h-32 rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#C1121F] opacity-0 blur-md pointer-events-none mix-blend-screen vinyl-center-glow"
          style={{
            boxShadow: "0 0 40px 15px rgba(255, 77, 109, 0.8)",
          }}
        />

        {/* Vinyl sheen reflection tracks */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(255,255,255,0.06)_48%,transparent_58%)] pointer-events-none mix-blend-overlay" />
      </div>

      {/* Spindle center pin hole to add realistic depth and finish */}
      <div className="absolute w-5 h-5 rounded-full bg-[#151515] border border-zinc-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] z-20 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
      </div>

      <style jsx>{`
        :global(.animate-spin-slow) {
          animation: spin-anim 20s linear infinite;
        }
        :global(.animate-spin-slow-active) {
          animation: spin-anim 2.8s linear infinite;
        }
        @keyframes spin-anim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
