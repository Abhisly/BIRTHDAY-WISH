"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import VinylPlayer from "./canvas/VinylPlayer";
import AnimatedButton from "./ui/AnimatedButton";
import { musicManager, unlockAudioContext } from "@/lib/audio";

interface SceneTwoProps {
  onComplete: () => void;
  setParticleMode: (mode: "normal" | "dissolve" | "explode") => void;
}

interface OrbitParticle {
  angle: number;
  radius: number;
  angularSpeed: number;
  radialSpeed: number;
  size: number;
  alpha: number;
  color: string;
  phase: "orbit" | "disperse";
}

export default function SceneTwo({ onComplete, setParticleMode }: SceneTwoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState(0); // 0: Init, 1: Playing, 2: Let's begin
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const textGroupRef = useRef<HTMLDivElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const transitionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const blackOverlayRef = useRef<HTMLDivElement | null>(null);

  // Fade in on mount
  useEffect(() => {
    setParticleMode("normal");
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 1.5, ease: "power3.out" }
    );
  }, [setParticleMode]);

  // Handle Play Music Click
  const handlePlayMusic = () => {
    unlockAudioContext();
    musicManager.playCdMusic(); // Start audio synchronously on user click
    setIsLoading(true);
    setTimeout(() => {
      setIsPlaying(true);
      setIsLoading(false);

      gsap.to(textGroupRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          setStage(1);
          gsap.fromTo(
            textGroupRef.current,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.8 }
          );
        },
      });
    }, 1800);
  };

  // Transition stage 1 to stage 2
  useEffect(() => {
    if (stage !== 1) return;
    const timer = setTimeout(() => {
      gsap.to(textGroupRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          setStage(2);
          gsap.fromTo(
            textGroupRef.current,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.8 }
          );
        },
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, [stage]);

  // Epic Transition to Scene 3
  const handleFinalContinue = () => {
    setIsTransitioning(true);
    
    // Swell music volume for build-up
    musicManager.setVolume(1.0);

    // 1. Hide narrative text and button
    gsap.to(textGroupRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.6,
      ease: "power2.inOut",
    });

    // 2. Animate Vinyl Disk Center Glow to grow & brighten
    const centerGlow = containerRef.current?.querySelector(".vinyl-center-glow");
    if (centerGlow) {
      gsap.to(centerGlow, {
        opacity: 1,
        scale: 4.5,
        duration: 2.2,
        ease: "power3.inOut",
      });
    }

    // 3. Spreading ambient lighting
    const ambientGlow = containerRef.current?.querySelector(".vinyl-ambient-glow");
    if (ambientGlow) {
      gsap.to(ambientGlow, {
        scale: 2.2,
        opacity: 1,
        duration: 2.5,
        ease: "power3.out",
      });
    }

    // 4. Setup Canvas Particles
    const canvas = transitionCanvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    gsap.to(canvas, { opacity: 1, duration: 0.5 });

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get exact center of vinyl record
    const rect = playerWrapperRef.current?.getBoundingClientRect();
    const cX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    const particles: OrbitParticle[] = [];
    const numParticles = 400;

    // Initialize particles clustered near record center
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 80 + 20; // Starting ring positions
      particles.push({
        angle,
        radius,
        angularSpeed: (Math.random() * 0.05 + 0.02) * (Math.random() > 0.5 ? 1 : -1),
        radialSpeed: Math.random() * 1.5 + 0.5,
        size: Math.random() * 2.2 + 0.8,
        alpha: Math.random() * 0.8 + 0.2,
        color: Math.random() > 0.65 ? "#C1121F" : Math.random() > 0.5 ? "#FF4D6D" : "#F4C542", // Red, rose, and gold accents
        phase: "orbit",
      });
    }

    let frameId: number;
    const transitionStartTime = Date.now();
    let disperseTriggered = false;

    // Particle Animation Loop
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - transitionStartTime;

      // After 1.6s, disperse particles and start dissolving record
      if (elapsed > 1600 && !disperseTriggered) {
        disperseTriggered = true;
        
        // Dissolve background ambient particles
        setParticleMode("dissolve");

        // Scale & zoom into the record center, then blur and fade
        gsap.to(playerWrapperRef.current, {
          scale: 2.8,
          filter: "blur(22px)",
          opacity: 0,
          duration: 1.8,
          ease: "power2.inOut",
        });

        // Disperse orbiting particles across the screen
        particles.forEach((p) => {
          p.phase = "disperse";
          p.radialSpeed = Math.random() * 14 + 6; // disperse velocity burst
        });

        // Fade music out completely as record dissolves
        musicManager.fadeOutAndStop(1800);

        // Fade in pure black overlay
        gsap.to(blackOverlayRef.current, {
          opacity: 1,
          duration: 1.8,
          ease: "power2.inOut",
        });
      }

      let allDead = true;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.phase === "orbit") {
          p.angle += p.angularSpeed;
          p.radius += (Math.random() - 0.5) * 0.5; // slight noise jitter
          // Keep clustered near center but allow slow breathing expansion
          if (p.radius < 180) {
            p.radius += 0.25;
          }
        } else {
          // Disperse phase: swirl rapidly outwards and dissolve
          p.angle += p.angularSpeed * 2.8;
          p.radius += p.radialSpeed;
          p.alpha -= 0.008;
          p.size *= 0.99;
        }

        if (p.alpha > 0) {
          allDead = false;

          // Convert polar to cartesian coordinates relative to record center
          const x = cX + Math.cos(p.angle) * p.radius;
          const y = cY + Math.sin(p.angle) * p.radius;

          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;

          if (p.color !== "#C1121F") {
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;

      if (!allDead) {
        frameId = requestAnimationFrame(drawParticles);
      } else {
        // Complete transition: silence for exactly 0.8 seconds
        setTimeout(() => {
          onComplete();
        }, 800);
      }
    };

    drawParticles();

    return () => {
      cancelAnimationFrame(frameId);
    };
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-dvh flex flex-col items-center justify-between bg-black text-[#FAFAFA] relative overflow-hidden pt-4 pb-8 md:py-12 px-6"
    >
      {/* Local Orbit Transition Canvas */}
      <canvas
        ref={transitionCanvasRef}
        className="fixed inset-0 pointer-events-none z-30 opacity-0"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Full screen solid black transition overlay */}
      <div
        ref={blackOverlayRef}
        className="fixed inset-0 bg-[#050505] opacity-0 z-40 pointer-events-none"
      />

      {/* 3D Vinyl Player Container */}
      <div
        ref={playerWrapperRef}
        className="w-full max-w-2xl flex-1 flex items-center justify-center transform-gpu"
      >
        <VinylPlayer isPlaying={isPlaying} isTransitioning={isTransitioning} />
      </div>

      {/* Controls & Narrative Text */}
      <div
        ref={textGroupRef}
        className="w-full max-w-lg flex flex-col items-center text-center justify-center min-h-[130px] md:min-h-[160px] z-20 select-none"
      >
        {stage === 0 && (
          <>
            <h2 className="font-serif text-2xl md:text-3.5xl font-light italic text-[#FAFAFA] mb-2">
              This surprise is better with music.
            </h2>
            <p className="font-sans text-xs md:text-sm tracking-[0.25em] text-[rgba(250,250,250,0.5)] uppercase font-light mb-4 md:mb-8">
              Please press Play.
            </p>
            <AnimatedButton
              variant={isLoading ? "glass" : "gold"}
              hoverType={isLoading ? undefined : "play"}
              onClick={isLoading ? undefined : handlePlayMusic}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-[#FF4D6D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Reading Disc...
                </span>
              ) : (
                "▶ Play Music"
              )}
            </AnimatedButton>
          </>
        )}

        {stage === 1 && (
          <h2 className="font-serif text-3xl md:text-4.5xl font-extralight tracking-wide italic text-[#FAFAFA]">
            Perfect...
          </h2>
        )}

        {stage === 2 && (
          <div className="flex flex-col items-center">
            <h2 className="font-serif text-2xl md:text-3.5xl font-light italic text-[#FAFAFA] mb-4 md:mb-6">
              Let&apos;s begin.
            </h2>
            <AnimatedButton
              variant="cherry"
              hoverType="continue"
              onClick={isTransitioning ? undefined : handleFinalContinue}
              disabled={isTransitioning}
            >
              Continue →
            </AnimatedButton>
          </div>
        )}
      </div>
    </div>
  );
}
