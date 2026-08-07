"use client";

import React, { useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import { playTypewriterSound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface TypingTextProps {
  text: string;
  speed?: number; // Time in seconds between character reveals
  delay?: number; // Delay in seconds before starting animation
  className?: string;
  fontType?: "serif" | "sans" | "signature";
  onComplete?: () => void;
  trigger?: boolean; // Control whether to start typing immediately or wait for trigger
}

export default function TypingText({
  text,
  speed = 0.08,
  delay = 0.5,
  className,
  fontType = "sans",
  onComplete,
  trigger = true,
}: TypingTextProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const chars = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    if (!trigger) return;

    const charElements = charRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (charElements.length === 0) return;

    // Reset initial hidden state (prevent layout shifts)
    gsap.set(charElements, {
      opacity: 0,
      y: 10,
      filter: "blur(4px)",
    });

    const tl = gsap.timeline({
      delay: delay,
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    chars.forEach((char, index) => {
      const element = charRefs.current[index];
      if (!element) return;

      tl.to(
        element,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.15,
          ease: "power1.out",
          onStart: () => {
            // Only play typing clack for non-whitespace characters to sound natural
            if (char !== " " && char !== "\n") {
              playTypewriterSound();
            }
          },
        },
        index * speed
      );
    });

    return () => {
      tl.kill();
    };
  }, [text, speed, delay, trigger, onComplete, chars]);

  const fontClasses = {
    sans: "font-sans",
    serif: "font-serif italic",
    signature: "font-signature tracking-normal text-3xl md:text-5xl lowercase",
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "inline-flex flex-wrap justify-center items-center gap-x-[0.15em] leading-relaxed",
        fontClasses[fontType],
        className
      )}
    >
      {chars.map((char, index) => {
        // Render Linebreaks properly
        if (char === "\n") {
          return <div key={index} className="w-full h-0" />;
        }

        return (
          <span
            key={index}
            ref={(el) => {
              charRefs.current[index] = el;
            }}
            className="inline-block opacity-0 transform-gpu select-none"
            style={{ whiteSpace: char === " " ? "pre" : "normal" }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}
