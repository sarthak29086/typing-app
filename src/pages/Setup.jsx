import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../context/TestContext';

export default function Setup() {
  const navigate = useNavigate();
  const { setTestConfig } = useTest();
  const [autoFullscreen, setAutoFullscreen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    practiceNo: '',
    timerMinutes: '1',
    timerSeconds: '0',
    paragraph: 'Success is often described as the achievement of a goal, but its meaning can be different for each person. For some, success may mean excelling in education, while for others it may involve building a career, supporting a family, or contributing to society. Regardless of how success is defined, certain qualities help people move closer to their goals. These qualities include determination, discipline, patience, and a willingness to learn from experience. Many successful individuals have faced challenges and setbacks before reaching their objectives. Failure is not necessarily the opposite of success; it is often a part of the journey. Every mistake provides an opportunity to learn and improve. Furthermore, setting realistic and measurable goals can keep one motivated. It is also important to maintain a positive mindset, as a negative attitude can hinder progress. Support from friends, family, or mentors can make a significant difference. Ultimately, achieving success requires continuous effort and a strong belief in oneself. Whether the goal is personal or professional, the path to success is rarely a straight line, but with perseverance and hard work, anything is possible.',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.practiceNo || !formData.paragraph) {
      alert('Please fill Name, Practice No., and Paragraph');
      return;
    }
    
    const minutes = parseInt(formData.timerMinutes || '0', 10);
    const seconds = parseInt(formData.timerSeconds || '0', 10);
    const totalSeconds = minutes * 60 + seconds;
    
    if (totalSeconds <= 0) {
      alert('Timer must be greater than 0 seconds');
      return;
    }

    if (autoFullscreen) {
      document.documentElement.requestFullscreen?.().catch(err => {
        console.warn("Fullscreen request was blocked or failed:", err);
      });
    }

    setTestConfig({
      name: formData.name,
      practiceNo: formData.practiceNo,
      timerSeconds: totalSeconds,
      paragraph: formData.paragraph,
    });
    navigate('/test');
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h1 style={{marginBottom: '20px', color: '#1a4e7e'}}>Typing Test Setup</h1>
        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Smith" />
          </div>
          <div className="form-group">
            <label>Practice No.</label>
            <input type="text" name="practiceNo" value={formData.practiceNo} onChange={handleChange} placeholder="Mock Typing1" />
          </div>
          <div className="form-group">
            <label>Timer Duration</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <input type="number" name="timerMinutes" value={formData.timerMinutes} onChange={handleChange} min="0" placeholder="Minutes" />
                <span style={{ fontSize: '12px', color: '#666' }}>Minutes</span>
              </div>
              <div style={{ flex: 1 }}>
                <input type="number" name="timerSeconds" value={formData.timerSeconds} onChange={handleChange} min="0" max="59" placeholder="Seconds" />
                <span style={{ fontSize: '12px', color: '#666' }}>Seconds</span>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Custom Paragraph</label>
            <textarea name="paragraph" value={formData.paragraph} onChange={handleChange} rows="6" />
          </div>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '15px 0' }}>
            <input 
              type="checkbox" 
              id="fullscreen-checkbox" 
              checked={autoFullscreen} 
              onChange={(e) => setAutoFullscreen(e.target.checked)} 
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="fullscreen-checkbox" style={{ margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>
              Automatically enter Fullscreen mode on start
            </label>
          </div>

          <button type="submit" className="submit-btn">Start Test</button>
        </form>
      </div>
    </div>
  );
}
