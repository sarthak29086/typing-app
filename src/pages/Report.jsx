import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../context/TestContext';

export default function Report() {
  const navigate = useNavigate();
  const { testConfig, testResults } = useTest();
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  
  const roundedRealSpeed = testResults ? Math.round(testResults.realSpeed) : 0;
  const accuracy = (testResults && testResults.grossWpm > 0)
    ? Math.max(0, (testResults.realSpeed / testResults.grossWpm) * 100)
    : 0;

  // Tier classification:
  // 1. Ultimate Perfection: Speed >= 35 AND Accuracy >= 93%
  // 2. High Speed Only: Speed >= 35 AND Accuracy < 93%
  // 3. High Accuracy Only: Speed < 35 AND Accuracy >= 93%
  const isUltimatePerfection = roundedRealSpeed >= 35 && accuracy >= 93;
  const isHighSpeedOnly = roundedRealSpeed >= 35 && accuracy < 93;
  const isHighAccuracyOnly = roundedRealSpeed < 35 && accuracy >= 93;

  // Guts video state (Ultimate Perfection tier)
  const [showGutsOverlay, setShowGutsOverlay] = useState(false);
  const [fadeGutsIn, setFadeGutsIn] = useState(false);
  const [fadeGutsOut, setFadeGutsOut] = useState(false);

  // Zenitsu video state (High Speed Only tier)
  const [showZenitsuOverlay, setShowZenitsuOverlay] = useState(isHighSpeedOnly);
  const [fadeZenitsuOut, setFadeZenitsuOut] = useState(false);

  // Perfection (Levi GIF) state (High Accuracy Only tier)
  const [showPerfectionOverlay, setShowPerfectionOverlay] = useState(isHighAccuracyOnly);

  const zenitsuVideoRef = useRef(null);
  const gutsVideoRef = useRef(null);

  // Tier 1: Guts video logic — Waits 10 seconds on report page, then fades into Guts video
  useEffect(() => {
    if (isUltimatePerfection) {
      const waitTimer = setTimeout(() => {
        setFadeGutsIn(true);
        setShowGutsOverlay(true);
      }, 10000); // 10 seconds on report page

      return () => clearTimeout(waitTimer);
    }
  }, [isUltimatePerfection]);

  // When Guts video starts playing in DOM
  useEffect(() => {
    if (showGutsOverlay && gutsVideoRef.current) {
      gutsVideoRef.current.currentTime = 0;
      gutsVideoRef.current.play().catch(err => console.log("Guts video play error:", err));
    }
  }, [showGutsOverlay]);

  const handleGutsVideoEnded = () => {
    setFadeGutsOut(true);
    setTimeout(() => {
      setShowGutsOverlay(false);
      setFadeGutsIn(false);
      setFadeGutsOut(false);
    }, 1000);
  };

  const skipGutsVideo = () => {
    handleGutsVideoEnded();
  };

  // Tier 2: Zenitsu video logic for High Speed Only
  useEffect(() => {
    if (isHighSpeedOnly && showZenitsuOverlay) {
      if (zenitsuVideoRef.current) {
        zenitsuVideoRef.current.currentTime = 0;
        zenitsuVideoRef.current.play().catch(err => console.log("Autoplay playback notice:", err));
      }

      const fadeTimer = setTimeout(() => {
        setFadeZenitsuOut(true);
      }, 23000); // Start fade out at 23s

      const removeTimer = setTimeout(() => {
        setShowZenitsuOverlay(false);
      }, 24000); // Fully remove video overlay at 24s

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [isHighSpeedOnly, showZenitsuOverlay]);

  const handleZenitsuTimeUpdate = () => {
    if (zenitsuVideoRef.current && zenitsuVideoRef.current.currentTime >= 24 && !fadeZenitsuOut) {
      setFadeZenitsuOut(true);
      setTimeout(() => setShowZenitsuOverlay(false), 1000);
    }
  };

  const skipZenitsuVideo = () => {
    setFadeZenitsuOut(true);
    setTimeout(() => setShowZenitsuOverlay(false), 500);
  };

  // Tier 3: Perfection (Levi GIF) overlay logic for High Accuracy Only — 5 seconds
  useEffect(() => {
    if (isHighAccuracyOnly) {
      const timer = setTimeout(() => {
        setShowPerfectionOverlay(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isHighAccuracyOnly]);

  const getDetailsForCategory = (category) => {
    if (!testResults) return [];
    switch(category) {
      case 'wrongSpelling': return testResults.wrongSpellingDetails || [];
      case 'extraWord': return testResults.extraWordDetails || [];
      case 'lessWord': return testResults.lessWordDetails || [];
      case 'punctuationError': return testResults.punctuationErrorDetails || [];
      case 'caseError': return testResults.caseErrorDetails || [];
      case 'spaceDisparity': return testResults.spaceDisparityDetails || [];
      default: return [];
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

  // Format time taken
  const minutes = Math.floor(testResults.timeTakenSeconds / 60);
  const seconds = testResults.timeTakenSeconds % 60;
  const timeTakenStr = `${minutes}m ${seconds}s`;

  // Build the copy prompt string
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
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy text: ", err);
      });
  };

  let speedMessage = "";
  let speedColor = "";
  if (roundedRealSpeed < 30) {
    speedMessage = "You can do better!";
    speedColor = "#dc2626"; // red
  } else if (roundedRealSpeed < 35) {
    speedMessage = "Good Word! Keep it up!";
    speedColor = "#d97706"; // orange
  } else {
    speedMessage = "OMG! JOB IS YOURS!";
    speedColor = "#16a34a"; // green
  }

  return (
    <div className="report-page-container">
      {/* 1. Guts Video Overlay (Tier 1: Ultimate Perfection — speed >= 35 & accuracy >= 93%. Fades in after 10s on report page) */}
      {showGutsOverlay && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          backgroundColor: '#000', 
          zIndex: 10000, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          transition: 'opacity 1s ease-in-out',
          opacity: fadeGutsOut ? 0 : (fadeGutsIn ? 1 : 0),
          pointerEvents: fadeGutsOut ? 'none' : 'auto'
        }}>
          <video
            ref={gutsVideoRef}
            src="/guts.mp4"
            autoPlay
            playsInline
            onEnded={handleGutsVideoEnded}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button 
            onClick={skipGutsVideo}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              zIndex: 10002,
              backdropFilter: 'blur(4px)'
            }}
          >
            Back to Report ✕
          </button>
        </div>
      )}

      {/* 2. Zenitsu Video Overlay (Tier 2: High Speed Only — speed >= 35 & accuracy < 93%) */}
      {isHighSpeedOnly && showZenitsuOverlay && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          backgroundColor: '#000', 
          zIndex: 10000, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          transition: 'opacity 1s ease-in-out',
          opacity: fadeZenitsuOut ? 0 : 1,
          pointerEvents: fadeZenitsuOut ? 'none' : 'auto'
        }}>
          <video
            ref={zenitsuVideoRef}
            src="/zenitsu.mp4"
            autoPlay
            playsInline
            onTimeUpdate={handleZenitsuTimeUpdate}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button 
            onClick={skipZenitsuVideo}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              zIndex: 10002,
              backdropFilter: 'blur(4px)'
            }}
          >
            Skip Video ✕
          </button>
        </div>
      )}

      {/* 3. Perfection Overlay (Levi GIF) for Tier 3: High Accuracy Only (speed < 35 & accuracy >= 93%) */}
      {isHighAccuracyOnly && showPerfectionOverlay && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          backgroundColor: 'rgba(0, 0, 0, 0.85)', 
          pointerEvents: 'none', 
          zIndex: 9999, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '24px',
          padding: '20px'
        }}>
          <img 
            src="/perfection_png.png" 
            style={{ 
              maxWidth: '450px', 
              width: '85%', 
              filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.9))' 
            }} 
            alt="Perfection" 
          />
          <img 
            src="/levi.gif" 
            style={{ 
              maxWidth: '650px', 
              width: '90%', 
              maxHeight: '65vh', 
              objectFit: 'contain', 
              borderRadius: '12px', 
              boxShadow: '0 0 35px rgba(0, 240, 255, 0.7)' 
            }} 
            alt="Levi" 
          />
        </div>
      )}

      {/* 4. Fireworks Background for High Speed Only */}
      {isHighSpeedOnly && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/fireworks.gif" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="Fireworks" />
          <img src="/congrats_png.png" style={{ zIndex: 51, maxWidth: '400px' }} alt="Congrats" />
        </div>
      )}
      
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: speedColor, marginBottom: '20px', textAlign: 'center', zIndex: 10 }}>{speedMessage}</h1>
      
      <div className="report-flex-wrapper">
        
        {/* Left Side: Report metrics */}
        <div className="report-left-panel">
          <div className="report-card-updated">
            <h1 style={{color: '#1a4e7e', marginBottom: '20px', textAlign: 'center'}}>Typing Test Report</h1>
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
                <div className="metric-desc">((Keystrokes / 5) - Penalties) / Time</div>
              </div>
              <div className="metric-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <div className="metric-title" style={{ color: '#15803d' }}>Accuracy</div>
                <div className="metric-value" style={{ color: '#15803d' }}>{accuracy.toFixed(1)}%</div>
                <div className="metric-desc" style={{ color: '#16a34a' }}>((Net / Gross) * 100)</div>
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
                <div className="metric-box" style={{ background: '#fef2f2', borderColor: '#fee2e2', cursor: 'pointer' }} onClick={() => setActiveCategory('wrongSpelling')}>
                  <div className="metric-title" style={{ color: '#991b1b' }}>Wrong Spelling</div>
                  <div className="metric-value" style={{ color: '#991b1b' }}>{testResults.wrongSpelling}</div>
                </div>
                <div className="metric-box" style={{ background: '#fffbeb', borderColor: '#fef3c7', cursor: 'pointer' }} onClick={() => setActiveCategory('extraWord')}>
                  <div className="metric-title" style={{ color: '#92400e' }}>Extra Word</div>
                  <div className="metric-value" style={{ color: '#92400e' }}>{testResults.extraWord}</div>
                </div>
                <div className="metric-box" style={{ background: '#f0fdf4', borderColor: '#dcfce7', cursor: 'pointer' }} onClick={() => setActiveCategory('lessWord')}>
                  <div className="metric-title" style={{ color: '#166534' }}>Less Word</div>
                  <div className="metric-value" style={{ color: '#166534' }}>{testResults.lessWord}</div>
                </div>
                <div className="metric-box" style={{ background: '#eff6ff', borderColor: '#dbeafe', cursor: 'pointer' }} onClick={() => setActiveCategory('punctuationError')}>
                  <div className="metric-title" style={{ color: '#1e40af' }}>Punctuation</div>
                  <div className="metric-value" style={{ color: '#1e40af' }}>{testResults.punctuationError}</div>
                </div>
                <div className="metric-box" style={{ background: '#f5f3ff', borderColor: '#ede9fe', cursor: 'pointer' }} onClick={() => setActiveCategory('caseError')}>
                  <div className="metric-title" style={{ color: '#5b21b6' }}>Case Error</div>
                  <div className="metric-value" style={{ color: '#5b21b6' }}>{testResults.caseError}</div>
                </div>
                <div className="metric-box" style={{ background: '#fdf4ff', borderColor: '#fae8ff', cursor: 'pointer' }} onClick={() => setActiveCategory('spaceDisparity')}>
                  <div className="metric-title" style={{ color: '#86198f' }}>Space Disparity</div>
                  <div className="metric-value" style={{ color: '#86198f' }}>{testResults.spaceDisparity}</div>
                </div>
              </div>

              {activeCategory && (
                <div className="mistakes-list" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>
                      {activeCategory === 'wrongSpelling' && 'Wrong Spelling Mistakes'}
                      {activeCategory === 'extraWord' && 'Extra Word Mistakes'}
                      {activeCategory === 'lessWord' && 'Less Word Mistakes'}
                      {activeCategory === 'punctuationError' && 'Punctuation Mistakes'}
                      {activeCategory === 'caseError' && 'Case Error Mistakes'}
                      {activeCategory === 'spaceDisparity' && 'Space Disparity Mistakes'}
                    </h3>
                    <button onClick={() => setActiveCategory(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                  </div>
                  {getDetailsForCategory(activeCategory).length > 0 ? (
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                      {getDetailsForCategory(activeCategory).map((mistake, idx) => (
                        <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '15px' }}>
                          <span style={{ color: '#16a34a', flex: 1 }}><strong>Expected:</strong> {mistake.expected}</span>
                          <span style={{ color: '#dc2626', flex: 1 }}><strong>Typed:</strong> {mistake.typed}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, color: '#64748b' }}>No mistakes in this category.</p>
                  )}
                </div>
              )}
            </div>

            <div style={{textAlign: 'center', marginTop: '30px'}}>
               <button onClick={() => navigate('/')} className="submit-btn start-again-btn">Start Another Test</button>
            </div>
          </div>
        </div>

        {/* Right Side: Copy Prompt box */}
        <div className="report-right-panel">
          <div className="prompt-card">
            <div className="prompt-header-box">
              <h2>Evaluation & Text Details</h2>
              <button onClick={handleCopy} className="copy-prompt-btn">
                {copied ? '✓ Copied!' : '📋 Copy Report Details'}
              </button>
            </div>
            <textarea
              readOnly
              className="prompt-textarea"
              value={copyPromptText}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
