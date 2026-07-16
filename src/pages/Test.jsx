import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../context/TestContext';

export default function Test() {
  const navigate = useNavigate();
  const { testConfig, setTestResults } = useTest();
  
  const [timeLeft, setTimeLeft] = useState(testConfig.timerSeconds || 60);
  const [isTestActive, setIsTestActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [targetText, setTargetText] = useState(testConfig.paragraph || 'Please go back and configure the test.');
  
  const inputRef = useRef(null);
  const displayContainerRef = useRef(null);
  const activeWordRef = useRef(null);
  
  const [lastOffsetTop, setLastOffsetTop] = useState(0);

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
      }, 1000);
      return () => clearInterval(timer);
    } else if (isTestActive && timeLeft === 0) {
      endTest();
    }
  }, [isTestActive, timeLeft, isPaused]);

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
    const typedWords = typedText.trim().split(/\s+/).filter(w => w.length > 0);
    const originalWords = targetText.trim().split(/\s+/);
    
    // Perform robust alignment to count and categorize errors
    const alignment = alignWords(originalWords.slice(0, typedWords.length), typedWords);
    
    const timeTakenMinutes = testConfig.timerSeconds / 60;
    const totalKeystrokes = typedText.length;
    
    // Gross WPM: (Total Keystrokes / 5) / (Total Time in minutes)
    const grossWpm = (totalKeystrokes / 5) / timeTakenMinutes;
    
    // Real Speed: ((Total Keystrokes - 2 * Errors) / 5) / (Total Time in minutes)
    const realSpeed = ((totalKeystrokes - 2 * alignment.totalErrors) / 5) / timeTakenMinutes;

    setTestResults({
      timeTakenSeconds: testConfig.timerSeconds,
      errors: alignment.totalErrors,
      misspellings: alignment.misspellings,
      omissions: alignment.omissions,
      additions: alignment.additions,
      grossWpm: Math.max(0, grossWpm),
      realSpeed: Math.max(0, realSpeed),
      totalKeystrokes
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
  const typedWordsCount = typedText === '' ? 0 : (typedText.endsWith(' ') ? typedText.trim().split(/\s+/).length : Math.max(0, typedText.trim().split(/\s+/).length - 1));

  // Auto-scroll logic
  useEffect(() => {
    if (activeWordRef.current && displayContainerRef.current) {
      const currentOffsetTop = activeWordRef.current.offsetTop;
      if (currentOffsetTop > lastOffsetTop + 10) {
        displayContainerRef.current.scrollTop = currentOffsetTop - 20; 
        setLastOffsetTop(currentOffsetTop);
      } else if (currentOffsetTop < lastOffsetTop - 10) {
        displayContainerRef.current.scrollTop = currentOffsetTop - 20; 
        setLastOffsetTop(currentOffsetTop);
      }
    }
  }, [typedWordsCount, lastOffsetTop]);

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
