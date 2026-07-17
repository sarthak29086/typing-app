import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../context/TestContext';

export default function Test() {
  const navigate = useNavigate();
  const { testConfig, setTestResults } = useTest();
  
  const [timeLeft, setTimeLeft] = useState(testConfig.timerSeconds || 60);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSpeed, setShowSpeed] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [targetText, setTargetText] = useState(testConfig.paragraph || 'Please go back and configure the test.');
  
  const inputRef = useRef(null);
  const displayContainerRef = useRef(null);
  const activeWordRef = useRef(null);
  
  const [lineOffsets, setLineOffsets] = useState([]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isTestActive && timeLeft > 0 && !isPaused) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (isTestActive && timeLeft === 0) {
      endTest();
    }
  }, [isTestActive, timeLeft, isPaused]);

  // Compute unique line vertical offsets on targetText change
  useEffect(() => {
    if (displayContainerRef.current) {
      const spans = displayContainerRef.current.querySelectorAll('span');
      const offsets = [];
      spans.forEach(span => {
        const top = span.offsetTop;
        if (top !== undefined && !offsets.includes(top)) {
          offsets.push(top);
        }
      });
      offsets.sort((a, b) => a - b);
      setLineOffsets(offsets);
    }
  }, [targetText]);

  const alignWords = (original, typed) => {
    const dp = Array(original.length + 1).fill(null).map(() => Array(typed.length + 1).fill(0));
    
    for (let i = 0; i <= original.length; i++) dp[i][0] = i;
    for (let j = 0; j <= typed.length; j++) dp[0][j] = j;
    
    for (let i = 1; i <= original.length; i++) {
      for (let j = 1; j <= typed.length; j++) {
        if (original[i-1] === typed[j-1]) {
          dp[i][j] = dp[i-1][j-1];
        } else {
          dp[i][j] = Math.min(
            dp[i-1][j] + 1,    // omission
            dp[i][j-1] + 1,    // addition
            dp[i-1][j-1] + 1   // substitution
          );
        }
      }
    }
    
    let i = original.length;
    let j = typed.length;
    
    let misspellings = 0;
    let omissions = 0;
    let additions = 0;
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && original[i-1] === typed[j-1]) {
        i--;
        j--;
      } else {
        const omitScore = i > 0 ? dp[i-1][j] : Infinity;
        const addScore = j > 0 ? dp[i][j-1] : Infinity;
        const subScore = (i > 0 && j > 0) ? dp[i-1][j-1] : Infinity;
        
        const minScore = Math.min(omitScore, addScore, subScore);
        if (minScore === subScore) {
          misspellings++;
          i--;
          j--;
        } else if (minScore === omitScore) {
          omissions++;
          i--;
        } else {
          additions++;
          j--;
        }
      }
    }
    
    return { misspellings, omissions, additions, totalErrors: misspellings + omissions + additions };
  };

  const endTest = () => {
    // Normalize newlines to spaces for exact space-by-space word lists
    const cleanTypedText = typedText.replace(/\r?\n/g, ' ');
    const cleanTargetText = targetText.replace(/\r?\n/g, ' ');
    
    const typedWords = cleanTypedText.split(' ');
    const originalWords = cleanTargetText.split(' ');
    
    // Perform robust alignment to count and categorize errors strictly
    const alignment = alignWords(originalWords.slice(0, typedWords.length), typedWords);
    
    const attemptedTargetText = originalWords.slice(0, typedWords.length).join(' ');
    
    const timeTakenSeconds = timeElapsed === 0 ? 1 : timeElapsed;
    const timeTakenMinutes = timeTakenSeconds / 60;
    const totalKeystrokes = typedText.length;
    
    // Gross WPM: (Total Keystrokes / 5) / (Time Taken in minutes)
    const grossWpm = (totalKeystrokes / 5) / timeTakenMinutes;
    
    // Real Speed: ((Total Keystrokes - 2 * Errors) / 5) / (Time Taken in minutes)
    const realSpeed = ((totalKeystrokes - (2 * alignment.totalErrors)) / 5) / timeTakenMinutes;

    setTestResults({
      timeTakenSeconds,
      errors: alignment.totalErrors,
      misspellings: alignment.misspellings,
      omissions: alignment.omissions,
      additions: alignment.additions,
      grossWpm: Math.max(0, grossWpm),
      realSpeed: Math.max(0, realSpeed),
      totalKeystrokes,
      typedText: cleanTypedText,
      targetText: attemptedTargetText
    });
    
    navigate('/report');
  };

  const handleInput = (e) => {
    if (isPaused) return;
    if (!isTestActive && timeLeft > 0) {
      setIsTestActive(true);
    }
    const val = e.target.value;
    setTypedText(val);
    
    // Append paragraph if nearing end
    if (val.length >= targetText.length - 50) {
      setTargetText(prev => prev + ' ' + testConfig.paragraph);
    }
  };

  const handleSubmitEarly = () => {
    endTest();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const targetWords = targetText.split(' ');
  
  // Track words split strictly by space for highlighting active word position
  const cleanTypedTextLive = typedText.replace(/\r?\n/g, ' ');
  const typedWordsCount = cleanTypedTextLive.split(' ').length - 1;

  // Line-by-line scrolling logic
  useEffect(() => {
    if (displayContainerRef.current) {
      const spans = Array.from(displayContainerRef.current.querySelectorAll('span'));
      const activeWordSpan = spans[typedWordsCount];
      
      if (activeWordSpan) {
        // Find all unique offsetTops up to the current active span
        const uniqueOffsets = new Set();
        for (let i = 0; i <= typedWordsCount; i++) {
          if (spans[i] && spans[i].offsetTop !== undefined) {
            uniqueOffsets.add(spans[i].offsetTop);
          }
        }
        
        const activeLineIndex = uniqueOffsets.size - 1; // 0-indexed
        
        // Scroll one line when the 3rd line (index 2) is reached, and one line for each line after
        if (activeLineIndex >= 2) {
          const offsetsArray = Array.from(uniqueOffsets).sort((a,b) => a-b);
          let lineHeight = 24; // fallback line height
          if (offsetsArray.length >= 2) {
            lineHeight = offsetsArray[1] - offsetsArray[0];
          }
          displayContainerRef.current.scrollTop = (activeLineIndex - 1) * lineHeight;
        } else {
          displayContainerRef.current.scrollTop = 0;
        }
      }
    }
  }, [typedWordsCount]);

  // Live speed calculations
  const elapsedMinutes = timeElapsed > 0 ? timeElapsed / 60 : 0;
  let currentGrossWpm = 0;
  let currentRealWpm = 0;

  if (elapsedMinutes > 0) {
    const cleanTypedLive = typedText.replace(/\r?\n/g, ' ');
    const cleanOriginalLive = targetText.replace(/\r?\n/g, ' ');
    const currentTypedWords = cleanTypedLive.split(' ');
    const currentOriginalWords = cleanOriginalLive.split(' ').slice(0, currentTypedWords.length);
    const liveAlignment = alignWords(currentOriginalWords, currentTypedWords);
    
    currentGrossWpm = Math.max(0, Math.round((typedText.length / 5) / elapsedMinutes));
    currentRealWpm = Math.max(0, Math.round(((typedText.length - (2 * liveAlignment.totalErrors)) / 5) / elapsedMinutes));
  }

  return (
    <div className="test-layout watermarked-bg">
      <header className="test-header">
        <div className="test-title">English Typing Test</div>
        <div className="test-instructions">
          <span className="info-icon">i</span> Instructions
        </div>
      </header>
      
      <div className="test-sub-header">
        <div className="tabs-container">
          <div className="sections-label">Sections</div>
          <div className="tabs">
            <div className="tab active">
              <span className="arrow-left">◀</span>
              {testConfig.practiceNo || 'Mock Typing1'}
            </div>
            <div className="tab">Mock Typing2</div>
            <div className="tab">Actual Typing</div>
          </div>
        </div>
        <div className="user-info-area">
          <div className="time-left">Time Left : {formatTime(timeLeft)}</div>
          {isTestActive && (
            <button 
              onClick={() => setIsPaused(!isPaused)} 
              className="pause-resume-btn"
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
          <div className="user-profile">
            <div className="avatar">👤</div>
            <div className="username">{testConfig.name || 'John Smith'}</div>
          </div>
        </div>
      </div>
      
      <div className="test-content-header">
        <div className="active-section-tab">
           <span className="arrow-left">◀</span>
           <span className="tab-label">{testConfig.practiceNo || 'Mock Typing1'}</span>
        </div>
        <div className="keyboard-layout">Keyboard Layout:English</div>
      </div>

      <div className="test-body">
        <div className="test-left-column">
          <div className="text-display-box" ref={displayContainerRef}>
            {targetWords.map((word, index) => {
              const isCurrent = index === typedWordsCount;
              return (
                <React.Fragment key={index}>
                  <span 
                    ref={isCurrent ? activeWordRef : null}
                    className={isCurrent ? 'current-word-tracker' : ''}
                  >
                    {word}
                  </span>
                  {' '}
                </React.Fragment>
              );
            })}
          </div>

          <textarea
            ref={inputRef}
            className="typing-input-box"
            value={typedText}
            onChange={handleInput}
            disabled={timeLeft === 0 || isPaused}
            placeholder={isPaused ? "Paused. Click Resume to continue..." : ""}
            spellCheck="false"
          />

          {isTestActive && (
            <div className="current-speed-area" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => setShowSpeed(!showSpeed)} 
                className="hide-speed-btn"
                style={{ padding: '5px 10px', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {showSpeed ? 'Hide Live Speed' : 'Show Live Speed'}
              </button>
              {showSpeed && (
                <span className="speed-stats" style={{ fontWeight: 'bold', color: '#1a4e7e' }}>
                  Speed: {currentGrossWpm} WPM (Net: {currentRealWpm})
                </span>
              )}
            </div>
          )}

          <div className="submit-area">
             <button onClick={handleSubmitEarly} className="submit-test-btn">Submit</button>
          </div>
        </div>
        <div className="test-right-column">
          {/* Left empty as in screenshot, letting watermark repeat */}
        </div>
      </div>
    </div>
  );
}
