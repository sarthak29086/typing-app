import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../context/TestContext';

// ─────────────────────────────────────────────────────────────
// Canvas animation: glass crack → lightning → spiral black hole
// Used exclusively for the 40+ WPM "Apex" tier
// ─────────────────────────────────────────────────────────────
function ApexTransitionCanvas({ onComplete }) {
  const canvasRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const cx = W / 2, cy = H / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.25;

    // ── Build glass crack tree from center ──
    const cracks = [];
    const addCrack = (x, y, angle, len, depth) => {
      if (depth > 3 || len < 20) return;
      const ex = x + Math.cos(angle) * len;
      const ey = y + Math.sin(angle) * len;
      cracks.push({ x1: x, y1: y, x2: ex, y2: ey, depth });
      const branches = depth === 0 ? 3 : (Math.random() < 0.75 ? 2 : 1);
      for (let b = 0; b < branches; b++) {
        const ba = angle + (Math.random() - 0.5) * 1.4;
        const bl = len * (0.25 + Math.random() * 0.35);
        const t = 0.3 + Math.random() * 0.5;
        addCrack(
          x + Math.cos(angle) * len * t,
          y + Math.sin(angle) * len * t,
          ba, bl, depth + 1
        );
      }
    };
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      addCrack(cx, cy, a, maxR * (0.8 + Math.random() * 0.25), 0);
    }

    // ── Timing constants (ms) ──
    const T_GLASS = 2200;
    const T_LIGHTNING_END = 2000;
    const T_BH = 3800;
    const T_TOTAL = T_GLASS + T_BH; // 6000ms

    let start = null, rafId;
    let lightningBolts = [], lastLightningMs = -999;

    const makeBolt = () => {
      const pts = [];
      const a = Math.random() * Math.PI * 2;
      const len = 180 + Math.random() * 300;
      let x = cx + (Math.random() - 0.5) * 120;
      let y = cy + (Math.random() - 0.5) * 120;
      pts.push([x, y]);
      for (let s = 0; s < 14; s++) {
        x += Math.cos(a) * len / 14 + (Math.random() - 0.5) * 60;
        y += Math.sin(a) * len / 14 + (Math.random() - 0.5) * 60;
        pts.push([x, y]);
      }
      return pts;
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
      const bhElapsed = Math.max(0, elapsed - T_GLASS);
      const bhT = Math.min(bhElapsed / T_BH, 1);

      // ── GLASS + LIGHTNING PHASE ──
      if (glassT > 0) {
        ctx.fillStyle = `rgba(0,0,0,${glassT * 0.65})`;
        ctx.fillRect(0, 0, W, H);

        const crackReveal = Math.min(glassT * 1.8, 1);
        cracks.forEach(c => {
          const lt = Math.min(crackReveal * 1.3, 1);
          ctx.beginPath();
          ctx.moveTo(c.x1, c.y1);
          ctx.lineTo(c.x1 + (c.x2 - c.x1) * lt, c.y1 + (c.y2 - c.y1) * lt);
          ctx.strokeStyle = `rgba(220,240,255,${Math.max(0, 0.85 - c.depth * 0.18)})`;
          ctx.lineWidth = Math.max(0.5, 3.0 - c.depth * 0.8);
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = Math.max(0, 10 - c.depth * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        if (elapsed < T_LIGHTNING_END) {
          if (elapsed - lastLightningMs > 60 + Math.random() * 120) {
            lightningBolts = [makeBolt(), makeBolt(), makeBolt(), makeBolt()];
            lastLightningMs = elapsed;
          }
          ctx.save();
          ctx.lineWidth = 2.0;
          ctx.shadowBlur = 30;
          ctx.shadowColor = '#00e5ff';
          lightningBolts.forEach(bolt => {
            ctx.beginPath();
            ctx.moveTo(bolt[0][0], bolt[0][1]);
            bolt.slice(1).forEach(([bx, by]) => ctx.lineTo(bx, by));
            ctx.strokeStyle = `rgba(140,220,255,${0.7 + Math.random() * 0.3})`;
            ctx.stroke();
          });
          ctx.restore();

          if (Math.random() < 0.08) {
            ctx.fillStyle = `rgba(80,180,255,${Math.random() * 0.25})`;
            ctx.fillRect(0, 0, W, H);
          }
        }
      }

      // ── BLACK HOLE PHASE ──
      if (bhT > 0) {
        const bhRadius = maxR * Math.pow(bhT, 0.5);

        // Outer purple/cyan glow ring
        const gGrad = ctx.createRadialGradient(cx, cy, bhRadius * 0.75, cx, cy, bhRadius * 1.5);
        gGrad.addColorStop(0, 'rgba(0,0,0,0)');
        gGrad.addColorStop(0.35, `rgba(130,0,255,${0.85 * (1 - bhT * 0.3)})`);
        gGrad.addColorStop(0.7, `rgba(0,212,255,${0.5 * (1 - bhT * 0.5)})`);
        gGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, bhRadius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = gGrad;
        ctx.fill();

        // Spiraling accretion particles
        for (let i = 0; i < 130; i++) {
          const baseA = (i / 130) * Math.PI * 2;
          const angle = baseA + bhT * Math.PI * 16;
          const pR = bhRadius + Math.sin(i * 1.7 + bhT * 24) * 22 * (1 - bhT * 0.7) + 5;
          const pSize = Math.max(0.6, 2.5 * (1 - bhT * 0.5));
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(angle) * pR,
            cy + Math.sin(angle) * pR,
            pSize, 0, Math.PI * 2
          );
          ctx.fillStyle = `hsla(${270 + Math.sin(i * 0.8) * 50}, 100%, 75%, ${0.9 - bhT * 0.3})`;
          ctx.fill();
        }

        // Solid black hole
        ctx.beginPath();
        ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
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
  // Stage 2: Report Page 10s Wait
  // Stage 3: Canvas Glass + Lightning + Black Hole Transition
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

  // Countdown timer state for 10s wait on report page
  const [countdown, setCountdown] = useState(10);

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
  // STAGE 2: 10 Seconds Wait on Report Page (Apex & Ultimate)
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (apexStage === 2 && isApex) {
      setCountdown(10);
      const interval = setInterval(() => {
        setCountdown(prev => (prev > 1 ? prev - 1 : 1));
      }, 1000);

      const waitTimer = setTimeout(() => {
        setApexStage(3); // Start Canvas Transition!
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(waitTimer);
      };
    }
  }, [apexStage, isApex]);

  // ──────────────────────────────────────────────
  // ULTIMATE PERFECT (35-39 WPM + 93%+): Guts Video after 10s
  // ──────────────────────────────────────────────
  const [showGutsVideo, setShowGutsVideo] = useState(false);
  const [fadeGutsOut, setFadeGutsOut] = useState(false);

  useEffect(() => {
    if (isUltimatePerfect) {
      const timer = setTimeout(() => {
        setShowGutsVideo(true);
      }, 10000);
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
    setTimeout(() => { setFadeOverlayOut(false); setApexStage(5); }, 800);
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
    <div className="report-page-container">

      {/* ═══ STAGE 3: APEX CANVAS TRANSITION ═══ */}
      {apexStage === 3 && (
        <ApexTransitionCanvas
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

      {/* ═══ SPEED MESSAGE ═══ */}
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: speedColor, marginBottom: '20px', textAlign: 'center', zIndex: 10 }}>
        {speedMessage}
      </h1>

      {/* ═══ REPORT CONTENT ═══ */}
      <div className="report-flex-wrapper">

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
