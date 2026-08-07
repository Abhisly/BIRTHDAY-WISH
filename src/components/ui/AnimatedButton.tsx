"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "cherry" | "gold" | "glass";
  hoverType?: "play" | "continue" | "magnetic";
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export default function AnimatedButton({
  children,
  variant = "glass",
  hoverType = "magnetic",
  className,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleCounter = useRef(0);

  // Magnetic Hover effect
  useEffect(() => {
    const container = containerRef.current;
    const button = buttonRef.current;
    if (!container || !button) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Calculate relative cursor position from container center
      const centerX = rect.left + width / 2;
      const centerY = rect.top + height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // Max magnetic pull distance (in pixels)
      const pullStrength = 15;

      // Translate the button slightly towards the cursor using GSAP
      gsap.to(button, {
        x: (dx / (width / 2)) * pullStrength,
        y: (dy / (height / 2)) * pullStrength,
        scale: 1.05,
        ease: "power2.out",
        duration: 0.4,
      });

      // Animate shadow glow intensity based on closeness to center
      // Animate shadow glow intensity based on closeness to center
      if (variant === "cherry" || variant === "gold") {
        gsap.to(button, { boxShadow: "0 0 25px rgba(193, 18, 31, 0.45)" });
      } else {
        gsap.to(button, { boxShadow: "0 0 25px rgba(250, 250, 250, 0.15)" });
      }
    };

    const handleMouseLeave = () => {
      // Return button back to center
      gsap.to(button, {
        x: 0,
        y: 0,
        scale: 1,
        boxShadow: "0 0 0px rgba(0, 0, 0, 0)",
        ease: "elastic.out(1, 0.3)",
        duration: 0.8,
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [variant]);

  // Click Ripple Handler
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.5;

    const newRipple: Ripple = {
      id: rippleCounter.current++,
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Fire the original onClick callback
    if (onClick) onClick(e);
  };

  // Clean up ripples after their animation ends
  useEffect(() => {
    if (ripples.length === 0) return;
    const timer = setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 600);
    return () => clearTimeout(timer);
  }, [ripples]);

  // Base styling for glassmorphic elements
  const variantStyles = {
    glass: "glassmorphism hover:border-glow-rose text-[#FAFAFA]",
    cherry: "bg-[#C1121F] border border-[#FF4D6D] hover:bg-[#a00f1a] text-[#FAFAFA]",
    gold: "bg-transparent border border-[#C1121F]/70 text-[#FAFAFA] hover:bg-[#C1121F]/10 hover:border-[#FF4D6D] hover:shadow-[0_0_20px_rgba(193,18,31,0.3)]",
  };

  return (
    <div
      ref={containerRef}
      className="inline-flex items-center justify-center p-8 -m-8" // Invisible hover boundary buffer
    >
      <button
        ref={buttonRef}
        data-hover={hoverType}
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden px-10 py-4.5 md:px-14 md:py-5.5 rounded-full font-sans text-sm md:text-base font-bold tracking-[0.25em] uppercase transition-all duration-300 select-none",
          variantStyles[variant],
          className
        )}
        style={{ transformStyle: "preserve-3d" }}
        {...props}
      >
        {/* Button Content */}
        <span className="relative z-10 flex items-center justify-center gap-2 pointer-events-none">
          {children}
        </span>

        {/* Ripple Overlays */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute bg-white/20 rounded-full animate-ripple pointer-events-none"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}

        {/* Gloss Shimmer Reflection Layer */}
        <span className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:animate-shimmer" />
      </button>
      
      {/* Dynamic Ripple Keyframes embedded locally */}
      <style jsx global>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .hover\:animate-shimmer:hover {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
