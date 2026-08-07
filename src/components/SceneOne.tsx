"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import TypingText from "./ui/TypingText";
import AnimatedButton from "./ui/AnimatedButton";
import { playHeartbeatSound, playWhooshSound, playSparkleSound, unlockAudioContext } from "@/lib/audio";

interface SceneOneProps {
  onComplete: () => void;
  setParticleMode: (mode: "normal" | "dissolve" | "explode") => void;
}

const loadingMessages = [
  "Loading something special...",
  "Collecting forgotten memories...",
  "Searching the happiest moments...",
  "Almost there...",
  "Just one more second..."
];

export default function SceneOne({ onComplete, setParticleMode }: SceneOneProps) {
  const [stage, setStage] = useState(0); // 0: Silent Black Screen, 1: Concentric Pulse Heartbeat, 2: Loading Messages, 3: HELLO Reveal, 4: Kavya & Narrative Reveal
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [showNarrative, setShowNarrative] = useState(false);
  
  const screenWrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadingTextRef = useRef<HTMLDivElement | null>(null);
  const helloContainerRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLHeadingElement | null>(null);
  const narrativeContainerRef = useRef<HTMLDivElement | null>(null);
  const nextBtnRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial 2.5s Complete Black Silence, then automatically progress to heartbeat pulse
  useEffect(() => {
    if (stage !== 0) return;
    setParticleMode("normal");
    
    const timer = setTimeout(() => {
      setStage(1);
    }, 2500);

    return () => clearTimeout(timer);
  }, [stage, setParticleMode]);

  // Global touch/click interaction handler to resume browser audio context seamlessly
  useEffect(() => {
    const unlockAudio = () => {
      try {
        unlockAudioContext();
        if (stage === 1) {
          playHeartbeatSound();
        }
      } catch (e) {
        console.warn("Unable to unlock AudioContext on tap", e);
      }
    };
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [stage]);

  // 2. Concentric Pulse Heartbeat (Stage 1) - Loops 3 times, syncs audio/visuals, vibrates screen
  useEffect(() => {
    if (stage !== 1) return;

    let thumpCount = 0;
    const maxThumps = 3;
    let timerId: NodeJS.Timeout;

    const performThump = () => {
      // Play audio thump
      playHeartbeatSound();

      // Cinematic screen vibration
      const wrapper = screenWrapperRef.current;
      if (wrapper) {
        gsap.fromTo(
          wrapper,
          { x: () => (Math.random() - 0.5) * 5, y: () => (Math.random() - 0.5) * 5 },
          { x: 0, y: 0, duration: 0.08, ease: "rough", repeat: 3 }
        );
      }

      thumpCount++;

      if (thumpCount >= maxThumps) {
        // Fade out and transition to loading stage
        timerId = setTimeout(() => {
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 1.0,
            ease: "power2.inOut",
            onComplete: () => {
              setStage(2);
              gsap.set(containerRef.current, { opacity: 1 });
            }
          });
        }, 1600);
      } else {
        // Loop next thump at the same 1.8s interval as CSS animations
        timerId = setTimeout(performThump, 1800);
      }
    };

    // First thump starts after a short 100ms delay to let render settle
    timerId = setTimeout(performThump, 100);

    return () => {
      clearTimeout(timerId);
    };
  }, [stage]);

  // 3. Sequential Loading Messages (Stage 2)
  useEffect(() => {
    if (stage !== 2) return;

    const el = loadingTextRef.current;
    if (!el) return;

    const triggerMessage = (idx: number) => {
      if (idx >= loadingMessages.length) {
        gsap.to(el, {
          opacity: 0,
          filter: "blur(12px)",
          y: -15,
          duration: 1.0,
          ease: "power4.in",
          onComplete: () => {
            setStage(3);
          }
        });
        return;
      }

      setLoadingIndex(idx);

      if (idx % 2 === 0) playWhooshSound();
      else playSparkleSound();

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.delayedCall(1.2, () => {
            gsap.to(el, {
              opacity: 0,
              filter: "blur(12px)",
              y: -10,
              duration: 0.6,
              ease: "power2.inOut",
              onComplete: () => {
                triggerMessage(idx + 1);
              }
            });
          });
        }
      });

      gsap.set(el, { opacity: 0, filter: "blur(10px)", y: 15 });

      tl.to(el, {
        opacity: 0.8,
        filter: "blur(0px)",
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      });
    };

    triggerMessage(0);
  }, [stage]);

  // 4. HELLO Split Text Fall Reveal (Stage 3)
  useEffect(() => {
    if (stage !== 3) return;

    const el = helloContainerRef.current;
    if (!el) return;

    gsap.set(el, { opacity: 1 });
    const letters = el.querySelectorAll(".hello-char");

    playSparkleSound();

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.delayedCall(0.5, () => {
          setStage(4);
        });
      }
    });

    tl.fromTo(letters,
      {
        y: -100,
        opacity: 0,
        filter: "blur(8px)",
        scaleY: 1.8
      },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        scaleY: 1,
        duration: 1.4,
        stagger: 0.08,
        ease: "power4.out"
      }
    );

    return () => {
      tl.kill();
    };
  }, [stage]);

  // 5. Majestic KAVYA & Auto Typing Reveal (Stage 4)
  useEffect(() => {
    if (stage !== 4) return;

    const nameNode = nameRef.current;
    if (!nameNode) return;

    playWhooshSound();

    gsap.set(nameNode, {
      opacity: 0,
      scale: 0.94,
      filter: "blur(18px)"
    });

    const tl = gsap.timeline({
      onComplete: () => {
        playSparkleSound();
        // Automatically start the sub narrative typing once title animations finish
        setShowNarrative(true);
      }
    });

    tl.to(nameNode, {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 2.8,
      ease: "power4.out"
    });

    return () => {
      tl.kill();
    };
  }, [stage]);

  // Transition click: Epic camera zoom and dissolve to Scene 2
  const handleContinue = () => {
    setParticleMode("dissolve");
    
    // Play sweep sound
    playWhooshSound();

    // Epic camera scale zoom-in and blur dissolve
    gsap.to(containerRef.current, {
      filter: "blur(25px)",
      opacity: 0,
      scale: 1.28,
      duration: 2.0,
      ease: "expo.out",
      onComplete: () => {
        onComplete();
      },
    });
  };

  return (
    <div
      ref={screenWrapperRef}
      className="w-full h-full min-h-dvh flex flex-col items-center justify-center bg-black overflow-hidden relative"
    >
      {/* Visual Ambient Lighting (Spotlight/Vignette) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(193,18,31,0.07)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(255,77,109,0.05)_0%,transparent_70%)] pointer-events-none blur-[40px]" />

      <div
        ref={containerRef}
        className="w-full max-w-4xl px-6 flex flex-col items-center justify-center text-center z-20 transform-gpu"
      >
        {/* Stage 1: Concentric Organic Pulse Heartbeat */}
        {stage === 1 && (
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Ambient background bloom */}
            <div className="absolute inset-0 bg-[#C1121F]/10 rounded-full blur-3xl" />
            
            {/* Concentric rings that expand outwards like waves */}
            <div className="absolute w-24 h-24 rounded-full border border-[#FF4D6D]/45 scale-[2.8] opacity-0 animate-heartbeat-ring" style={{ animationDelay: "0s" }} />
            <div className="absolute w-24 h-24 rounded-full border border-[#C1121F]/30 scale-[2.8] opacity-0 animate-heartbeat-ring" style={{ animationDelay: "0.16s" }} />

            {/* Central ruby light core */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#C1121F] shadow-[0_0_50px_15px_rgba(193,18,31,0.85)] animate-heartbeat-core" />
          </div>
        )}

        {/* Stage 2: Cinematic Loading Messages */}
        {stage === 2 && (
          <div
            ref={loadingTextRef}
            className="font-serif text-xl md:text-2xl font-light italic text-[rgba(250,250,250,0.85)] select-none tracking-wider drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
          >
            {loadingMessages[loadingIndex]}
          </div>
        )}

        {/* Stage 3 & 4: Split Text Hello & Kavya Reveal with unified Description */}
        {(stage === 3 || stage === 4) && (
          <div className="flex flex-col items-center select-none w-full animate-fade-in">
            {/* Falling split letters HELLO */}
            <div
              ref={helloContainerRef}
              className="font-sans text-4xl md:text-5xl font-extrabold tracking-[10px] text-white opacity-0 flex gap-1 justify-center mb-6"
            >
              {"HELLO".split("").map((char, index) => (
                <span key={index} className="hello-char inline-block">
                  {char}
                </span>
              ))}
            </div>

            {/* Glowing KAVYA Title */}
            {stage === 4 && (
              <h1
                ref={nameRef}
                className="font-serif text-6xl md:text-8xl lg:text-[7.5rem] tracking-widest uppercase bg-gradient-to-r from-[#C1121F] via-[#FAFAFA] to-[#C1121F] bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(193,18,31,0.55)] transform-gpu py-3 relative font-light select-none"
                style={{
                  fontFamily: "var(--font-bodoni-moda), serif",
                  fontWeight: 200,
                  letterSpacing: "0.22em",
                  backgroundSize: "200% auto",
                  animation: "title-pulse 4.5s ease-in-out infinite, shimmer-text 5s linear infinite",
                }}
              >
                KAVYA
              </h1>
            )}

            {/* Narrative Sub-card (Appearing under the name without disappearing) */}
            {showNarrative && (
              <div 
                ref={narrativeContainerRef}
                className="flex flex-col items-center justify-center max-w-2xl mt-12 transition-all duration-1000"
              >
                <div className="min-h-[120px] flex flex-col items-center justify-center mb-8">
                  <TypingText
                    text="I made something for you..."
                    fontType="serif"
                    className="text-2xl md:text-3xl text-[#FAFAFA] font-light italic mb-4"
                    speed={0.06}
                    delay={0.2}
                    onComplete={() => {
                      const subNode = document.getElementById("only-ready-text");
                      if (subNode) {
                        gsap.to(subNode, {
                          opacity: 0.7,
                          y: 0,
                          filter: "blur(0px)",
                          duration: 1.2,
                          ease: "power2.out",
                        });
                      }
                      if (nextBtnRef.current) {
                        gsap.to(nextBtnRef.current, {
                          opacity: 1,
                          y: 0,
                          duration: 1.2,
                          ease: "power3.out",
                          delay: 0.6,
                        });
                      }
                    }}
                  />

                  <p
                    id="only-ready-text"
                    className="font-sans text-xs md:text-sm tracking-[0.25em] text-[rgba(250,250,250,0.6)] uppercase font-light opacity-0 translate-y-3 blur-[2px] transition-all duration-700"
                  >
                    Only if you&apos;re ready.
                  </p>
                </div>

                <div ref={nextBtnRef} className="opacity-0 translate-y-4">
                  <AnimatedButton
                    variant="glass"
                    hoverType="continue"
                    onClick={handleContinue}
                  >
                    Continue →
                  </AnimatedButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes title-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 25px rgba(193, 18, 31, 0.4)) contrast(1);
          }
          50% {
            filter: drop-shadow(0 0 45px rgba(255, 77, 109, 0.75)) contrast(1.15);
          }
        }
        @keyframes shimmer-text {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes heartbeat-core {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 40px 10px rgba(193, 18, 31, 0.7);
          }
          14% {
            transform: scale(1.35);
            box-shadow: 0 0 60px 20px rgba(255, 77, 109, 0.95);
          }
          28% {
            transform: scale(1);
            box-shadow: 0 0 40px 10px rgba(193, 18, 31, 0.7);
          }
          42% {
            transform: scale(1.25);
            box-shadow: 0 0 55px 18px rgba(255, 77, 109, 0.9);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 40px 10px rgba(193, 18, 31, 0.6);
          }
        }
        @keyframes heartbeat-ring {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          100% {
            transform: scale(3.2);
            opacity: 0;
          }
        }
        .animate-heartbeat-core {
          animation: heartbeat-core 1.8s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }
        .animate-heartbeat-ring {
          animation: heartbeat-ring 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
      `}</style>
    </div>
  );
}
