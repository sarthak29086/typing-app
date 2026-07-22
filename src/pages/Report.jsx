import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../context/TestContext';

// ─────────────────────────────────────────────────────────────
// Canvas animation: glass crack → swallow DOM → 3D Black Hole
// Used exclusively for the 40+ WPM "Apex" tier
// ─────────────────────────────────────────────────────────────
function ApexTransitionCanvas({ onComplete, onSwallow }) {
  const canvasRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  
  // Trigger DOM swallow immediately
  useEffect(() => {
    onSwallow();
  }, [onSwallow]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const cx = W / 2, cy = H / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.2;

    // ── Build glass crack tree from center ──
    const cracks = [];
    const addCrack = (x, y, angle, len, depth) => {
      if (depth > 3 || len < 20) return;
      const ex = x + Math.cos(angle) * len;
      const ey = y + Math.sin(angle) * len;
      cracks.push({ x1: x, y1: y, x2: ex, y2: ey, depth });
      const branches = depth === 0 ? 3 : (Math.random() < 0.8 ? 2 : 1);
      for (let b = 0; b < branches; b++) {
        const ba = angle + (Math.random() - 0.5) * 1.5;
        const bl = len * (0.2 + Math.random() * 0.4);
        const t = 0.25 + Math.random() * 0.55;
        addCrack(
          x + Math.cos(angle) * len * t,
          y + Math.sin(angle) * len * t,
          ba, bl, depth + 1
        );
      }
    };
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      addCrack(cx, cy, a, maxR * (0.7 + Math.random() * 0.3), 0);
    }

    // ── Timing constants (ms) ──
    const T_GLASS = 1200;
    const T_SWALLOW = 2500; // DOM takes 2.5s to get sucked in
    const T_EXPAND = 2500; // Black hole then violently expands
    const T_TOTAL = T_GLASS + T_SWALLOW + T_EXPAND; // 6200ms

    let start = null, rafId;
    let lightningBolts = [], lastLightningMs = -999;

    const makeBolt = () => {
      const pts = [];
      const a = Math.random() * Math.PI * 2;
      const len = 200 + Math.random() * 400;
      let x = cx + (Math.random() - 0.5) * 80;
      let y = cy + (Math.random() - 0.5) * 80;
      pts.push([x, y]);
      for (let s = 0; s < 18; s++) {
        x += Math.cos(a) * len / 18 + (Math.random() - 0.5) * 70;
        y += Math.sin(a) * len / 18 + (Math.random() - 0.5) * 70;
        pts.push([x, y]);
      }
      return pts;
    };

    const drawAccretionDisk = (elapsed, easeBhT, bhRadius, isBack) => {
      ctx.save();
      ctx.rotate(elapsed * 0.001); // Swirling rotation
      // The disk starts highly tilted (0.15) and flattens out (1.0) as the black hole consumes the screen
      ctx.scale(1, 0.15 + 0.85 * easeBhT);
      
      // Intense photon ring
      const ringRadius = bhRadius * 1.4 + 5;
      if (ringRadius > 2 && easeBhT < 0.95) {
         ctx.beginPath();
         ctx.arc(0, 0, ringRadius, isBack ? Math.PI : 0, isBack ? Math.PI*2 : Math.PI);
         ctx.strokeStyle = `rgba(255, 180, 50, ${1 - Math.pow(easeBhT, 3)})`;
         ctx.lineWidth = Math.max(2, bhRadius * 0.15);
         ctx.shadowBlur = 40;
         ctx.shadowColor = '#ff5500';
         ctx.stroke();
         ctx.shadowBlur = 0;
      }

      // Swirling star matter & gas
      for (let i = 0; i < 450; i++) {
          const pAngle = (i / 450) * Math.PI * 2 + elapsed * 0.004 * (450/(i+1));
          const isBackParticle = Math.sin(pAngle) < 0;
          if (isBack !== isBackParticle) continue; // Draw front or back only
          
          const baseDist = 12 + i * 1.8;
          // Pushed outwards dramatically as bhRadius grows
          const dist = baseDist + Math.pow(easeBhT, 2.5) * maxR * 1.5;
          
          if (dist < bhRadius * 0.95) continue; // Consumed by event horizon

          const px = Math.cos(pAngle) * dist;
          const py = Math.sin(pAngle) * dist;
          
          ctx.beginPath();
          ctx.arc(px, py, Math.random() * 3 + 0.5, 0, Math.PI * 2);
          const hue = 15 + i * 0.15 + elapsed * 0.05;
          const alpha = Math.max(0, 1 - dist/(maxR * 1.4));
          ctx.fillStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
          ctx.fill();
      }
      ctx.restore();
    };

    const draw = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;

      if (elapsed >= T_TOTAL) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        onCompleteRef.current();
        return;
      }

      ctx.clearRect(0, 0, W, H);

      const glassT = Math.min(elapsed / T_GLASS, 1);
      // Black hole starts tiny (sucking phase), then rapidly expands at the end
      const bhT = Math.max(0, elapsed / T_TOTAL); 
      // Exponential curve: stays small for a long time, then shoots up
      const easeBhT = Math.pow(bhT, 4.5); 
      const bhRadius = Math.max(2 + elapsed * 0.005, maxR * easeBhT); // Minimum size that slowly grows, then explodes

      // ── 1. GLASS SHATTER PHASE ──
      if (glassT > 0 && glassT < 1) {
        ctx.fillStyle = `rgba(0,0,0,${glassT * 0.4})`;
        ctx.fillRect(0, 0, W, H);

        const crackReveal = Math.pow(glassT, 0.5);
        cracks.forEach(c => {
          const lt = Math.min(crackReveal * 1.5, 1);
          ctx.beginPath();
          ctx.moveTo(c.x1, c.y1);
          ctx.lineTo(c.x1 + (c.x2 - c.x1) * lt, c.y1 + (c.y2 - c.y1) * lt);
          ctx.strokeStyle = `rgba(230,250,255,${Math.max(0, 1.0 - c.depth * 0.15 - glassT)})`; // Fades out
          ctx.lineWidth = Math.max(0.5, 3.5 - c.depth * 0.8);
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = Math.max(0, 12 - c.depth * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // Sci-Fi Lightning Strikes
        if (elapsed < T_GLASS * 0.8) {
          if (elapsed - lastLightningMs > 50 + Math.random() * 80) {
            lightningBolts = Array.from({length: 5}).map(makeBolt);
            lastLightningMs = elapsed;
          }
          ctx.save();
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 35;
          ctx.shadowColor = '#a200ff'; // Purple lightning
          lightningBolts.forEach(bolt => {
            ctx.beginPath();
            ctx.moveTo(bolt[0][0], bolt[0][1]);
            bolt.slice(1).forEach(([bx, by]) => ctx.lineTo(bx, by));
            ctx.strokeStyle = `rgba(200,100,255,${0.8 + Math.random() * 0.2})`;
            ctx.stroke();
          });
          ctx.restore();
          
          if (Math.random() < 0.1) {
            ctx.fillStyle = `rgba(160,0,255,${Math.random() * 0.2})`;
            ctx.fillRect(0, 0, W, H);
          }
        }
      }

      // ── 2. BLACK HOLE (3D Interstellar Style) ──
      ctx.save();
      ctx.translate(cx, cy);

      // Back half of accretion disk
      drawAccretionDisk(elapsed, easeBhT, bhRadius, true);
      
      // Event Horizon
      ctx.beginPath();
      ctx.arc(0, 0, bhRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.shadowBlur = 50 * (1 - easeBhT);
      ctx.shadowColor = '#000';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Front half of accretion disk
      drawAccretionDisk(elapsed, easeBhT, bhRadius, false);

      ctx.restore();

      // Atmospheric fade-to-black vignette as it expands
      if (easeBhT > 0.1) {
        ctx.fillStyle = `rgba(0,0,0,${easeBhT * 1.5})`;
        ctx.fillRect(0, 0, W, H);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 20000, pointerEvents: 'none'
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Main Report Component
// ─────────────────────────────────────────────────────────────
export default function Report() {
  const navigate = useNavigate();
  const { testConfig, testResults } = useTest();
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  // ── Core metrics ──
  const roundedRealSpeed = testResults ? Math.round(testResults.realSpeed) : 0;
  const accuracy = (testResults && testResults.grossWpm > 0)
    ? Math.max(0, (testResults.realSpeed / testResults.grossWpm) * 100)
    : 0;

  // ── Tier classification ──
  const isApex             = roundedRealSpeed >= 40;
  const isUltimatePerfect  = !isApex && roundedRealSpeed >= 35 && accuracy >= 93;
  const isHighSpeedOnly    = !isApex && roundedRealSpeed >= 35 && accuracy < 93;
  const isHighAccuracyOnly = roundedRealSpeed < 35 && accuracy >= 93;

  // ── Apex state machine ──
  // Stage 0: Zenitsu Video (if isApex or isHighSpeedOnly)
  // Stage 1: Levi GIF (if isApex + 93%+ accuracy)
  // Stage 2: Report Page 4s Wait (Shortened for speed)
  // Stage 3: Canvas Glass + Swallow DOM + 3D Black Hole
  // Stage 4: Dark Typing Video
  // Stage 5: Done (stay on Report)
  const [apexStage, setApexStage] = useState(() => {
    if (isApex || isHighSpeedOnly) return 0; // Start at Zenitsu
    if (isHighAccuracyOnly) return 1;        // Start at Levi
    return 2;                                // Default Report
  });

  const [fadeOverlayOut, setFadeOverlayOut] = useState(false);
  const zenitsuVideoRef = useRef(null);
  const gutsVideoRef = useRef(null);
  const darkVideoRef = useRef(null);

  // Swallow effect state (applies CSS class)
  const [swallowed, setSwallowed] = useState(false);

  // Countdown timer state for 4s wait on report page
  const [countdown, setCountdown] = useState(4);

  // ──────────────────────────────────────────────
  // STAGE 0: Zenitsu Video Auto-play & Timer
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (apexStage === 0) {
      if (zenitsuVideoRef.current) {
        zenitsuVideoRef.current.currentTime = 0;
        zenitsuVideoRef.current.play().catch(() => {});
      }
      const fadeTimer = setTimeout(() => setFadeOverlayOut(true), 23000);
      const endTimer = setTimeout(() => advanceFromZenitsu(), 24000);
      return () => { clearTimeout(fadeTimer); clearTimeout(endTimer); };
    }
  }, [apexStage]);

  const advanceFromZenitsu = () => {
    setFadeOverlayOut(false);
    if (isApex) {
      if (accuracy >= 93) {
        setApexStage(1); // Go to Levi GIF
      } else {
        setApexStage(2); // Skip Levi, go to Report Wait
      }
    } else {
      setApexStage(5); // High Speed Only done -> stay on report
    }
  };

  const skipZenitsu = () => {
    setFadeOverlayOut(true);
    setTimeout(() => advanceFromZenitsu(), 400);
  };

  const handleZenitsuTimeUpdate = () => {
    if (zenitsuVideoRef.current && zenitsuVideoRef.current.currentTime >= 24 && !fadeOverlayOut) {
      skipZenitsu();
    }
  };

  // ──────────────────────────────────────────────
  // STAGE 1: Levi GIF (5 Seconds)
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (apexStage === 1) {
      const timer = setTimeout(() => {
        if (isApex) {
          setApexStage(2); // Go to Report Wait
        } else {
          setApexStage(5); // High Accuracy Only done -> stay on report
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [apexStage, isApex]);

  // ──────────────────────────────────────────────
  // STAGE 2: 4 Seconds Wait on Report Page (Apex & Ultimate)
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (apexStage === 2 && isApex) {
      setCountdown(4); // Reduced from 10s to 4s
      const interval = setInterval(() => {
        setCountdown(prev => (prev > 1 ? prev - 1 : 1));
      }, 1000);

      const waitTimer = setTimeout(() => {
        setApexStage(3); // Start Canvas Transition!
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(waitTimer);
      };
    }
  }, [apexStage, isApex]);

  // ──────────────────────────────────────────────
  // ULTIMATE PERFECT (35-39 WPM + 93%+): Guts Video after 4s
  // ──────────────────────────────────────────────
  const [showGutsVideo, setShowGutsVideo] = useState(false);
  const [fadeGutsOut, setFadeGutsOut] = useState(false);

  useEffect(() => {
    if (isUltimatePerfect) {
      const timer = setTimeout(() => {
        setShowGutsVideo(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isUltimatePerfect]);

  useEffect(() => {
    if (showGutsVideo && gutsVideoRef.current) {
      gutsVideoRef.current.currentTime = 0;
      gutsVideoRef.current.play().catch(() => {});
    }
  }, [showGutsVideo]);

  const handleGutsEnded = () => {
    setFadeGutsOut(true);
    setTimeout(() => { setShowGutsVideo(false); setFadeGutsOut(false); }, 1000);
  };

  // ──────────────────────────────────────────────
  // STAGE 4: Dark Typing Video (Apex Tier)
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (apexStage === 4 && darkVideoRef.current) {
      darkVideoRef.current.currentTime = 0;
      darkVideoRef.current.play().catch(() => {});
    }
  }, [apexStage]);

  const handleDarkVideoEnded = () => {
    setFadeOverlayOut(true);
    setTimeout(() => { setFadeOverlayOut(false); setSwallowed(false); setApexStage(5); }, 800);
  };
  const skipDarkVideo = () => handleDarkVideoEnded();

  // ──────────────────────────────────────────────
  // ERROR PANEL HELPERS
  // ──────────────────────────────────────────────
  const getDetailsForCategory = (category) => {
    if (!testResults) return [];
    switch (category) {
      case 'wrongSpelling':   return testResults.wrongSpellingDetails || [];
      case 'extraWord':       return testResults.extraWordDetails || [];
      case 'lessWord':        return testResults.lessWordDetails || [];
      case 'punctuationError':return testResults.punctuationErrorDetails || [];
      case 'caseError':       return testResults.caseErrorDetails || [];
      case 'spaceDisparity':  return testResults.spaceDisparityDetails || [];
      default:                return [];
    }
  };

  if (!testResults || testResults.timeTakenSeconds === 0) {
    return (
      <div className="report-container">
        <p>No results found. Please take a test first.</p>
        <button onClick={() => navigate('/')} className="submit-btn">Go to Setup</button>
      </div>
    );
  }

  const minutes = Math.floor(testResults.timeTakenSeconds / 60);
  const seconds = testResults.timeTakenSeconds % 60;
  const timeTakenStr = `${minutes}m ${seconds}s`;

  const copyPromptText = `Evaluation Rules:
- Gross WPM: (Total Keystrokes / 5) / Time (min)
- Real Speed (Net WPM): ((Gross Keystrokes / 5) - Penalties) / Time (min)
- Penalties:
  * Wrong word spelling is one error
  * Extra word added is one error
  * Less word typed is one error
  * Punctuation is one error
  * Upper/lower case is one error
  * Space disparity is one error

Test Performance:
- Name: ${testConfig.name}
- Test No: ${testConfig.practiceNo}
- Time Taken: ${timeTakenStr}

Original Paragraph:
-------------------
${testResults.targetText}

Typed Paragraph:
----------------
${testResults.typedText}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(copyPromptText)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(err => console.error('Failed to copy text: ', err));
  };

  let speedMessage = '', speedColor = '';
  if (roundedRealSpeed < 30)       { speedMessage = 'You can do better!';     speedColor = '#dc2626'; }
  else if (roundedRealSpeed < 35)  { speedMessage = 'Good Word! Keep it up!'; speedColor = '#d97706'; }
  else if (roundedRealSpeed < 40)  { speedMessage = 'OMG! JOB IS YOURS!';     speedColor = '#16a34a'; }
  else                             { speedMessage = 'ABSOLUTE APEX TYPIST!';   speedColor = '#a855f7'; }

  const overlayBtn = {
    position: 'absolute', top: '20px', right: '20px',
    backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
    padding: '10px 20px', borderRadius: '24px',
    cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
    zIndex: 20005, backdropFilter: 'blur(8px)',
    boxShadow: '0 0 15px rgba(0,0,0,0.5)'
  };

  return (
    <div className="report-page-container" style={{ overflow: 'hidden' }}>

      {/* ═══ STAGE 3: APEX CANVAS TRANSITION ═══ */}
      {apexStage === 3 && (
        <ApexTransitionCanvas
          onSwallow={() => setSwallowed(true)}
          onComplete={() => setApexStage(4)}
        />
      )}

      {/* ═══ STAGE 4: DARK TYPING VIDEO (Apex) ═══ */}
      {apexStage === 4 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000', zIndex: 19000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          transition: 'opacity 0.8s ease-in-out',
          opacity: fadeOverlayOut ? 0 : 1
        }}>
          <video
            ref={darkVideoRef}
            src="/dark_typing.mp4"
            autoPlay playsInline
            onEnded={handleDarkVideoEnded}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button onClick={skipDarkVideo} style={overlayBtn}>Back to Report ✕</button>
        </div>
      )}

      {/* ═══ STAGE 0: ZENITSU VIDEO (Apex OR 35-39 WPM) ═══ */}
      {apexStage === 0 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000', zIndex: 19000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          transition: 'opacity 0.8s ease-in-out',
          opacity: fadeOverlayOut ? 0 : 1
        }}>
          <video
            ref={zenitsuVideoRef}
            src="/zenitsu.mp4"
            autoPlay playsInline
            onTimeUpdate={handleZenitsuTimeUpdate}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button onClick={skipZenitsu} style={overlayBtn}>Skip Video ✕</button>
        </div>
      )}

      {/* ═══ STAGE 1: LEVI GIF (Apex 93%+ OR <35 WPM 93%+) ═══ */}
      {apexStage === 1 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.88)', pointerEvents: 'none', zIndex: 18000,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', gap: '24px', padding: '20px'
        }}>
          <img src="/perfection_png.png" style={{ maxWidth: '450px', width: '85%', filter: 'drop-shadow(0 0 25px rgba(255,215,0,0.95))' }} alt="Perfection" />
          <img src="/levi.gif" style={{ maxWidth: '650px', width: '90%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 0 40px rgba(0,240,255,0.8)' }} alt="Levi" />
        </div>
      )}

      {/* ═══ GUTS VIDEO (35-39 WPM + 93%+) ═══ */}
      {showGutsVideo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000', zIndex: 19000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          transition: 'opacity 0.8s ease-in-out',
          opacity: fadeGutsOut ? 0 : 1
        }}>
          <video
            ref={gutsVideoRef}
            src="/guts.mp4"
            autoPlay playsInline
            onEnded={handleGutsEnded}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button onClick={handleGutsEnded} style={overlayBtn}>Back to Report ✕</button>
        </div>
      )}

      {/* ═══ FIREWORKS + CONGRATS OVERLAY (Apex OR 35-39 WPM) ═══ */}
      {(isApex || isHighSpeedOnly) && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/fireworks.gif" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="Fireworks" />
          <img src="/congrats_png.png" style={{ zIndex: 51, maxWidth: '400px' }} alt="Congrats" />
        </div>
      )}

      {/* ═══ APEX COUNTDOWN BANNER (Shown during Stage 2 wait on report page) ═══ */}
      {isApex && apexStage === 2 && (
        <div style={{
          position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15, 7, 32, 0.92)', color: '#c084fc',
          border: '2px solid #a855f7', borderRadius: '30px',
          padding: '10px 24px', zIndex: 1000,
          boxShadow: '0 0 25px rgba(168, 85, 247, 0.6)',
          display: 'flex', alignItems: 'center', gap: '12px',
          fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '1rem'
        }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span>BLACK HOLE ERUPTION IN <span style={{ color: '#fff', fontSize: '1.2rem' }}>{countdown}s</span></span>
          <button
            onClick={() => setApexStage(3)}
            style={{
              marginLeft: '8px', background: '#a855f7', color: '#fff',
              border: 'none', borderRadius: '14px', padding: '4px 12px',
              fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            Trigger Now 🔥
          </button>
        </div>
      )}

      {/* ═══ SPEED MESSAGE (Animated on swallow) ═══ */}
      <h1 className={swallowed ? "swallowed-element" : ""} style={{ fontSize: '3rem', fontWeight: 'bold', color: speedColor, marginBottom: '20px', textAlign: 'center', zIndex: 10 }}>
        {speedMessage}
      </h1>

      {/* ═══ REPORT CONTENT (Animated on swallow) ═══ */}
      <div className={`report-flex-wrapper ${swallowed ? "swallowed-element" : ""}`}>
        {/* Left Panel */}
        <div className="report-left-panel">
          <div className="report-card-updated">
            <h1 style={{ color: '#1a4e7e', marginBottom: '20px', textAlign: 'center' }}>Typing Test Report</h1>
            <div className="report-header">
              <div className="report-stat"><strong>Name:</strong> {testConfig.name}</div>
              <div className="report-stat"><strong>Test No:</strong> {testConfig.practiceNo}</div>
              <div className="report-stat"><strong>Time Taken:</strong> {timeTakenStr}</div>
            </div>

            <div className="report-metrics" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              <div className="metric-box">
                <div className="metric-title">Gross WPM</div>
                <div className="metric-value">{Math.round(testResults.grossWpm)}</div>
                <div className="metric-desc">(Total Keystrokes / 5) / Time</div>
              </div>
              <div className="metric-box">
                <div className="metric-title">Real Speed</div>
                <div className="metric-value">{Math.round(testResults.realSpeed)}</div>
                <div className="metric-desc">((Keystrokes / 5) − Penalties) / Time</div>
              </div>
              <div className="metric-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <div className="metric-title" style={{ color: '#15803d' }}>Accuracy</div>
                <div className="metric-value" style={{ color: '#15803d' }}>{accuracy.toFixed(1)}%</div>
                <div className="metric-desc" style={{ color: '#16a34a' }}>((Net / Gross) × 100)</div>
              </div>
              <div className="metric-box">
                <div className="metric-title">Total Penalties</div>
                <div className="metric-value">{testResults.errors}</div>
              </div>
              <div className="metric-box">
                <div className="metric-title">Total Keystrokes</div>
                <div className="metric-value">{testResults.totalKeystrokes}</div>
              </div>
            </div>

            <div className="error-analysis">
              <h2>Detailed Error Analysis (Penalties)</h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '-5px', marginBottom: '15px' }}>Click on a category to view specific mistakes.</p>
              <div className="report-metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                {[
                  { key: 'wrongSpelling',   label: 'Wrong Spelling',  bg: '#fef2f2', border: '#fee2e2', color: '#991b1b', val: testResults.wrongSpelling },
                  { key: 'extraWord',       label: 'Extra Word',      bg: '#fffbeb', border: '#fef3c7', color: '#92400e', val: testResults.extraWord },
                  { key: 'lessWord',        label: 'Less Word',       bg: '#f0fdf4', border: '#dcfce7', color: '#166534', val: testResults.lessWord },
                  { key: 'punctuationError',label: 'Punctuation',     bg: '#eff6ff', border: '#dbeafe', color: '#1e40af', val: testResults.punctuationError },
                  { key: 'caseError',       label: 'Case Error',      bg: '#f5f3ff', border: '#ede9fe', color: '#5b21b6', val: testResults.caseError },
                  { key: 'spaceDisparity',  label: 'Space Disparity', bg: '#fdf4ff', border: '#fae8ff', color: '#86198f', val: testResults.spaceDisparity },
                ].map(({ key, label, bg, border, color, val }) => (
                  <div key={key} className="metric-box" style={{ background: bg, borderColor: border, cursor: 'pointer' }} onClick={() => setActiveCategory(key)}>
                    <div className="metric-title" style={{ color }}>{label}</div>
                    <div className="metric-value" style={{ color }}>{val}</div>
                  </div>
                ))}
              </div>

              {activeCategory && (
                <div className="mistakes-list" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>
                      {{ wrongSpelling: 'Wrong Spelling', extraWord: 'Extra Word', lessWord: 'Less Word', punctuationError: 'Punctuation', caseError: 'Case Error', spaceDisparity: 'Space Disparity' }[activeCategory]} Mistakes
                    </h3>
                    <button onClick={() => setActiveCategory(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                  </div>
                  {getDetailsForCategory(activeCategory).length > 0 ? (
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                      {getDetailsForCategory(activeCategory).map((m, idx) => (
                        <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '15px' }}>
                          <span style={{ color: '#16a34a', flex: 1 }}><strong>Expected:</strong> {m.expected}</span>
                          <span style={{ color: '#dc2626', flex: 1 }}><strong>Typed:</strong> {m.typed}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, color: '#64748b' }}>No mistakes in this category.</p>
                  )}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button onClick={() => navigate('/')} className="submit-btn start-again-btn">Start Another Test</button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="report-right-panel">
          <div className="prompt-card">
            <div className="prompt-header-box">
              <h2>Evaluation &amp; Text Details</h2>
              <button onClick={handleCopy} className="copy-prompt-btn">
                {copied ? '✓ Copied!' : '📋 Copy Report Details'}
              </button>
            </div>
            <textarea readOnly className="prompt-textarea" value={copyPromptText} />
          </div>
        </div>

      </div>
    </div>
  );
}
