"use client";

import React, { useEffect, useRef } from "react";

interface BackgroundParticlesProps {
  mode?: "normal" | "dissolve" | "explode";
  onExplodeComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  density: number; // For mouse interaction physics
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export default function BackgroundParticles({
  mode = "normal",
  onExplodeComplete,
}: BackgroundParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 150 });
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const explosionTriggeredRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      const particles: Particle[] = [];
      // Adjust density based on screen size
      const numberOfParticles = Math.min(
        150,
        Math.floor((canvas.width * canvas.height) / 12000)
      );

      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size: Math.random() * 2 + 0.5,
          density: Math.random() * 30 + 10,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          alpha: Math.random() * 0.5 + 0.1,
          color: Math.random() > 0.85 ? "#C1121F" : "#FAFAFA", // 15% cherry red, 85% ivory white
        });
      }
      particlesRef.current = particles;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Handle normal/dissolve/explode states
      if (mode === "explode" && !explosionTriggeredRef.current) {
        explosionTriggeredRef.current = true;
        // Explode particles outwards from center
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Spawn 200 new glowing gold/red explosion particles
        const newExplosionParticles: Particle[] = [];
        for (let i = 0; i < 250; i++) {
          const angle = Math.random() * Math.PI * 2;
          const force = Math.random() * 15 + 2; // high speed
          newExplosionParticles.push({
            x: centerX,
            y: centerY,
            baseX: centerX,
            baseY: centerY,
            size: Math.random() * 4 + 1,
            density: 1,
            vx: Math.cos(angle) * force,
            vy: Math.sin(angle) * force,
            alpha: 1.0,
            color: Math.random() > 0.5 ? "#F4C542" : "#FF4D6D", // Gold & Rose explosion
          });
        }
        particlesRef.current = [...particles, ...newExplosionParticles];
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (mode === "normal") {
          // Ambient float
          p.x += p.vx;
          p.y += p.vy;

          // Boundary checks for normal drift
          if (p.x < 0 || p.x > canvas.width) p.vx = -p.vx;
          if (p.y < 0 || p.y > canvas.height) p.vy = -p.vy;

          // Update base coordinate reference
          p.baseX += p.vx;
          p.baseY += p.vy;

          // Mouse physics (repulsion with elastic return)
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const maxDistance = mouse.radius;
            // The closer the mouse, the stronger the force
            const force = (maxDistance - distance) / maxDistance;
            const directionX = forceDirectionX * force * p.density * 0.4;
            const directionY = forceDirectionY * force * p.density * 0.4;

            p.x -= directionX;
            p.y -= directionY;
          } else {
            // Elastic return back to its original drift trajectory
            if (p.x !== p.baseX) {
              const dxBase = p.x - p.baseX;
              p.x -= dxBase * 0.05;
            }
            if (p.y !== p.baseY) {
              const dyBase = p.y - p.baseY;
              p.y -= dyBase * 0.05;
            }
          }
        } else if (mode === "dissolve") {
          // Accelerate outward, fade out
          p.x += p.vx * 3;
          p.y += p.vy * 3;
          p.alpha -= 0.01;
          p.size *= 0.98;
        } else if (mode === "explode") {
          // Explosion physics: particles travel fast with high friction deceleration
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.alpha -= 0.005;
          // Exploding particles grow and bloom visually
          p.size *= 1.01;
        }

        // Draw particle
        if (p.alpha > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          
          // Add glow to special particles
          if (p.color !== "#FAFAFA") {
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        }
      }

      ctx.shadowBlur = 0; // Reset shadow glow
      ctx.globalAlpha = 1.0;

      // Filter out dead particles
      particlesRef.current = particles.filter((p) => p.alpha > 0);

      // Trigger transition callback when all exploded particles fade
      if (mode === "explode" && particlesRef.current.length === 0 && onExplodeComplete) {
        onExplodeComplete();
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mode, onExplodeComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
