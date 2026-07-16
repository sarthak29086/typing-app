import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Setup from './pages/Setup'
import Test from './pages/Test'
import Report from './pages/Report'
import { TestProvider } from './context/TestContext'
import './index.css'

function App() {
  return (
    <TestProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Setup />} />
          <Route path="/test" element={<Test />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </Router>
    </TestProvider>
  )
}

export default App
