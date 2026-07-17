import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../context/TestContext';

export default function Report() {
  const navigate = useNavigate();
  const { testConfig, testResults } = useTest();
  const [copied, setCopied] = useState(false);

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
- Real Speed (Net WPM): ((Total Keystrokes - 2 * Errors) / 5) / Time (min)
- Errors are subtracted from keystrokes (1 error = 2 keystrokes penalty)

Test Performance:
- Name: ${testConfig.name}
- Test No: ${testConfig.practiceNo}
- Time Taken: ${timeTakenStr}
- Gross WPM: ${Math.round(testResults.grossWpm)}
- Real Speed (Net WPM): ${Math.round(testResults.realSpeed)}
- Total Keystrokes: ${testResults.totalKeystrokes}
- Total Errors: ${testResults.errors}
  * Spelling Mistakes: ${testResults.misspellings}
  * Omissions: ${testResults.omissions}
  * Additions: ${testResults.additions}

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

  return (
    <div className="report-page-container">
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
                <div className="metric-desc">((Keystrokes - 2 * Errors) / 5) / Time</div>
              </div>
              <div className="metric-box">
                <div className="metric-title">Total Errors</div>
                <div className="metric-value">{testResults.errors}</div>
              </div>
              <div className="metric-box">
                <div className="metric-title">Total Keystrokes</div>
                <div className="metric-value">{testResults.totalKeystrokes}</div>
              </div>
            </div>

            <div className="error-analysis">
              <h2>Detailed Error Analysis</h2>
              <div className="report-metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '15px' }}>
                <div className="metric-box" style={{ background: '#fef2f2', borderColor: '#fee2e2' }}>
                  <div className="metric-title" style={{ color: '#991b1b' }}>Spelling Mistakes</div>
                  <div className="metric-value" style={{ color: '#991b1b' }}>{testResults.misspellings}</div>
                </div>
                <div className="metric-box" style={{ background: '#fffbeb', borderColor: '#fef3c7' }}>
                  <div className="metric-title" style={{ color: '#92400e' }}>Omissions</div>
                  <div className="metric-value" style={{ color: '#92400e' }}>{testResults.omissions}</div>
                </div>
                <div className="metric-box" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
                  <div className="metric-title" style={{ color: '#166534' }}>Additions</div>
                  <div className="metric-value" style={{ color: '#166534' }}>{testResults.additions}</div>
                </div>
              </div>
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
