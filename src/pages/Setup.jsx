import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../context/TestContext';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from '../components/MagneticButton';
import FluidCursor from '../components/FluidCursor';

export default function Setup() {
  const navigate = useNavigate();
  const { setTestConfig } = useTest();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [autoFullscreen, setAutoFullscreen] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Shiro Musay Sahay',
    practiceNo: '',
    timerMinutes: '1',
    timerSeconds: '0',
    paragraph: 'Success is often described as the achievement of a goal, but its meaning can be different for each person. For some, success may mean excelling in education, while for others it may involve building a career, supporting a family, or contributing to society. Regardless of how success is defined, certain qualities help people move closer to their goals. These qualities include determination, discipline, patience, and a willingness to learn from experience. Many successful individuals have faced challenges and setbacks before reaching their objectives. Failure is not necessarily the opposite of success; it is often a part of the journey. Every mistake provides an opportunity to learn and improve. Furthermore, setting realistic and measurable goals can keep one motivated. It is also important to maintain a positive mindset, as a negative attitude can hinder progress. Support from friends, family, or mentors can make a significant difference. Ultimately, achieving success requires continuous effort and a strong belief in oneself. Whether the goal is personal or professional, the path to success is rarely a straight line, but with perseverance and hard work, anything is possible.',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.practiceNo || !formData.paragraph) {
      alert('Please fill Name, Practice No., and Paragraph');
      return;
    }
    const totalSeconds = parseInt(formData.timerMinutes || '0', 10) * 60 + parseInt(formData.timerSeconds || '0', 10);
    if (totalSeconds <= 0) {
      alert('Timer must be greater than 0 seconds');
      return;
    }
    if (autoFullscreen) document.documentElement.requestFullscreen?.().catch(() => {});
    setTestConfig({
      name: formData.name,
      practiceNo: formData.practiceNo,
      timerSeconds: totalSeconds,
      paragraph: formData.paragraph.replace(/\s+/g, ' ').trim(),
    });
    navigate('/test');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-cyber-dark text-white font-sans selection:bg-cyber-pink selection:text-white">
      <FluidCursor />
      
      {/* Background Gradients & Glows */}
      <div className="absolute inset-0 bg-cyber-gradient opacity-90 z-0"></div>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-cyber-purple/20 blur-[120px] pointer-events-none z-0"
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-cyber-blue/20 blur-[150px] pointer-events-none z-0"
      />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        
        {/* 3D Placeholder (Tracks Cursor via CSS for simplicity, or just a cool floating element) */}
        <motion.div 
          animate={{ rotateY: [0, 10, -10, 0], rotateX: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="mb-12 relative w-64 h-64 md:w-96 md:h-96"
        >
          {/* A glassmorphic 3D cube placeholder */}
          <div className="absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_50px_rgba(0,240,255,0.3)] flex items-center justify-center">
            <span className="text-cyber-blue/50 tracking-[0.2em] text-sm uppercase">3D Canvas Area</span>
          </div>
        </motion.div>

        <motion.h1 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue via-white to-cyber-pink mb-8 text-center"
        >
          Type Fast. <br /> Die Last.
        </motion.h1>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <MagneticButton 
            onClick={() => setIsModalOpen(true)}
            className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-cyber-blue shadow-[0_0_30px_rgba(176,38,255,0.3)] rounded-full text-xl"
          >
            INITIALIZE SEQUENCE
          </MagneticButton>
        </motion.div>
      </div>

      {/* Kinetic Marquee */}
      <div className="absolute bottom-0 w-full overflow-hidden whitespace-nowrap bg-cyber-pink/20 backdrop-blur-sm border-t border-cyber-pink/50 py-4 z-20">
        <motion.div 
          animate={{ x: [0, -1035] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
          className="inline-block text-2xl font-bold tracking-[0.2em] text-white/80 uppercase"
        >
          PUSH YOUR LIMITS • NEURO-LINK ENGAGED • ELEVATE WPM • PUSH YOUR LIMITS • NEURO-LINK ENGAGED • ELEVATE WPM • PUSH YOUR LIMITS • NEURO-LINK ENGAGED • ELEVATE WPM • 
        </motion.div>
      </div>

      {/* Glassmorphism Modal for Setup Form */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-2xl bg-cyber-dark/80 backdrop-blur-2xl border border-cyber-purple/50 shadow-[0_0_50px_rgba(176,38,255,0.2)] p-8 rounded-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl"
              >
                ✕
              </button>
              
              <h2 className="text-3xl font-bold mb-6 text-cyber-blue uppercase tracking-widest border-b border-white/10 pb-4">
                Test Parameters
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-cyber-purple mb-2 uppercase tracking-wider">Operative Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyber-blue transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-cyber-purple mb-2 uppercase tracking-wider">Session ID</label>
                    <input type="text" name="practiceNo" value={formData.practiceNo} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyber-blue transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-cyber-purple mb-2 uppercase tracking-wider">Time Limit</label>
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <input type="number" name="timerMinutes" value={formData.timerMinutes} onChange={handleChange} min="0" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyber-blue transition-colors" />
                      <span className="absolute right-3 top-3 text-white/30 text-sm">MIN</span>
                    </div>
                    <div className="flex-1 relative">
                      <input type="number" name="timerSeconds" value={formData.timerSeconds} onChange={handleChange} min="0" max="59" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyber-blue transition-colors" />
                      <span className="absolute right-3 top-3 text-white/30 text-sm">SEC</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-cyber-purple mb-2 uppercase tracking-wider">Target Data</label>
                  <textarea name="paragraph" value={formData.paragraph} onChange={handleChange} rows="5" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyber-blue transition-colors resize-none" />
                </div>
                
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="fullscreen-checkbox" checked={autoFullscreen} onChange={(e) => setAutoFullscreen(e.target.checked)} className="w-5 h-5 accent-cyber-pink" />
                  <label htmlFor="fullscreen-checkbox" className="text-sm text-white/70 uppercase tracking-widest cursor-pointer">
                    Force Fullscreen Override
                  </label>
                </div>

                <button type="submit" className="w-full bg-cyber-pink hover:bg-cyber-pink/80 text-white font-bold tracking-[0.2em] uppercase py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(255,0,60,0.5)] hover:shadow-[0_0_40px_rgba(255,0,60,0.8)]">
                  Execute Run
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
