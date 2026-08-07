"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function CursorGlow() {
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Hide default system cursor on the document body
    document.body.style.cursor = "none";
    
    const dot = cursorDotRef.current;
    if (!dot) return;

    // Set initial position
    gsap.set(dot, { xPercent: -50, yPercent: -50, scale: 1 });

    const xDotTo = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3.out" });
    const yDotTo = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3.out" });

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      xDotTo(e.clientX);
      yDotTo(e.clientY);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const hoverType = target.closest("[data-hover]");
      if (hoverType) {
        gsap.to(dot, {
          scale: 2.2,
          backgroundColor: "#FF4D6D", // Rose glow hover color
          boxShadow: "0 0 15px rgba(255, 77, 109, 0.8)",
          duration: 0.25,
        });
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const hoverType = target.closest("[data-hover]");
      if (hoverType) {
        gsap.to(dot, {
          scale: 1,
          backgroundColor: "#C1121F", // Cherry Red center
          boxShadow: "none",
          duration: 0.25,
        });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseOver);
    window.addEventListener("mouseout", onMouseOut);

    return () => {
      document.body.style.cursor = "auto";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mouseout", onMouseOut);
    };
  }, [isVisible]);

  return (
    <div
      ref={cursorDotRef}
      className={`fixed top-0 left-0 w-2.5 h-2.5 bg-[#C1121F] rounded-full pointer-events-none z-50 transition-opacity duration-300 hidden md:block ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
