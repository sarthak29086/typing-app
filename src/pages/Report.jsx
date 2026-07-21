import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../context/TestContext';

export default function Report() {
  const navigate = useNavigate();
  const { testConfig, testResults } = useTest();
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  
  const hasHighSpeed = testResults && testResults.realSpeed >= 35;
  const [showVideoOverlay, setShowVideoOverlay] = useState(hasHighSpeed);
  const [fadeVideoOut, setFadeVideoOut] = useState(false);
  const [showPerfectionOverlay, setShowPerfectionOverlay] = useState(true);

  const videoRef = useRef(null);

  const accuracy = (testResults && testResults.grossWpm > 0)
    ? Math.max(0, (testResults.realSpeed / testResults.grossWpm) * 100)
    : 0;

  // Video overlay 22-second playback & fade out logic for realSpeed >= 35
  useEffect(() => {
    if (hasHighSpeed && showVideoOverlay) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(err => console.log("Autoplay playback notice:", err));
      }

      const fadeTimer = setTimeout(() => {
        setFadeVideoOut(true);
      }, 21000); // Start fade out at 21s

      const removeTimer = setTimeout(() => {
        setShowVideoOverlay(false);
      }, 22000); // Fully remove video overlay at 22s

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [hasHighSpeed, showVideoOverlay]);

  // Backup trigger when video currentTime reaches 22 seconds
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= 22 && !fadeVideoOut) {
      setFadeVideoOut(true);
      setTimeout(() => setShowVideoOverlay(false), 1000);
    }
  };

  const skipVideo = () => {
    setFadeVideoOut(true);
    setTimeout(() => setShowVideoOverlay(false), 500);
  };

  // Perfection (Levi GIF) overlay logic — triggers after video overlay completes
  useEffect(() => {
    if (accuracy >= 93 && !showVideoOverlay) {
      const timer = setTimeout(() => {
        setShowPerfectionOverlay(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [accuracy, showVideoOverlay]);

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
  if (testResults.realSpeed < 30) {
    speedMessage = "You can do better!";
    speedColor = "#dc2626"; // red
  } else if (testResults.realSpeed <= 35) {
    speedMessage = "Good Word! Keep it up!";
    speedColor = "#d97706"; // orange
  } else {
    speedMessage = "OMG! JOB IS YOURS!";
    speedColor = "#16a34a"; // green
  }

  return (
    <div className="report-page-container">
      {/* 1. Fullscreen Video Overlay for Real Speed >= 35 (Plays for 22s then fades out) */}
      {showVideoOverlay && (
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
          opacity: fadeVideoOut ? 0 : 1,
          pointerEvents: fadeVideoOut ? 'none' : 'auto'
        }}>
          <video
            ref={videoRef}
            src="/zenitsu.mp4"
            autoPlay
            playsInline
            onTimeUpdate={handleVideoTimeUpdate}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button 
            onClick={skipVideo}
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
              zIndex: 10001,
              backdropFilter: 'blur(4px)'
            }}
          >
            Skip Video ✕
          </button>
        </div>
      )}

      {/* 2. Perfection Overlay (Levi GIF) for Accuracy >= 93% */}
      {!showVideoOverlay && accuracy >= 93 && showPerfectionOverlay && (
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

      {testResults.realSpeed > 35 && (
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
            
            <div className="report-metrics">
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
