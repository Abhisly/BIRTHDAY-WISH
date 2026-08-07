"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { musicManager, startWindSound, stopWindSound } from "@/lib/audio";

interface Star { id:number; x:number; y:number; memory:string; connections:number[]; }
type RevealPhase = "idle"|"zooming"|"connecting"|"writing"|"reading"|"dissolving"|"returning";

const MEMORIES = [
  "Running through those village roads\nfelt like freedom.",
  "The best adventures\nnever needed a plan.",
  "Back then...\nevery evening felt endless.",
  "Some places\nnever leave our hearts.",
  "Growing up changed life,\nnot the memories.",
  "There was magic\nin ordinary days.",
  "The happiest laughs\ncame without a reason.",
  "Childhood never asked us\nto hurry.",
  "Some smiles stay with us\nfor years.",
  "Life moved on.\nThose memories didn't.",
  "We didn't know\nthose were the good old days.",
  "Some friendships quietly survive\nthe passing of time.",
];

const STARS: Star[] = [
  {id:1,x:25,y:35,memory:MEMORIES[0],connections:[2,5]},
  {id:2,x:38,y:22,memory:MEMORIES[1],connections:[1,3]},
  {id:3,x:50,y:30,memory:MEMORIES[2],connections:[2,4]},
  {id:4,x:65,y:20,memory:MEMORIES[3],connections:[3,7]},
  {id:5,x:20,y:55,memory:MEMORIES[4],connections:[1,6]},
  {id:6,x:35,y:65,memory:MEMORIES[5],connections:[5,10]},
  {id:7,x:80,y:35,memory:MEMORIES[6],connections:[4,8]},
  {id:8,x:75,y:58,memory:MEMORIES[7],connections:[7,12]},
  {id:9,x:48,y:78,memory:MEMORIES[8],connections:[10,11]},
  {id:10,x:32,y:82,memory:MEMORIES[9],connections:[6,9]},
  {id:11,x:62,y:75,memory:MEMORIES[10],connections:[9,12]},
  {id:12,x:85,y:70,memory:MEMORIES[11],connections:[8,11]},
];

