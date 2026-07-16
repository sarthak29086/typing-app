import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../context/TestContext';

export default function Report() {
  const navigate = useNavigate();
  const { testConfig, testResults } = useTest();

  if (!testResults || testResults.timeTakenSeconds === 0) {
    return (
      <div className="report-container">
        <p>No results found. Please take a test first.</p>
        <button onClick={() => navigate('/')} className="submit-btn">Go to Setup</button>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="report-card">
        <h1 style={{color: '#1a4e7e', marginBottom: '20px', textAlign: 'center'}}>Typing Test Report</h1>
        <div className="report-header">
          <div className="report-stat"><strong>Name:</strong> {testConfig.name}</div>
          <div className="report-stat"><strong>Test No:</strong> {testConfig.practiceNo}</div>
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
            <div className="metric-desc">Gross WPM - (2 * Errors / Time)</div>
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
              <div className="metric-desc">Incorrectly typed words</div>
            </div>
            <div className="metric-box" style={{ background: '#fffbeb', borderColor: '#fef3c7' }}>
              <div className="metric-title" style={{ color: '#92400e' }}>Omissions</div>
              <div className="metric-value" style={{ color: '#92400e' }}>{testResults.omissions}</div>
              <div className="metric-desc">Skipped words</div>
            </div>
            <div className="metric-box" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
              <div className="metric-title" style={{ color: '#166534' }}>Additions</div>
              <div className="metric-value" style={{ color: '#166534' }}>{testResults.additions}</div>
              <div className="metric-desc">Extra words typed</div>
            </div>
          </div>
        </div>

        <div style={{textAlign: 'center', marginTop: '30px'}}>
           <button onClick={() => navigate('/')} className="submit-btn start-again-btn">Start Another Test</button>
        </div>
      </div>
    </div>
  );
}
