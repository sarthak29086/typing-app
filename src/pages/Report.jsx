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
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.1;

    // ── Build glass crack tree from center ──
    const cracks = [];
    const addCrack = (x, y, angle, len, depth) => {
      if (depth > 3 || len < 25) return;
      const ex = x + Math.cos(angle) * len;
      const ey = y + Math.sin(angle) * len;
      cracks.push({ x1: x, y1: y, x2: ex, y2: ey, depth });
      const branches = depth === 0 ? 3 : (Math.random() < 0.7 ? 2 : 1);
      for (let b = 0; b < branches; b++) {
        const ba = angle + (Math.random() - 0.5) * 1.4;
        const bl = len * (0.25 + Math.random() * 0.35);
        const t = 0.35 + Math.random() * 0.45;
        addCrack(
          x + Math.cos(angle) * len * t,
          y + Math.sin(angle) * len * t,
          ba, bl, depth + 1
        );
      }
    };
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      addCrack(cx, cy, a, maxR * (0.8 + Math.random() * 0.2), 0);
    }

    // ── Timing constants (ms) ──
    const T_GLASS = 2500;
    const T_LIGHTNING_END = 2000;
    const T_BH = 4000;
    const T_TOTAL = T_GLASS + T_BH; // 6500ms

    let start = null, rafId;
    let lightningBolts = [], lastLightningMs = -999;

    const makeBolt = () => {
      const pts = [];
      const a = Math.random() * Math.PI * 2;
      const len = 160 + Math.random() * 250;
      let x = cx + (Math.random() - 0.5) * 100;
      let y = cy + (Math.random() - 0.5) * 100;
      pts.push([x, y]);
      for (let s = 0; s < 14; s++) {
        x += Math.cos(a) * len / 14 + (Math.random() - 0.5) * 50;
        y += Math.sin(a) * len / 14 + (Math.random() - 0.5) * 50;
        pts.push([x, y]);
      }
      return pts;
    };

    const draw = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;

      // When animation is done, fill black and call callback
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
        // Progressive dark overlay
        ctx.fillStyle = `rgba(0,0,0,${glassT * 0.6})`;
        ctx.fillRect(0, 0, W, H);

        // Glass cracks
        const crackReveal = Math.min(glassT * 1.8, 1);
        cracks.forEach(c => {
          const lt = Math.min(crackReveal * 1.3, 1);
          ctx.beginPath();
          ctx.moveTo(c.x1, c.y1);
          ctx.lineTo(c.x1 + (c.x2 - c.x1) * lt, c.y1 + (c.y2 - c.y1) * lt);
          ctx.strokeStyle = `rgba(210,235,255,${Math.max(0, 0.8 - c.depth * 0.18)})`;
          ctx.lineWidth = Math.max(0.4, 2.8 - c.depth * 0.8);
          ctx.shadowColor = '#80b4ff';
          ctx.shadowBlur = Math.max(0, 7 - c.depth * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // Lightning bolts (first 2 seconds only)
        if (elapsed < T_LIGHTNING_END) {
          if (elapsed - lastLightningMs > 70 + Math.random() * 130) {
            lightningBolts = [makeBolt(), makeBolt(), makeBolt()];
            lastLightningMs = elapsed;
          }
          ctx.save();
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 28;
          ctx.shadowColor = '#00ccff';
          lightningBolts.forEach(bolt => {
            ctx.beginPath();
            ctx.moveTo(bolt[0][0], bolt[0][1]);
            bolt.slice(1).forEach(([bx, by]) => ctx.lineTo(bx, by));
            ctx.strokeStyle = `rgba(100,200,255,${0.65 + Math.random() * 0.35})`;
            ctx.stroke();
          });
          ctx.restore();
          // Occasional screen flash
          if (Math.random() < 0.07) {
            ctx.fillStyle = `rgba(70,130,255,${Math.random() * 0.2})`;
            ctx.fillRect(0, 0, W, H);
          }
        }
      }

      // ── BLACK HOLE PHASE ──
      if (bhT > 0) {
        const bhRadius = maxR * Math.pow(bhT, 0.55); // ease-in expansion

        // Outer purple/violet glow ring
        const gGrad = ctx.createRadialGradient(cx, cy, bhRadius * 0.8, cx, cy, bhRadius * 1.45);
        gGrad.addColorStop(0, 'rgba(0,0,0,0)');
        gGrad.addColorStop(0.4, `rgba(90,0,180,${0.75 * (1 - bhT * 0.4)})`);
        gGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, bhRadius * 1.45, 0, Math.PI * 2);
        ctx.fillStyle = gGrad;
        ctx.fill();

        // Spiraling accretion disk particles
        for (let i = 0; i < 110; i++) {
          const baseA = (i / 110) * Math.PI * 2;
          const angle = baseA + bhT * Math.PI * 14; // spins faster as it grows
          const pR = bhRadius + Math.sin(i * 1.7 + bhT * 22) * 18 * (1 - bhT * 0.75) + 4;
          const pSize = Math.max(0.5, 2.2 * (1 - bhT * 0.55));
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(angle) * pR,
            cy + Math.sin(angle) * pR,
            pSize, 0, Math.PI * 2
          );
          ctx.fillStyle = `hsla(${260 + Math.sin(i * 0.8) * 40}, 100%, 75%, ${0.9 - bhT * 0.3})`;
          ctx.fill();
        }

        // The hole itself — solid black
        ctx.beginPath();
        ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();

        // Subtle inner rings (accretion disk depth)
        [0.58, 0.33, 0.14].forEach((ratio, i) => {
          const rR = bhRadius * ratio;
          if (rR < 3) return;
          const rg = ctx.createRadialGradient(cx, cy, rR * 0.55, cx, cy, rR);
          rg.addColorStop(0, `rgba(120,0,220,${0.28 - i * 0.08})`);
          rg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.beginPath();
          ctx.arc(cx, cy, rR, 0, Math.PI * 2);
          ctx.fillStyle = rg;
          ctx.fill();
        });
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
  // Tier 1 – APEX:             speed >= 40 (ALL celebrations + 10s + black hole + dark video)
  // Tier 2 – ULTIMATE:         35 <= speed < 40 AND accuracy >= 93% (Guts video)
  // Tier 3 – HIGH_SPEED:       35 <= speed < 40 AND accuracy < 93%  (Zenitsu video + fireworks)
  // Tier 4 – HIGH_ACCURACY:    speed < 35 AND accuracy >= 93%       (Levi GIF)
  const isApex             = roundedRealSpeed >= 40;
  const isUltimatePerfect  = !isApex && roundedRealSpeed >= 35 && accuracy >= 93;
  const isHighSpeedOnly    = !isApex && roundedRealSpeed >= 35 && accuracy < 93;
  const isHighAccuracyOnly = roundedRealSpeed < 35 && accuracy >= 93;

  // Zenitsu plays for: Apex AND High Speed Only
  const zenitsuOnLoad = isApex || isHighSpeedOnly;

  // ── Zenitsu video state ──
  const [showZenitsuOverlay, setShowZenitsuOverlay] = useState(zenitsuOnLoad);
  const [fadeZenitsuOut, setFadeZenitsuOut] = useState(false);
  const zenitsuVideoRef = useRef(null);

  // ── Levi GIF state ──
  // Initialised true only for High Accuracy Only (standalone)
  // For Apex: triggered after Zenitsu ends (if accuracy >= 93)
  const [showPerfectionOverlay, setShowPerfectionOverlay] = useState(isHighAccuracyOnly);

  // ── Guts video state (Ultimate Perfection only) ──
  const [showGutsOverlay, setShowGutsOverlay] = useState(false);
  const [fadeGutsIn, setFadeGutsIn] = useState(false);
  const [fadeGutsOut, setFadeGutsOut] = useState(false);
  const gutsVideoRef = useRef(null);

  // ── Apex sequence state ──
  // 'idle' → 'waiting' (10s on report) → 'transition' (canvas) → 'video' (dark video) → 'done'
  const [apexPhase, setApexPhase] = useState('idle');
  const [showDarkVideo, setShowDarkVideo] = useState(false);
  const [fadeDarkVideoOut, setFadeDarkVideoOut] = useState(false);
  const darkVideoRef = useRef(null);

  // ──────────────────────────────────────────────
  // ZENITSU – auto-play & auto-dismiss at 24s
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (zenitsuOnLoad && showZenitsuOverlay) {
      if (zenitsuVideoRef.current) {
        zenitsuVideoRef.current.currentTime = 0;
        zenitsuVideoRef.current.play().catch(() => {});
      }
      const fadeTimer = setTimeout(() => setFadeZenitsuOut(true), 23000);
      const removeTimer = setTimeout(() => setShowZenitsuOverlay(false), 24000);
      return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
    }
  }, [zenitsuOnLoad, showZenitsuOverlay]);

  const handleZenitsuTimeUpdate = () => {
    if (zenitsuVideoRef.current && zenitsuVideoRef.current.currentTime >= 24 && !fadeZenitsuOut) {
      setFadeZenitsuOut(true);
      setTimeout(() => setShowZenitsuOverlay(false), 1000);
    }
  };
  const skipZenitsu = () => {
    setFadeZenitsuOut(true);
    setTimeout(() => setShowZenitsuOverlay(false), 500);
  };

  // ──────────────────────────────────────────────
  // LEVI GIF – trigger AFTER Zenitsu for Apex tier;
  // standalone 5s for High Accuracy Only
  // ──────────────────────────────────────────────
  useEffect(() => {
    // When Zenitsu finishes for Apex + high accuracy, show Levi
    if (!showZenitsuOverlay && isApex && accuracy >= 93 && apexPhase === 'idle') {
      setShowPerfectionOverlay(true);
    }
  }, [showZenitsuOverlay, isApex, accuracy, apexPhase]);

  useEffect(() => {
    if (showPerfectionOverlay) {
      const timer = setTimeout(() => setShowPerfectionOverlay(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showPerfectionOverlay]);

  // ──────────────────────────────────────────────
  // GUTS VIDEO – Ultimate Perfection (35-39 + 93%+)
  // Wait 10s on report, then fade in
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (isUltimatePerfect) {
      const waitTimer = setTimeout(() => {
        setFadeGutsIn(true);
        setShowGutsOverlay(true);
      }, 10000);
      return () => clearTimeout(waitTimer);
    }
  }, [isUltimatePerfect]);

  useEffect(() => {
    if (showGutsOverlay && gutsVideoRef.current) {
      gutsVideoRef.current.currentTime = 0;
      gutsVideoRef.current.play().catch(() => {});
    }
  }, [showGutsOverlay]);

  const handleGutsVideoEnded = () => {
    setFadeGutsOut(true);
    setTimeout(() => { setShowGutsOverlay(false); setFadeGutsIn(false); setFadeGutsOut(false); }, 1000);
  };

  // ──────────────────────────────────────────────
  // APEX SEQUENCE – 10s wait → canvas → dark video
  // Fires when Zenitsu + Levi have both finished
  // ──────────────────────────────────────────────
  const apexCelebrationsDone = isApex && !showZenitsuOverlay && !showPerfectionOverlay;

  useEffect(() => {
    if (apexCelebrationsDone && apexPhase === 'idle') {
      setApexPhase('waiting');
      const waitTimer = setTimeout(() => {
        setApexPhase('transition');
      }, 10000);
      return () => clearTimeout(waitTimer);
    }
  }, [apexCelebrationsDone, apexPhase]);

  // When dark video starts, play it
  useEffect(() => {
    if (showDarkVideo && darkVideoRef.current) {
      darkVideoRef.current.currentTime = 0;
      darkVideoRef.current.play().catch(() => {});
    }
  }, [showDarkVideo]);

  const handleDarkVideoEnded = () => {
    setFadeDarkVideoOut(true);
    setTimeout(() => { setShowDarkVideo(false); setFadeDarkVideoOut(false); setApexPhase('done'); }, 1000);
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

  // ──────────────────────────────────────────────
  // GUARD – no results yet
  // ──────────────────────────────────────────────
  if (!testResults || testResults.timeTakenSeconds === 0) {
    return (
      <div className="report-container">
        <p>No results found. Please take a test first.</p>
        <button onClick={() => navigate('/')} className="submit-btn">Go to Setup</button>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────
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
    backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '8px 16px', borderRadius: '20px',
    cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
    zIndex: 10002, backdropFilter: 'blur(4px)'
  };

  // ──────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────
  return (
    <div className="report-page-container">

      {/* ═══ APEX CANVAS TRANSITION (glass + lightning + black hole) ═══ */}
      {apexPhase === 'transition' && (
        <ApexTransitionCanvas
          onComplete={() => {
            setApexPhase('video');
            setShowDarkVideo(true);
          }}
        />
      )}

      {/* ═══ DARK TYPING VIDEO (Apex – plays after canvas transition) ═══ */}
      {showDarkVideo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000', zIndex: 10000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          transition: 'opacity 1s ease-in-out',
          opacity: fadeDarkVideoOut ? 0 : 1,
          pointerEvents: fadeDarkVideoOut ? 'none' : 'auto'
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

      {/* ═══ ZENITSU VIDEO (Apex + High Speed Only) ═══ */}
      {zenitsuOnLoad && showZenitsuOverlay && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000', zIndex: 10000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          transition: 'opacity 1s ease-in-out',
          opacity: fadeZenitsuOut ? 0 : 1,
          pointerEvents: fadeZenitsuOut ? 'none' : 'auto'
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

      {/* ═══ LEVI GIF + PERFECTION (High Accuracy Only OR Apex after Zenitsu) ═══ */}
      {showPerfectionOverlay && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)', pointerEvents: 'none', zIndex: 9999,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', gap: '24px', padding: '20px'
        }}>
          <img src="/perfection_png.png" style={{ maxWidth: '450px', width: '85%', filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.9))' }} alt="Perfection" />
          <img src="/levi.gif" style={{ maxWidth: '650px', width: '90%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 0 35px rgba(0,240,255,0.7)' }} alt="Levi" />
        </div>
      )}

      {/* ═══ GUTS VIDEO (Ultimate Perfection – 35-39 WPM + 93%+) ═══ */}
      {showGutsOverlay && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000', zIndex: 10000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          transition: 'opacity 1s ease-in-out',
          opacity: fadeGutsOut ? 0 : (fadeGutsIn ? 1 : 0),
          pointerEvents: fadeGutsOut ? 'none' : 'auto'
        }}>
          <video
            ref={gutsVideoRef}
            src="/guts.mp4"
            autoPlay playsInline
            onEnded={handleGutsVideoEnded}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button onClick={handleGutsVideoEnded} style={overlayBtn}>Back to Report ✕</button>
        </div>
      )}

      {/* ═══ FIREWORKS + CONGRATS (Apex AND High Speed Only) ═══ */}
      {(isApex || isHighSpeedOnly) && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/fireworks.gif" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="Fireworks" />
          <img src="/congrats_png.png" style={{ zIndex: 51, maxWidth: '400px' }} alt="Congrats" />
        </div>
      )}

      {/* ═══ SPEED MESSAGE ═══ */}
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: speedColor, marginBottom: '20px', textAlign: 'center', zIndex: 10 }}>
        {speedMessage}
      </h1>

      {/* ═══ REPORT CONTENT ═══ */}
      <div className="report-flex-wrapper">

        {/* Left – Metrics */}
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

        {/* Right – Copy prompt */}
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