// Gold Star using the exact user-specified webp image
const GoldStarIcon = ({ isChosen, isExplored }: { isChosen: boolean; isExplored: boolean }) => (
  <div className="relative flex items-center justify-center pointer-events-none">
    {/* Soft glow behind the image */}
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: isChosen ? "120px" : isExplored ? "90px" : "70px",
        height: isChosen ? "120px" : isExplored ? "90px" : "70px",
        background: isChosen
          ? "radial-gradient(circle, rgba(255,220,80,0.55) 0%, rgba(244,197,66,0.25) 50%, transparent 80%)"
          : isExplored
          ? "radial-gradient(circle, rgba(244,197,66,0.35) 0%, transparent 75%)"
          : "radial-gradient(circle, rgba(255,255,200,0.18) 0%, transparent 70%)",
        transition: "all 0.7s ease",
      }}
    />
    {/* The actual gold star webp image */}
    <img
      src="/gold-star-golden-star-icon-free-png.webp"
      alt="star"
      draggable={false}
      style={{
        position: "relative",
        width: isChosen ? "72px" : isExplored ? "56px" : "48px",
        height: isChosen ? "72px" : isExplored ? "56px" : "48px",
        objectFit: "contain",
        transition: "width 0.7s ease, height 0.7s ease, filter 0.7s ease, transform 0.7s ease",
        transform: isChosen ? "rotate(12deg) scale(1.05)" : "rotate(0deg) scale(1)",
        filter: isChosen
          ? "drop-shadow(0 0 22px rgba(255,220,60,1)) drop-shadow(0 0 44px rgba(244,197,66,0.9)) brightness(1.25)"
          : isExplored
          ? "drop-shadow(0 0 14px rgba(244,197,66,0.85)) brightness(1.1)"
          : "drop-shadow(0 0 8px rgba(255,240,130,0.6)) brightness(1.0)",
        animation: !isChosen ? "pulseGlow 3s infinite ease-in-out" : "none",
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  </div>
);

export default function SceneFour({ onComplete }: { onComplete?: () => void }) {
  const fireflyCanvasRef = useRef<HTMLCanvasElement>(null);
  const iRef1    = useRef<HTMLDivElement>(null);
  const iRef2    = useRef<HTMLDivElement>(null);
  const iRef3    = useRef<HTMLDivElement>(null);
  const timers   = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [showFireflies, setShowFireflies] = useState(true);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>("idle");
  const [chosen,   setChosen]   = useState<Star|null>(null);
  const [explored, setExplored] = useState<number[]>([]);

  const [parallax,  setParallax] = useState({x:0,y:0});
  const [bgCount,   setBgCount]  = useState(80);

  const bgStars = useRef<{id:number;x:number;y:number;sz:number;spd:number}[]>([]);
  if (!bgStars.current.length)
    for (let i=0;i<200;i++)
      bgStars.current.push({
        id:i,
        x:Math.random()*100,
        y:Math.random()*100,
        sz:Math.random()*4+2,
        spd:Math.random()*3+2
      });

  // Hide transition firefly canvas after 5.5s
  useEffect(() => {
    const t = setTimeout(() => {
      setShowFireflies(false);
    }, 5500);
    return () => clearTimeout(t);
  }, []);

  // Magical Firefly & Sparkle Particle Canvas Effect during wish transition
  useEffect(() => {
    if (!showFireflies) return;
    const canvas = fireflyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight * 0.65;

    const particles = Array.from({ length: 45 }, (_, i) => ({
      x: startX + (Math.random() - 0.5) * 200,
      y: startY + (Math.random() - 0.5) * 50,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.8 + 0.5),
      size: Math.random() * 3.5 + 2.0,
      alpha: Math.random() * 0.4 + 0.6,
      color: i % 4 === 0 ? "#FFFFFF" : i % 4 === 1 ? "#FFFBE0" : i % 4 === 2 ? "#F4C542" : "#FFD700",
      driftFreq: Math.random() * 0.035 + 0.015,
      driftAmp: Math.random() * 2.5 + 1.0,
      phase: Math.random() * Math.PI * 2,
    }));

    let animId: number;
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.vy;
        p.x += Math.sin(elapsed * p.driftFreq * 10 + p.phase) * p.driftAmp * 0.14 + p.vx;

        const currentAlpha = Math.max(0, p.alpha * (1 - Math.max(0, elapsed - 3.2) / 2.0));

        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (elapsed < 5.8) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [showFireflies]);

  // Sky audio + intro text
  useEffect(()=>{
    (async()=>{
      try{ const {Howler}=await import("howler"); if(Howler.ctx?.state==="suspended") await Howler.ctx.resume(); }catch{}
      musicManager.playMemorySkyMusic();
      startWindSound();
    })();
    const tl=gsap.timeline({delay:1.5});
    tl.to(iRef1.current,{opacity:1,duration:2,ease:"power1.inOut"})
      .to(iRef1.current,{opacity:0,duration:1.5,ease:"power1.inOut"},"+=2.5")
      .to(iRef2.current,{opacity:1,duration:2,ease:"power1.inOut"})
      .to(iRef2.current,{opacity:0,duration:1.5,ease:"power1.inOut"},"+=2.5")
      .to(iRef3.current,{opacity:1,duration:2,ease:"power1.inOut"})
      .to(iRef3.current,{opacity:0,duration:1.5,ease:"power1.inOut"},"+=2.5");
    return ()=>{ tl.kill(); stopWindSound(); musicManager.pauseMemorySkyMusic(1000); };
  },[]);

  useEffect(()=>{
    const fn=(e:MouseEvent)=>setParallax({x:(e.clientX/window.innerWidth-0.5)*16,y:(e.clientY/window.innerHeight-0.5)*16});
    window.addEventListener("mousemove",fn);
    return ()=>window.removeEventListener("mousemove",fn);
  },[]);

  useEffect(()=>{ setBgCount(80+Math.floor((explored.length/12)*100)); },[explored]);
  useEffect(()=>()=>{ timers.current.forEach(clearTimeout); },[]);

  const clickStar = useCallback((star:Star)=>{
    if (["zooming","connecting","writing"].includes(revealPhase)) return;
    if (typeof navigator!=="undefined"&&"vibrate"in navigator) navigator.vibrate(15);
    timers.current.forEach(clearTimeout);
    setChosen(star);
    setRevealPhase("zooming");
    if (!explored.includes(star.id)) setExplored(p=>[...p,star.id]);
    const totalChars = star.memory.replace("\n"," ").length;
    const writeMs = totalChars*28+300;
    const push=(fn:()=>void,ms:number)=>timers.current.push(setTimeout(fn,ms));
    push(()=>setRevealPhase("connecting"), 700);
    push(()=>setRevealPhase("writing"), 1200);
    push(()=>setRevealPhase("reading"), 1200+writeMs);
    push(()=>setRevealPhase("dissolving"), 1200+writeMs+4000);
    push(()=>setRevealPhase("returning"), 1200+writeMs+4000+1200);
    push(()=>{
      setRevealPhase("idle");
      setChosen(null);
      setExplored(prev => {
        const next = prev.includes(star.id) ? prev : [...prev, star.id];
        // If this closes the last star, fire onComplete after a delay
        if (next.length >= STARS.length) {
          setTimeout(() => onComplete?.(), 3500);
        }
        return next;
      });
    }, 1200+writeMs+4000+1200+1000);
  },[revealPhase, explored, onComplete]);

  const isZoomed  = ["zooming","connecting","writing","reading","dissolving"].includes(revealPhase);
  const showText  = ["writing","reading","dissolving"].includes(revealPhase);
  const isFading  = revealPhase==="dissolving";

  return (
    <div data-scene4-root className="absolute inset-0 w-full h-full min-h-screen bg-black text-white overflow-hidden flex items-center justify-center select-none" style={{animation:"fadeIn 3s ease-out forwards"}}>

      {/* Floating Fireflies Canvas */}
      {showFireflies && (
        <canvas ref={fireflyCanvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-40" style={{mixBlendMode:"screen"}} />
      )}

      {/* Skip Button - Appears pill-shaped in top right after 4 stars collected */}
      <button
        onClick={() => {
          // Instantly fade out and go to next scene
          const el = document.querySelector("[data-scene4-root]") as HTMLElement;
          if (el) {
            el.style.transition = "opacity 0.8s ease";
            el.style.opacity = "0";
          }
          setTimeout(() => onComplete?.(), 850);
        }}
        className={`fixed top-6 right-6 z-50 flex items-center justify-center h-[36px] px-[18px] py-[8px] rounded-full bg-black/30 backdrop-blur-md border border-white/20 hover:border-white/40 shadow-lg text-xs font-medium tracking-wider text-white transition-all duration-700 ease-out active:scale-95 group cursor-pointer ${
          explored.length >= 4 ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"
        }`}
        style={{
          boxShadow: "0 4px 20px rgba(0,0,0,0.35), 0 0 12px rgba(244,197,66,0.15)",
        }}
      >
        <span className="relative z-10 flex items-center gap-1.5">
          Skip <span className="text-[#F4C542] group-hover:translate-x-0.5 transition-transform duration-300">✦</span>
        </span>
      </button>

      <div className="absolute inset-0 w-full h-full">

        {/* Nebula glow */}
        <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(circle at center,rgba(193,18,31,0.065) 0%,rgba(244,197,66,0.025) 45%,transparent 90%)"}}/>

        {/* Stars (parallax + smooth camera pan/zoom layer) */}
        {(() => {
          const zoomScale = 1.45;
          const tx = (isZoomed && chosen) ? `${(50 - chosen.x) * zoomScale}vw` : `${parallax.x}px`;
          // Offset y by 15 so the star moves up and doesn't overlap the text
          const ty = (isZoomed && chosen) ? `${(50 - chosen.y + 15) * zoomScale}vh` : `${parallax.y}px`;
          const scaleVal = (isZoomed && chosen) ? zoomScale : 1;
          return (
            <div className="absolute inset-0 pointer-events-none" style={{
              transform: `translate3d(${tx}, ${ty}, 0) scale(${scaleVal})`,
              transformOrigin: "50% 50%",
              transition: "transform 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}>
              {/* Blur overlay for background elements when zoomed */}
              <div 
                className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${isZoomed ? "opacity-100" : "opacity-0"}`}
                style={{
                  backdropFilter: "blur(5px)",
                  backgroundColor: "rgba(0,0,0,0.45)",
                  zIndex: 5 
                }}
              />
              {/* Tiny background stars as glowing CSS dots */}
              {bgStars.current.slice(0,bgCount).map(s=>(
                <div key={s.id} className="absolute rounded-full pointer-events-none"
                  style={{
                    left:`${s.x}%`,
                    top:`${s.y}%`,
                    width:`${s.sz}px`,
                    height:`${s.sz}px`,
                    background: s.sz > 4
                      ? "radial-gradient(circle, rgba(255,248,200,1) 20%, rgba(244,197,66,0.6) 60%, transparent 100%)"
                      : "radial-gradient(circle, rgba(255,255,255,1) 20%, rgba(200,200,200,0.4) 70%, transparent 100%)",
                    boxShadow: s.sz > 4
                      ? `0 0 ${s.sz*2}px ${s.sz}px rgba(244,197,66,0.35)`
                      : `0 0 ${s.sz}px ${s.sz*0.5}px rgba(255,255,255,0.2)`,
                    opacity: 0.5+(s.sz/6)*0.4,
                    animation:`twinkle ${s.spd}s infinite ease-in-out`
                  }}/>
              ))}

              {/* Interactive gold stars */}
              <div className="absolute inset-0 pointer-events-auto">
                {STARS.map(star=>{
                  const isChosen   = chosen?.id===star.id;
                  const isExplored = explored.includes(star.id);
                  return (
                    <div key={star.id} onClick={()=>clickStar(star)} className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer" style={{left:`${star.x}%`,top:`${star.y}%`,zIndex:isChosen?30:10}}>
                      {/* Gold Star image — glow is handled inside GoldStarIcon */}
                      <GoldStarIcon isChosen={isChosen} isExplored={isExplored} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Stardust Writing directly on Sky */}
        {showText && chosen && (
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none px-6">
            <div className="relative text-center max-w-2xl">
              {chosen.memory.split("\n").map((line, lineIdx) => {
                let charOffset = 0;
                for (let i = 0; i < lineIdx; i++) {
                  charOffset += chosen.memory.split("\n")[i].length;
                }
                return (
                  <div key={lineIdx} className="block my-2">
                    {line.split("").map((ch, charIdx) => {
                      const idx = charOffset + charIdx;
                      return (
                        <span key={charIdx} style={{
                          fontFamily: "var(--font-bodoni-moda, 'Georgia', serif)",
                          fontSize: "clamp(1.4rem, 3.8vw, 2.6rem)",
                          fontWeight: 300,
                          fontStyle: "italic",
                          letterSpacing: "0.05em",
                          display: "inline-block",
                          whiteSpace: ch === " " ? "pre" : "normal",
                          color: "rgba(255,252,240,0.94)",
                          textShadow: "0 0 24px rgba(255,252,240,0.2),0 0 60px rgba(244,197,66,0.1)",
                          opacity: 0,
                          animation: isFading
                            ? `starFade 0.6s ease-in forwards`
                            : `starWrite 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
                          animationDelay: isFading
                            ? `${(chosen.memory.replace("\n","").length-1-idx)*12}ms`
                            : `${idx*28}ms`,
                        }}>{ch}</span>
                      );
                    })}
                  </div>
                );
              })}
              {/* Ambient drifting particles during reading */}
              {revealPhase==="reading" && [0,1,2,3,4,5,6].map(i=>(
                <div key={i} style={{
                  position:"absolute",width:"2px",height:"2px",borderRadius:"50%",
                  background:"rgba(244,197,66,0.7)",
                  left:`${8+i*13}%`,top:`${35+Math.sin(i*1.1)*25}%`,
                  animation:`particleDrift ${2.5+i*0.4}s ease-in-out infinite`,
                  animationDelay:`${i*0.35}s`,
                  boxShadow:"0 0 4px 1px rgba(244,197,66,0.5)",
                }}/>
              ))}
            </div>
          </div>
        )}

        {/* Intro text overlays */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none px-6">
          {([
            {ref:iRef1,txt:"Sometimes...\nThe brightest memories...\nare the quietest ones.",gold:false},
            {ref:iRef2,txt:"Every star carries\na little piece of the past.",gold:false},
            {ref:iRef3,txt:"Touch the stars.\nSome of them remember.",gold:true},
          ] as {ref:React.RefObject<HTMLDivElement|null>,txt:string,gold:boolean}[]).map(({ref,txt,gold},i)=>(
            <div key={i} ref={ref} className="absolute text-center opacity-0 max-w-xl">
              <p style={{fontFamily:"'Georgia',serif",fontStyle:"italic",fontWeight:300,
                fontSize:"clamp(1.4rem,3vw,2.2rem)",letterSpacing:"0.04em",lineHeight:1.9,
                color:gold?"rgba(255,248,220,0.86)":"rgba(255,255,255,0.8)",
                textShadow:gold?"0 0 24px rgba(244,197,66,0.15)":"0 0 20px rgba(255,255,255,0.1)"}}>
                {txt.split("\n").map((l,j)=><React.Fragment key={j}>{j>0&&<br/>}{l}</React.Fragment>)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes twinkle{0%,100%{opacity:0.25;transform:scale(0.85)}50%{opacity:0.95;transform:scale(1.2)}}
        @keyframes pulseGlow{0%,100%{transform:scale(1);filter:drop-shadow(0 0 6px rgba(244,197,66,0.4))}50%{transform:scale(1.12);filter:drop-shadow(0 0 16px rgba(244,197,66,0.9))}}
        @keyframes starWrite{
          0%{opacity:0;transform:translateY(14px) scale(0.65);filter:blur(8px) brightness(3.5);}
          45%{opacity:0.85;filter:blur(1px) brightness(1.6);}
          100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0) brightness(1);}
        }
        @keyframes starFade{
          0%{opacity:1;transform:translateY(0) scale(1);filter:blur(0);}
          100%{opacity:0;transform:translateY(-12px) scale(1.4);filter:blur(10px);}
        }
        @keyframes particleDrift{
          0%,100%{transform:translateY(0) translateX(0) scale(1);opacity:0.35;}
          50%{transform:translateY(-20px) translateX(10px) scale(1.6);opacity:0.85;}
        }
      `}</style>
    </div>
  );
}
