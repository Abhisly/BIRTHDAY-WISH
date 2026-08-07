"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { musicManager, playCountdownBeep } from "@/lib/audio";

interface SceneThreeProps {
  onComplete?: () => void;
}

/* No reveal chime — music starts instead */

export default function SceneThree({ onComplete }: SceneThreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [showBalloons, setShowBalloons] = useState(false);
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [isListeningForBlow, setIsListeningForBlow] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);

  /* Countdown refs */
  const n3Ref   = useRef<HTMLDivElement>(null);
  const n2Ref   = useRef<HTMLDivElement>(null);
  const n1Ref   = useRef<HTMLDivElement>(null);

  /* Reveal refs */
  const revealRef   = useRef<HTMLDivElement>(null);
  const glowRef     = useRef<HTMLDivElement>(null);
  const happyRef    = useRef<HTMLDivElement>(null);
  const birthdayRef = useRef<HTMLDivElement>(null);
  const kavyaRef    = useRef<HTMLHeadingElement>(null);
  const subRef      = useRef<HTMLDivElement>(null);

  /* Cake refs */
  const cakeRef  = useRef<HTMLDivElement>(null);

  /* Configs for canvas */
  const cfg = useRef({ petals: false, stars: false, smoke: false, wicks: [] as {x:number;y:number}[] });

  /* ─── Canvas particle engine ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    interface P {
      type: "dust"|"petal"|"star"|"smoke";
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; angle?: number; spin?: number; fade?: number; color?: string;
    }
    const ps: P[] = [];

    /* seed ambient dust */
    for (let i = 0; i < 60; i++) ps.push({
      type:"dust", x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight,
      vx:(Math.random()-0.5)*0.15, vy:-Math.random()*0.2-0.05,
      size:Math.random()*1.5+0.3, alpha:Math.random()*0.3+0.06,
      color: Math.random()>0.8?"#C1121F":"#fff"
    });

    let raf: number;
    const loop = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);

      /* spawn petals */
      if (cfg.current.petals && Math.random()<0.04) ps.push({
        type:"petal", x:Math.random()*canvas.width, y:-15,
        vx:(Math.random()-0.5)*0.6, vy:Math.random()*0.55+0.3,
        size:Math.random()*7+4, alpha:Math.random()*0.6+0.3,
        angle:Math.random()*Math.PI*2, spin:Math.random()*0.02+0.005
      });

      /* spawn stars */
      if (cfg.current.stars && Math.random()<0.18) ps.push({
        type:"star", x:Math.random()*canvas.width, y:Math.random()*canvas.height,
        vx:0, vy:0, size:Math.random()*2.5+0.5, alpha:1,
        fade:Math.random()*0.014+0.005, color:Math.random()>0.5?"#F4C542":"#fff"
      });

      /* no smoke/ember spawn - canvas fades with the scene */

      for (let i = ps.length-1; i>=0; i--) {
        const p = ps[i];
        if (p.type==="dust") {
          p.x+=p.vx; p.y+=p.vy;
          if (p.y<-5) p.y=canvas.height+5;
          if (p.x<-5||p.x>canvas.width+5) p.vx=-p.vx;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
          ctx.fillStyle=p.color||"#fff"; ctx.globalAlpha=p.alpha; ctx.fill();
        } else if (p.type==="petal") {
          p.x+=p.vx+Math.sin(p.y*0.013)*0.5; p.y+=p.vy;
          p.angle!+=p.spin!;
          ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle!);
          ctx.beginPath(); ctx.ellipse(0,0,p.size,p.size*0.5,0,0,Math.PI*2);
          ctx.fillStyle="#C1121F"; ctx.globalAlpha=p.alpha*0.85;
          ctx.shadowBlur=6; ctx.shadowColor="#FF4D6D"; ctx.fill(); ctx.restore();
          if (p.y>canvas.height+20) ps.splice(i,1);
        } else if (p.type==="star") {
          p.alpha-=p.fade!;
          if (p.alpha<=0){ps.splice(i,1);continue;}
          ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
          ctx.fillStyle=p.color||"#F4C542"; ctx.globalAlpha=p.alpha;
          ctx.shadowBlur=10; ctx.shadowColor=p.color||"#F4C542"; ctx.fill();
        } else if (p.type==="smoke") {
          p.x += p.vx + Math.sin(p.y * 0.03) * 0.6;
          p.y += p.vy;
          // Gravity effect — larger particles slow down
          p.vy += 0.04;
          p.alpha -= 0.012;
          if (p.alpha<=0){ps.splice(i,1);continue;}
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
          ctx.fillStyle = p.color||"#F4C542";
          ctx.globalAlpha = p.alpha;
          ctx.shadowBlur = p.size * 5;
          ctx.shadowColor = p.color||"#F4C542";
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.shadowBlur=0; ctx.globalAlpha=1;
      raf=requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener("resize",resize); cancelAnimationFrame(raf); };
  }, []);

  /* ─── Update smoke wick positions ─── */
  const updateWicks = () => {
    const el = cakeRef.current;
    if (!el||!cfg.current.smoke) return;
    const r = el.getBoundingClientRect();
    const sx = r.width/400, sy = r.height/320;
    cfg.current.wicks = [
      {x:r.left+152*sx, y:r.top+58*sy},
      {x:r.left+200*sx, y:r.top+42*sy},
      {x:r.left+248*sx, y:r.top+58*sy},
    ];
  };

  /* ─── Main GSAP timeline ─── */
  useEffect(() => {
    const tl = gsap.timeline({ defaults:{ ease:"power3.out" } });

    /* ── COUNTDOWN 3 ── (immediate, tight) */
    tl.add(() => playCountdownBeep(200))
      .fromTo(n3Ref.current,
        { opacity:0, scale:0.7, filter:"blur(16px)" },
        { opacity:1, scale:1,   filter:"blur(0px)", duration:0.5 }
      )
      .to(n3Ref.current, { scale:1.08, duration:0.9, ease:"none" })
      .to(n3Ref.current, { opacity:0, scale:1.3, filter:"blur(14px)", duration:0.4, ease:"power2.in" });

    /* ── COUNTDOWN 2 ── */
    tl.add(() => playCountdownBeep(240))
      .fromTo(n2Ref.current,
        { opacity:0, scale:0.7, filter:"blur(16px)" },
        { opacity:1, scale:1,   filter:"blur(0px)", duration:0.5 }
      )
      .to(n2Ref.current, { scale:1.08, duration:0.9, ease:"none" })
      .to(n2Ref.current, { opacity:0, scale:1.3, filter:"blur(14px)", duration:0.4, ease:"power2.in" });

    /* ── COUNTDOWN 1 ── */
    tl.add(() => playCountdownBeep(280))
      .fromTo(n1Ref.current,
        { opacity:0, scale:0.7, filter:"blur(16px)" },
        { opacity:1, scale:1,   filter:"blur(0px)", duration:0.5 }
      )
      .to(n1Ref.current, { scale:1.08, duration:0.9, ease:"none" })
      .to(n1Ref.current, { opacity:0, scale:1.3, filter:"blur(14px)", duration:0.4, ease:"power2.in" });

    /* ── BIRTHDAY REVEAL ── */
    tl.add(() => {
      /* Play Happy Birthday Marble Music after countdown ends */
      musicManager.playBirthdayMusic();
      cfg.current.petals = true;
      cfg.current.stars  = true;
      setShowBalloons(true);
    }, "+=0.3");

    /* Make parent wrapper visible first, then animate children in */
    tl.to(revealRef.current, { opacity:1, duration:0.01 })
      .to(glowRef.current, { opacity:1, duration:2.2, ease:"power2.out" })
      .fromTo(happyRef.current,
        { opacity:0, y:32, letterSpacing:"0.6em" },
        { opacity:1, y:0,  letterSpacing:"0.4em", duration:1.0 }, "-=1.8"
      )
      .fromTo(birthdayRef.current,
        { opacity:0, y:32, letterSpacing:"0.6em" },
        { opacity:1, y:0,  letterSpacing:"0.28em", duration:1.0 }, "-=0.65"
      )
      .fromTo(kavyaRef.current,
        { opacity:0, scale:0.85, filter:"blur(24px)" },
        { opacity:1, scale:1,    filter:"blur(0px)",  duration:1.8, ease:"power4.out" }, "-=0.5"
      )
      .fromTo(subRef.current,
        { opacity:0, y:14 },
        { opacity:1, y:0,  duration:1.1 }, "-=0.4"
      );

    /* hold reveal 4s then reveal cake */
    tl.to(revealRef.current, { y:-12, duration:4, ease:"none" })
      .to(revealRef.current, { opacity:0, y:-30, duration:1.2, ease:"power2.in" })
      .add(() => {
        cfg.current.petals = false;
        // Smoke triggers only when blown out now
        updateWicks();
      })
      .to(cakeRef.current,
        { y:"0%", duration:2.6, ease:"power3.out", onUpdate:updateWicks }, "+=0.1"
      )
      .add(() => {
        setIsListeningForBlow(true);
      });

    return () => { tl.kill(); };
  }, []);

  const triggerBlow = useCallback(() => {
    if (candlesBlown) return;
    setCandlesBlown(true);
    cfg.current.smoke = false; // disable smoke spawn

    // Just fade out everything immediately
    gsap.to(cakeRef.current, { opacity: 0, duration: 1.8, ease: "power2.inOut" });
    gsap.to(canvasRef.current, { opacity: 0, duration: 1.2, ease: "power2.inOut" });
    gsap.to(containerRef.current, { opacity: 0, duration: 1.8, delay: 0.3, ease: "power2.inOut" });

    setTimeout(() => { onComplete?.(); }, 2000);
  }, [candlesBlown, onComplete]);

  /* ─── Microphone Blow Detection ─── */
  useEffect(() => {
    if (!isListeningForBlow || candlesBlown) return;

    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let microphone: MediaStreamAudioSourceNode;
    let reqFrame: number;

    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;
        audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          
          // If a loud sustained noise (like blowing) is detected
          if (average > 60) {
            triggerBlow();
          } else {
            reqFrame = requestAnimationFrame(checkVolume);
          }
        };
        checkVolume();
      } catch (err) {
        console.warn("Microphone access denied or unavailable", err);
        // Fallback if mic is denied: just tap to blow
        const handleTap = () => {
          triggerBlow();
          window.removeEventListener("pointerdown", handleTap);
        };
        window.addEventListener("pointerdown", handleTap);
      }
    };

    startMic();

    return () => {
      if (reqFrame) cancelAnimationFrame(reqFrame);
      if (audioContext && audioContext.state !== "closed") audioContext.close();
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isListeningForBlow, candlesBlown, triggerBlow]);

  /* ── Number style ── */
  const numCls = "absolute inset-0 flex items-center justify-center font-sans font-black select-none pointer-events-none opacity-0";

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-[#030303] text-white relative overflow-hidden flex items-center justify-center select-none">

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,#000_90%)] pointer-events-none z-10" />

      {/* Red ambient center glow */}
      <div className="absolute w-[700px] h-[700px] rounded-full bg-[#C1121F]/8 blur-[180px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" />

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{mixBlendMode:"screen"}} />

      {/* ── COUNTDOWN STAGE ── */}
      <div className="absolute inset-0 z-30">
        <div ref={n3Ref} className={numCls} style={{fontSize:"clamp(7rem,18vw,14rem)",textShadow:"0 0 60px rgba(193,18,31,0.6)"}}>
          3
        </div>
        <div ref={n2Ref} className={numCls} style={{fontSize:"clamp(7rem,18vw,14rem)",textShadow:"0 0 60px rgba(244,197,66,0.6)"}}>
          2
        </div>
        <div ref={n1Ref} className={numCls} style={{fontSize:"clamp(7rem,18vw,14rem)",textShadow:"0 0 80px rgba(255,255,255,0.5)"}}>
          1
        </div>
      </div>

      {/* ── BIRTHDAY REVEAL STAGE ── */}
      <div ref={revealRef} className="absolute inset-0 flex flex-col items-center justify-center z-30 opacity-0 pointer-events-none px-6">

        {/* Sunrise glow */}
        <div ref={glowRef} className="absolute w-[600px] h-[360px] rounded-full bg-[#C1121F]/18 blur-[110px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none" />

        {/* HAPPY */}
        <div
          ref={happyRef}
          className="opacity-0 text-center font-sans font-light text-[#ffffff]/70 uppercase tracking-[0.35em]"
          style={{fontSize:"clamp(0.9rem,2.2vw,1.4rem)", letterSpacing:"0.35em"}}
        >
          HAPPY
        </div>

        {/* BIRTHDAY */}
        <div
          ref={birthdayRef}
          className="opacity-0 text-center font-sans font-light text-[#ffffff]/85 uppercase mt-1"
          style={{fontSize:"clamp(1.6rem,4vw,2.8rem)", letterSpacing:"0.25em", fontWeight:300}}
        >
          BIRTHDAY
        </div>

        {/* Decorative rule */}
        <div className="flex items-center gap-4 mt-5 mb-5 w-full max-w-md">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#C1121F]/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F]" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#C1121F]/60" />
        </div>

        {/* KAVYA — the centrepiece */}
        <h1
          ref={kavyaRef}
          className="opacity-0 text-center uppercase tracking-[0.18em]"
          style={{
            fontFamily: "var(--font-bodoni-moda, 'Georgia', serif)",
            fontWeight: 400,
            fontSize: "clamp(4rem,14vw,10rem)",
            background: "linear-gradient(135deg,#C1121F 0%,#FF6B6B 35%,#FFF5E0 55%,#FF6B6B 75%,#C1121F 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 40px rgba(193,18,31,0.5))",
            animation: "shimmer 5s linear infinite",
          }}
        >
          KAVYA
        </h1>

        {/* Sub line */}
        <div
          ref={subRef}
          className="opacity-0 mt-6 text-center font-serif italic font-light text-[#ffffff]/45 tracking-widest"
          style={{fontSize:"clamp(0.75rem,1.5vw,1rem)"}}
        >
          with love &amp; every good wish
        </div>
      </div>

      {/* ── CAKE TEASER STAGE ── */}
      <div
        ref={cakeRef}
        className="absolute bottom-0 translate-y-full w-full flex flex-col items-center pointer-events-none z-30 pb-[6vh] md:pb-[14vh]"
      >
        {/* Under-glow */}
        <div className="absolute w-[500px] h-[200px] rounded-full bg-[#F4C542]/12 blur-[80px] bottom-0 left-1/2 -translate-x-1/2" />

        {/* ── Birthday heading above cake ── */}
        <div className="flex flex-col items-center mb-4 select-none">
          {/* Decorative top ornament */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#F4C542]/70" />
            <span style={{fontSize:"1rem",lineHeight:1}} className="text-[#F4C542]/80">✦</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#F4C542]/70" />
          </div>

          {/* HAPPY BIRTHDAY line */}
          <div
            className="text-center uppercase text-[#ffffff]/70 font-light"
            style={{
              fontSize: "clamp(0.95rem,2.8vw,2rem)",
              letterSpacing: "0.5em",
              fontFamily: "var(--font-geist-sans, sans-serif)",
              textShadow: "0 0 20px rgba(255,255,255,0.12)",
            }}
          >
            HAPPY BIRTHDAY
          </div>

          {/* KAVYA — large decorative italic */}
          <div
            className="text-center mt-2"
            style={{
              fontFamily: "var(--font-bodoni-moda, 'Georgia', serif)",
              fontSize: "clamp(3.2rem,11vw,8rem)",
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "0.08em",
              lineHeight: 1,
              background: "linear-gradient(135deg,#C1121F 0%,#FF6B6B 30%,#FFF5E0 52%,#FF6B6B 72%,#C1121F 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 28px rgba(193,18,31,0.55))",
              animation: "shimmer 5s linear infinite",
            }}
          >
            Kavya
          </div>

          {/* Decorative bottom ornament */}
          <div className="flex items-center gap-4 mt-4">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#C1121F]/60" />
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F]/80" />
              <div className="w-2 h-2 rounded-full bg-[#F4C542]/90" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F]/80" />
            </div>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#C1121F]/60" />
          </div>
        </div>

        {/* Luxury multi-tier SVG cake */}
        <svg viewBox="0 0 400 320" className="w-[220px] sm:w-[280px] h-auto md:w-[380px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] relative z-10">
          <defs>
            {/* Cake dark body gradient */}
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2A1A1A"/>
              <stop offset="100%" stopColor="#0D0707"/>
            </linearGradient>
            {/* Frosting gradient */}
            <linearGradient id="frostGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#8B0000"/>
              <stop offset="30%"  stopColor="#C1121F"/>
              <stop offset="60%"  stopColor="#FF6B6B"/>
              <stop offset="100%" stopColor="#C1121F"/>
            </linearGradient>
            {/* Gold accent */}
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#92651A"/>
              <stop offset="40%"  stopColor="#F4C542"/>
              <stop offset="70%"  stopColor="#FFF0A0"/>
              <stop offset="100%" stopColor="#F4C542"/>
            </linearGradient>
            {/* Flame */}
            <radialGradient id="flameGrad" cx="50%" cy="80%" r="60%">
              <stop offset="0%"   stopColor="#FFFBE0"/>
              <stop offset="40%"  stopColor="#FFAD00"/>
              <stop offset="100%" stopColor="#FF4500" stopOpacity="0"/>
            </radialGradient>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="3" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ─ TIER 3 (bottom, widest) ─ */}
          <rect x="40"  y="220" width="320" height="90"  rx="4" fill="url(#bodyGrad)" stroke="#3A2020" strokeWidth="1"/>
          {/* gold stripes tier 3 */}
          <path d="M40 250 Q200 265 360 250" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.5"/>
          <path d="M40 278 Q200 293 360 278" fill="none" stroke="url(#goldGrad)" strokeWidth="1"   opacity="0.35"/>
          {/* frosting drips tier 3 */}
          <path d="M40 220 Q60 230 80 220 Q100 235 120 220 Q140 228 160 220 Q180 233 200 220 Q220 230 240 220 Q260 235 280 220 Q300 228 320 220 Q340 233 360 220 L360 232 Q340 245 320 232 Q300 240 280 232 Q260 247 240 232 Q220 242 200 232 Q180 245 160 232 Q140 240 120 232 Q100 247 80 232 Q60 242 40 232 Z" fill="url(#frostGrad)" opacity="0.85"/>
          {/* ellipse top tier3 */}
          <ellipse cx="200" cy="220" rx="160" ry="14" fill="#1A0E0E" stroke="url(#frostGrad)" strokeWidth="1.5"/>

          {/* ─ TIER 2 (middle) ─ */}
          <rect x="80"  y="145" width="240" height="80"  rx="4" fill="url(#bodyGrad)" stroke="#3A2020" strokeWidth="1"/>
          <path d="M80 170 Q200 182 320 170" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.5"/>
          <path d="M80 195 Q200 207 320 195" fill="none" stroke="url(#goldGrad)" strokeWidth="1"   opacity="0.35"/>
          <path d="M80 145 Q100 155 120 145 Q140 162 160 145 Q180 155 200 145 Q220 162 240 145 Q260 155 280 145 Q300 162 320 145 L320 157 Q300 170 280 157 Q260 172 240 157 Q220 167 200 157 Q180 172 160 157 Q140 167 120 157 Q100 172 80 157 Z" fill="url(#frostGrad)" opacity="0.85"/>
          <ellipse cx="200" cy="145" rx="120" ry="11" fill="#1A0E0E" stroke="url(#frostGrad)" strokeWidth="1.5"/>

          {/* ─ TIER 1 (top, smallest) ─ */}
          <rect x="130" y="88"  width="140" height="60"  rx="4" fill="url(#bodyGrad)" stroke="#3A2020" strokeWidth="1"/>
          <path d="M130 110 Q200 118 270 110" fill="none" stroke="url(#goldGrad)" strokeWidth="1.2" opacity="0.5"/>
          <path d="M130 128 Q200 136 270 128" fill="none" stroke="url(#goldGrad)" strokeWidth="1"   opacity="0.35"/>
          <path d="M130 88 Q150 96 170 88 Q185 100 200 88 Q215 100 230 88 Q250 96 270 88 L270 100 Q250 112 230 100 Q215 112 200 100 Q185 112 170 100 Q150 112 130 100 Z" fill="url(#frostGrad)" opacity="0.85"/>
          <ellipse cx="200" cy="88" rx="70" ry="9" fill="#1A0E0E" stroke="url(#frostGrad)" strokeWidth="1.5"/>

          {/* ─ CANDLES ─ */}
          {/* Candle Left x=152 */}
          <rect x="149" y="42" width="6" height="48" rx="2.5" fill="#C1121F"/>
          <rect x="149" y="42" width="6" height="48" rx="2.5" fill="url(#frostGrad)" opacity="0.45"/>
          {/* wick */}
          <line x1="152" y1="42" x2="152" y2="36" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
          {/* flame */}
          {!candlesBlown && (
            <ellipse cx="152" cy="30" rx="4.5" ry="7" fill="url(#flameGrad)" filter="url(#softGlow)" opacity="0.95">
              <animateTransform attributeName="transform" type="translate" values="0 0;0.5 -0.5;-0.5 0;0.3 0.3;0 0" dur="0.8s" repeatCount="indefinite"/>
            </ellipse>
          )}

          {/* Candle Centre x=200 */}
          <rect x="197" y="28" width="6" height="62" rx="2.5" fill="#F4C542"/>
          <rect x="197" y="28" width="6" height="62" rx="2.5" fill="url(#goldGrad)" opacity="0.5"/>
          <line x1="200" y1="28" x2="200" y2="22" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
          {!candlesBlown && (
            <ellipse cx="200" cy="16" rx="5" ry="8" fill="url(#flameGrad)" filter="url(#softGlow)" opacity="0.95">
              <animateTransform attributeName="transform" type="translate" values="0 0;-0.4 -0.4;0.6 0;-0.3 0.3;0 0" dur="0.9s" repeatCount="indefinite"/>
            </ellipse>
          )}

          {/* Candle Right x=248 */}
          <rect x="245" y="42" width="6" height="48" rx="2.5" fill="#C1121F"/>
          <rect x="245" y="46" width="6" height="44" rx="2.5" fill="url(#frostGrad)" opacity="0.45"/>
          <line x1="248" y1="46" x2="248" y2="40" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
          {!candlesBlown && (
            <ellipse cx="248" cy="34" rx="4.5" ry="6.5" fill="url(#flameGrad)" filter="url(#softGlow)" opacity="0.95">
              <animateTransform attributeName="transform" type="translate" values="0 0;0.4 -0.3;-0.6 0.2;0.2 0.3;0 0" dur="0.85s" repeatCount="indefinite"/>
            </ellipse>
          )}

          {/* decorative gold dots on tiers */}
          {[60,90,120,150,175,225,250,280,310,340].map((x,i)=>(
            <circle key={i} cx={x} cy={232} r="2.5" fill="url(#goldGrad)" opacity="0.7"/>
          ))}
          {[100,135,165,235,265,300].map((x,i)=>(
            <circle key={i} cx={x} cy={160} r="2" fill="url(#goldGrad)" opacity="0.6"/>
          ))}
        </svg>

        {/* Cake caption & Next interaction */}
        <div className="mt-8 flex flex-col items-center justify-center min-h-[40px] pointer-events-auto">
          {!candlesBlown ? (
            <div
              className={`transition-opacity duration-1000 ${isListeningForBlow ? 'opacity-100' : 'opacity-0'} text-center tracking-[0.3em] uppercase animate-pulse`}
              style={{
                fontFamily: "var(--font-bodoni-moda, 'Georgia', serif)",
                fontSize: "clamp(0.6rem,1.2vw,0.78rem)",
                color: "rgba(244,197,66,0.85)",
                fontStyle: "italic",
                letterSpacing: "0.35em",
              }}
            >
              Blow the candles...
            </div>
          ) : (
            <div className="animate-in fade-in duration-1000 text-center tracking-[0.3em] uppercase animate-pulse"
              style={{
                fontFamily: "var(--font-bodoni-moda, 'Georgia', serif)",
                fontSize: "clamp(0.6rem,1.2vw,0.78rem)",
                color: "rgba(255,255,255,0.75)",
                fontStyle: "italic",
                letterSpacing: "0.35em",
              }}
            >
              Making a wish...
            </div>
          )}
        </div>
      </div>

      {/* Balloon floaters — left and right sides (starts after countdown, now visible on mobile) */}
      {showBalloons && (
        <div className="block">
          {([
            { left:"3%",  dur:"10s", delay:"-2s",  size:68 },
            { left:"9%",  dur:"13s", delay:"-7s",  size:54 },
            { left:"16%", dur:"8s",  delay:"-4s",  size:62 },
            { left:"6%",  dur:"12s", delay:"-10s", size:50 },
            { left:"83%", dur:"11s", delay:"-1s",  size:58 },
            { left:"90%", dur:"9s",  delay:"-5s",  size:70 },
            { left:"77%", dur:"14s", delay:"-8s",  size:52 },
            { left:"94%", dur:"10s", delay:"-3s",  size:46 },
          ] as {left:string;dur:string;delay:string;size:number}[]).map((b,i) => (
            <img
              key={i}
              src="/balloon.png"
              alt=""
              className={`balloon-${i}`}
              style={{
                position: "fixed",
                left: b.left,
                bottom: "-130px",
                width: `clamp(35px, 9vw, ${b.size}px)`,
                height: "auto",
                animation: `balloonRise ${b.dur} ${b.delay} linear infinite`,
                pointerEvents: "none",
                zIndex: 25,
                filter: "drop-shadow(0 4px 14px rgba(193,18,31,0.45))",
              }}
            />
          ))}
        </div>
      )}

      {/* Global keyframes */}
      <style>{`
        @keyframes shimmer {
          from { background-position: 0% center; }
          to   { background-position: 200% center; }
        }
        @keyframes balloonRise {
          0%   { transform: translateY(0px)    rotate(-2deg); opacity: 0;    }
          8%   { transform: translateY(-8vh)   rotate(2deg);  opacity: 0.9;  }
          50%  { transform: translateY(-55vh)  rotate(-2deg); opacity: 0.85; }
          92%  { transform: translateY(-102vh) rotate(2deg);  opacity: 0.4;  }
          100% { transform: translateY(-115vh) rotate(0deg);  opacity: 0;    }
        }
        @media (max-width: 640px) {
          :global(.balloon-0) { left: 1.5% !important; }
          :global(.balloon-1) { left: 4% !important; }
          :global(.balloon-2) { left: 7% !important; }
          :global(.balloon-3) { left: 2% !important; }
          :global(.balloon-4) { left: 91.5% !important; }
          :global(.balloon-5) { left: 94% !important; }
          :global(.balloon-6) { left: 88% !important; }
          :global(.balloon-7) { left: 96% !important; }
        }
      `}</style>
    </div>
  );
}
