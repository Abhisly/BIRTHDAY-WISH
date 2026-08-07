"use client";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type Phase = "envelope" | "letter" | "ending";

const LETTER_PARAGRAPHS = [
  { text: "Happy Birthday, Kavya.", bold: true },
  { text: "It feels a little funny writing this after so many years.", bold: false },
  { text: "We may not talk as often anymore,\nbut some memories never really fade.", bold: false },
  { text: "Whenever I think about childhood,\nour village, the games, the laughter,\nand those carefree evenings\nsomehow always find their way back.", bold: false },
  { text: "Life has taken us on different paths,\nand that's completely okay.", bold: false },
  { text: "I'm just genuinely happy that I got the chance to know\nsomeone as kind, energetic, and wonderful as you.", bold: false },
  { text: "I hope this new year of your life brings you happiness,\ngood health, beautiful surprises,\nand people who always make you smile.", bold: false },
  { text: "Never lose that cheerful spirit\nthat made those childhood days so memorable.", bold: false },
  { text: "Thank you for being a part of those memories.", bold: false },
  { text: "Happy Birthday once again.\nTake care, and keep smiling.", bold: false },
];

/* ── Soft dust canvas ──────────────────────────────────────────────────────── */
function Dust() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = window.innerWidth; c.height = window.innerHeight;
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - .5) * .14, vy: -(Math.random() * .18 + .04),
      r: Math.random() * 1.1 + .3, a: Math.random() * .2 + .05,
    }));
    let raf: number;
    const loop = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -4) p.y = c.height + 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244,197,66,${p.a})`; ctx.fill();
      });
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />;
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function SceneFive() {
  const [phase, setPhase] = useState<Phase>("envelope");
  const [endMsg, setEndMsg] = useState(0);
  const [visiblePara, setVisiblePara] = useState(0);

  const rootRef   = useRef<HTMLDivElement>(null);
  const envRef    = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);

  /* Fade in on mount */
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.style.opacity = "0";
      gsap.to(rootRef.current, { opacity: 1, duration: 2.2, ease: "power2.out" });
    }
  }, []);

  /* Open envelope */
  const openEnvelope = () => {
    if (phase !== "envelope") return;
    // fade out envelope
    if (envRef.current) {
      gsap.to(envRef.current, { opacity: 0, scale: 0.85, duration: 0.9, ease: "power2.in",
        onComplete: () => {
          setPhase("letter");
          // fade in letter
          requestAnimationFrame(() => {
            if (letterRef.current) {
              gsap.fromTo(letterRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
              );
            }
          });
          // stream in paragraphs
          LETTER_PARAGRAPHS.forEach((_, i) => {
            setTimeout(() => setVisiblePara(i + 1), 600 + i * 1400);
          });
          // after all text, begin ending sequence
          const endStart = 600 + LETTER_PARAGRAPHS.length * 1400 + 4000;
          setTimeout(() => {
            if (letterRef.current) gsap.to(letterRef.current, { opacity: 0, y: -20, duration: 1.5, ease: "power2.inOut" });
            setTimeout(() => {
              setPhase("ending");
              if (rootRef.current) rootRef.current.style.background = "#000";
              if (rootRef.current) gsap.to(rootRef.current, { opacity: 1, duration: 0.1 });
              setTimeout(() => setEndMsg(1), 800);
              setTimeout(() => setEndMsg(2), 4500);
              setTimeout(() => setEndMsg(3), 8500);
              setTimeout(() => {
                if (rootRef.current) gsap.to(rootRef.current, { opacity: 0, duration: 3, ease: "power2.inOut" });
              }, 18000);
            }, 2000);
          }, endStart);
        }
      });
    }
  };

  const isEnvelope = phase === "envelope";
  const isLetter   = phase === "letter";
  const isEnding   = phase === "ending";

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 w-full h-full bg-[#050505] flex items-center justify-center overflow-hidden select-none"
      style={{ zIndex: 100 }}
    >
      <Dust />

      {/* ── Envelope Phase ────────────────────────────────────────────── */}
      {isEnvelope && (
        <div
          ref={envRef}
          className="relative flex flex-col items-center gap-8"
          style={{ zIndex: 10 }}
        >
          {/* Lines above envelope */}
          <div className="flex flex-col items-center gap-3 pointer-events-none" style={{ animation: "s5In 1.8s ease forwards", opacity: 0 }}>
            <p style={{
              fontFamily: "var(--font-bodoni-moda,'Georgia',serif)",
              fontStyle: "italic", fontWeight: 300,
              fontSize: "clamp(0.9rem,2vw,1.2rem)",
              color: "rgba(255,252,240,0.65)", letterSpacing: "0.06em",
            }}>
              For the girl who made childhood unforgettable.
            </p>
            <p style={{
              fontFamily: "var(--font-bodoni-moda,'Georgia',serif)",
              fontStyle: "italic", fontWeight: 300,
              fontSize: "clamp(0.75rem,1.5vw,0.95rem)",
              color: "rgba(244,197,66,0.55)", letterSpacing: "0.12em",
            }}>
              One last thing...
            </p>
          </div>

          {/* Red Envelope Image */}
          <div
            onClick={openEnvelope}
            className="relative cursor-pointer group"
            style={{ width: "clamp(240px,38vw,360px)", animation: "s5FloatIn 1.4s 0.5s ease forwards", opacity: 0 }}
          >
            {/* Soft gold glow behind */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                boxShadow: "0 0 60px 20px rgba(193,18,31,0.12), 0 0 120px 40px rgba(244,197,66,0.06)",
                transition: "box-shadow 0.4s ease",
              }}
            />
            <img
              src="/red-envelope.webp"
              alt="Birthday envelope"
              draggable={false}
              className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.03]"
              style={{
                filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.7)) drop-shadow(0 0 20px rgba(193,18,31,0.3))",
                position: "relative", zIndex: 2,
              }}
            />
          </div>

          {/* Click hint */}
          <p
            onClick={openEnvelope}
            className="cursor-pointer"
            style={{
              fontFamily: "var(--font-inter,sans-serif)",
              fontWeight: 300, letterSpacing: "0.22em",
              fontSize: "clamp(0.65rem,1.4vw,0.82rem)",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              animation: "s5Pulse 2.5s ease-in-out infinite",
            }}
          >
            Click to open
          </p>
        </div>
      )}

      {/* ── Letter Phase ───────────────────────────────────────────────── */}
      {isLetter && (
        <div
          ref={letterRef}
          className="absolute inset-0 flex items-start justify-center overflow-y-auto py-12 px-4"
          style={{ zIndex: 20, opacity: 0 }}
        >
          <div style={{
            width: "clamp(300px,92vw,620px)",
            background: "linear-gradient(168deg, #faf6ed 0%, #f4e9d2 100%)",
            borderRadius: "3px",
            padding: "clamp(28px,6vw,60px) clamp(22px,5vw,52px)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(200,168,90,0.22), inset 0 0 40px rgba(244,197,66,0.03)",
            position: "relative",
          }}>
            {/* Subtle paper rule lines */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{
                position: "absolute", left: "8%", right: "8%",
                top: `${72 + i * 36}px`, height: "1px",
                background: "rgba(160,140,90,0.09)", pointerEvents: "none",
              }} />
            ))}

            {/* Letter text */}
            <div style={{ position: "relative", zIndex: 2 }}>
              {LETTER_PARAGRAPHS.map((para, i) => (
                <p key={i} style={{
                  fontFamily: "var(--font-bodoni-moda,'Georgia',serif)",
                  fontStyle: i === 0 ? "normal" : "italic",
                  fontWeight: i === 0 ? 700 : 300,
                  fontSize: i === 0
                    ? "clamp(1.1rem,2.8vw,1.45rem)"
                    : "clamp(0.88rem,1.8vw,1.05rem)",
                  color: i === 0 ? "rgba(80,35,10,0.94)" : "rgba(65,45,18,0.80)",
                  lineHeight: 1.95,
                  marginBottom: i === 0 ? "26px" : "16px",
                  whiteSpace: "pre-line",
                  opacity: visiblePara > i ? 1 : 0,
                  transform: visiblePara > i ? "translateY(0)" : "translateY(10px)",
                  transition: "opacity 1.1s ease, transform 1.1s ease",
                }}>
                  {para.text}
                </p>
              ))}

              {/* Signature */}
              <div style={{
                marginTop: "36px",
                opacity: visiblePara >= LETTER_PARAGRAPHS.length ? 1 : 0,
                transform: visiblePara >= LETTER_PARAGRAPHS.length ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 1.3s ease 0.3s, transform 1.3s ease 0.3s",
              }}>
                <div style={{ width: "56px", height: "1px", background: "rgba(160,110,50,0.4)", marginBottom: "12px" }} />
                <span style={{
                  fontFamily: "var(--font-caveat,'Georgia',cursive)",
                  fontSize: "clamp(1.3rem,3.5vw,1.85rem)",
                  color: "rgba(110,55,18,0.75)",
                  letterSpacing: "0.02em",
                }}>
                  — Abhi
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Ending Phase ───────────────────────────────────────────────── */}
      {isEnding && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 50 }}>
          <div style={{
            fontFamily: "var(--font-inter,sans-serif)",
            fontWeight: 300, letterSpacing: "0.2em",
            fontSize: "clamp(0.72rem,1.6vw,0.95rem)",
            color: "rgba(255,255,255,0.48)",
            textTransform: "uppercase",
            opacity: endMsg >= 1 ? 1 : 0,
            transition: "opacity 2.2s ease",
            marginBottom: "22px",
          }}>
            Thank you.
          </div>
          <div style={{
            fontFamily: "var(--font-bodoni-moda,'Georgia',serif)",
            fontStyle: "italic", fontWeight: 300,
            fontSize: "clamp(1.6rem,5vw,2.8rem)",
            color: "rgba(244,197,66,0.86)",
            letterSpacing: "0.06em",
            opacity: endMsg >= 2 ? 1 : 0,
            transition: "opacity 2.5s ease",
            marginBottom: "26px",
          }}>
            Happy Birthday, Kavya.
          </div>
          <div style={{
            fontFamily: "var(--font-bodoni-moda,'Georgia',serif)",
            fontStyle: "italic", fontWeight: 300,
            fontSize: "clamp(0.82rem,1.8vw,1.05rem)",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.05em",
            opacity: endMsg >= 3 ? 1 : 0,
            transition: "opacity 2s ease",
          }}>
            Some memories never really leave us.
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes s5In {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes s5FloatIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes s5Pulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}
