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
  // targetText is always the base paragraph — never appended to
  const targetText = testConfig.paragraph || 'Please go back and configure the test.';
  
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

  // Compute unique line vertical offsets on mount only (targetText never changes)
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

  // alignWords: standard edit distance (used for live speed estimate)
  const alignWords = (original, typed) => {
    const O = original.length, T = typed.length;
    const dp = Array(O + 1).fill(null).map(() => Array(T + 1).fill(0));
    for (let i = 0; i <= O; i++) dp[i][0] = i;
    for (let j = 0; j <= T; j++) dp[0][j] = j;
    for (let i = 1; i <= O; i++) {
      for (let j = 1; j <= T; j++) {
        if (original[i-1] === typed[j-1]) dp[i][j] = dp[i-1][j-1];
        else dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + 1);
      }
    }
    let i = O, j = T;
    let wrongSpelling = 0, extraWord = 0, lessWord = 0, punctuationError = 0, caseError = 0, spaceDisparity = 0;
    let wrongSpellingDetails = [], extraWordDetails = [], lessWordDetails = [], punctuationErrorDetails = [], caseErrorDetails = [], spaceDisparityDetails = [];
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && original[i-1] === typed[j-1]) { i--; j--; }
      else {
        const omitScore = i > 0 ? dp[i-1][j] : Infinity;
        const addScore = j > 0 ? dp[i][j-1] : Infinity;
        const subScore = (i > 0 && j > 0) ? dp[i-1][j-1] : Infinity;
        const minScore = Math.min(omitScore, addScore, subScore);
        if (minScore === subScore) {
          const orig = original[i-1], typ = typed[j-1];
          const origClean = orig.replace(/[.,/#!$%^&*;:{}=\-_`~()'"?]/g, "");
          const typClean = typ.replace(/[.,/#!$%^&*;:{}=\-_`~()'"?]/g, "");
          if (orig.toLowerCase() === typ.toLowerCase()) { caseError++; caseErrorDetails.unshift({ expected: orig, typed: typ }); }
          else if (origClean === typClean) { punctuationError++; punctuationErrorDetails.unshift({ expected: orig, typed: typ }); }
          else if (origClean.toLowerCase() === typClean.toLowerCase()) { caseError++; punctuationError++; caseErrorDetails.unshift({ expected: orig, typed: typ }); punctuationErrorDetails.unshift({ expected: orig, typed: typ }); }
          else { wrongSpelling++; wrongSpellingDetails.unshift({ expected: orig, typed: typ }); }
          i--; j--;
        } else if (minScore === omitScore) { lessWord++; lessWordDetails.unshift({ expected: original[i-1], typed: '-' }); i--; }
        else { const typ = typed[j-1]; if (typ === "") { spaceDisparity++; spaceDisparityDetails.unshift({ expected: '-', typed: '(extra space)' }); } else { extraWord++; extraWordDetails.unshift({ expected: '-', typed: typ }); } j--; }
      }
    }
    const totalErrors = wrongSpelling + extraWord + lessWord + punctuationError + caseError + spaceDisparity;
    return { wrongSpelling, extraWord, lessWord, punctuationError, caseError, spaceDisparity, totalErrors, wrongSpellingDetails, extraWordDetails, lessWordDetails, punctuationErrorDetails, caseErrorDetails, spaceDisparityDetails };
  };

  // alignWordsSemiGlobal: finds exactly how many original words were covered by the typed text.
  // The suffix of original is FREE (unpenalized), so we find the natural alignment endpoint.
  const alignWordsSemiGlobal = (original, typed) => {
    const O = original.length, T = typed.length;
    const dp = Array(O + 1).fill(null).map(() => Array(T + 1).fill(0));
    for (let i = 0; i <= O; i++) dp[i][0] = i;
    for (let j = 0; j <= T; j++) dp[0][j] = j;
    for (let i = 1; i <= O; i++) {
      for (let j = 1; j <= T; j++) {
        if (original[i-1] === typed[j-1]) dp[i][j] = dp[i-1][j-1];
        else dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + 1);
      }
    }

    // Find the first i where dp[i][T] is minimized — this is how far into original the typed text reached
    let minCost = Infinity, bestI = O;
    for (let i = 0; i <= O; i++) {
      if (dp[i][T] < minCost) { minCost = dp[i][T]; bestI = i; }
    }

    // Traceback from (bestI, T) — categorize all errors within the covered range
    let i = bestI, j = T;
    let wrongSpelling = 0, extraWord = 0, lessWord = 0, punctuationError = 0, caseError = 0, spaceDisparity = 0;
    let wrongSpellingDetails = [], extraWordDetails = [], lessWordDetails = [], punctuationErrorDetails = [], caseErrorDetails = [], spaceDisparityDetails = [];
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && original[i-1] === typed[j-1]) { i--; j--; }
      else {
        const omitScore = i > 0 ? dp[i-1][j] : Infinity;
        const addScore = j > 0 ? dp[i][j-1] : Infinity;
        const subScore = (i > 0 && j > 0) ? dp[i-1][j-1] : Infinity;
        const minScore = Math.min(omitScore, addScore, subScore);
        if (minScore === subScore) {
          const orig = original[i-1], typ = typed[j-1];
          const origClean = orig.replace(/[.,/#!$%^&*;:{}=\-_`~()'"?]/g, "");
          const typClean = typ.replace(/[.,/#!$%^&*;:{}=\-_`~()'"?]/g, "");
          if (orig.toLowerCase() === typ.toLowerCase()) { caseError++; caseErrorDetails.unshift({ expected: orig, typed: typ }); }
          else if (origClean === typClean) { punctuationError++; punctuationErrorDetails.unshift({ expected: orig, typed: typ }); }
          else if (origClean.toLowerCase() === typClean.toLowerCase()) { caseError++; punctuationError++; caseErrorDetails.unshift({ expected: orig, typed: typ }); punctuationErrorDetails.unshift({ expected: orig, typed: typ }); }
          else { wrongSpelling++; wrongSpellingDetails.unshift({ expected: orig, typed: typ }); }
          i--; j--;
        } else if (minScore === omitScore) { lessWord++; lessWordDetails.unshift({ expected: original[i-1], typed: '-' }); i--; }
        else { const typ = typed[j-1]; if (typ === "") { spaceDisparity++; spaceDisparityDetails.unshift({ expected: '-', typed: '(extra space)' }); } else { extraWord++; extraWordDetails.unshift({ expected: '-', typed: typ }); } j--; }
      }
    }
    const totalErrors = wrongSpelling + extraWord + lessWord + punctuationError + caseError + spaceDisparity;
    return { wrongSpelling, extraWord, lessWord, punctuationError, caseError, spaceDisparity, totalErrors, wrongSpellingDetails, extraWordDetails, lessWordDetails, punctuationErrorDetails, caseErrorDetails, spaceDisparityDetails, originalWordsCovered: bestI };
  };

  const endTest = () => {
    const cleanTypedText = typedText.replace(/\r?\n/g, ' ').trim();
    const baseParagraph = testConfig.paragraph.replace(/\s+/g, ' ').trim();

    const typedWords = cleanTypedText.split(/\s+/).filter(w => w.length > 0);
    const baseWords = baseParagraph.split(/\s+/).filter(w => w.length > 0);

    // Build repeated original — enough to cover typed + generous buffer for omissions
    const buffer = 60;
    let originalExtended = [];
    while (originalExtended.length < typedWords.length + buffer) {
      originalExtended = originalExtended.concat(baseWords);
    }

    // Run semi-global alignment: finds exactly how far into originalExtended the typed text reached
    const alignment = alignWordsSemiGlobal(originalExtended, typedWords);
    const { originalWordsCovered } = alignment;

    // Original shown in copy prompt: exactly the portion of original that corresponds to what was typed
    // For looping: if originalWordsCovered > baseWords.length, it includes repeated content naturally
    const attemptedTargetText = originalExtended.slice(0, originalWordsCovered).join(' ');

    const timeTakenSeconds = timeElapsed === 0 ? 1 : timeElapsed;
    const timeTakenMinutes = timeTakenSeconds / 60;
    const totalKeystrokes = typedText.length;
    const grossWpm = (totalKeystrokes / 5) / timeTakenMinutes;
    const realSpeed = ((totalKeystrokes / 5) - alignment.totalErrors) / timeTakenMinutes;

    setTestResults({
      timeTakenSeconds,
      errors: alignment.totalErrors,
      wrongSpelling: alignment.wrongSpelling,
      extraWord: alignment.extraWord,
      lessWord: alignment.lessWord,
      punctuationError: alignment.punctuationError,
      caseError: alignment.caseError,
      spaceDisparity: alignment.spaceDisparity,
      wrongSpellingDetails: alignment.wrongSpellingDetails,
      extraWordDetails: alignment.extraWordDetails,
      lessWordDetails: alignment.lessWordDetails,
      punctuationErrorDetails: alignment.punctuationErrorDetails,
      caseErrorDetails: alignment.caseErrorDetails,
      spaceDisparityDetails: alignment.spaceDisparityDetails,
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
    // No appending: targetText stays as the base paragraph.
    // Looping is handled via modulo in the display logic.
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
  const baseWordCount = targetWords.length;

  // Raw typed word count (ever-increasing as user types)
  const cleanTypedTextLive = typedText.replace(/\r?\n/g, ' ');
  const typedWordsCountRaw = cleanTypedTextLive.split(' ').length - 1;

  // For display: wrap around using modulo so the paragraph loops
  const typedWordsCount = typedWordsCountRaw % baseWordCount;

  // Line-by-line scrolling logic — uses the modulo-wrapped index
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
      } else {
        // Word index out of range (shouldn't happen with modulo, but safety)
        displayContainerRef.current.scrollTop = 0;
      }
    }
  }, [typedWordsCount]);

  // Live speed calculations — always compare against repeated base paragraph
  const elapsedMinutes = timeElapsed > 0 ? timeElapsed / 60 : 0;
  let currentGrossWpm = 0;
  let currentRealWpm = 0;

  if (elapsedMinutes > 0) {
    const cleanTypedLive = typedText.replace(/\r?\n/g, ' ').trim();
    const baseParagraphLive = targetText.replace(/\s+/g, ' ').trim();
    const currentTypedWords = cleanTypedLive.split(/\s+/).filter(w => w.length > 0);
    const baseWordsLive = baseParagraphLive.split(/\s+/).filter(w => w.length > 0);
    // Build repeated original to match typed length for live estimate
    let liveOriginal = [];
    while (liveOriginal.length < currentTypedWords.length) liveOriginal = liveOriginal.concat(baseWordsLive);
    liveOriginal = liveOriginal.slice(0, currentTypedWords.length);
    const liveAlignment = alignWords(liveOriginal, currentTypedWords);
    currentGrossWpm = Math.max(0, Math.round((typedText.length / 5) / elapsedMinutes));
    currentRealWpm = Math.max(0, Math.round(((typedText.length / 5) - liveAlignment.totalErrors) / elapsedMinutes));
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
              // typedWordsCount is already modulo-wrapped
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
