import React, { createContext, useState, useContext } from 'react';

const TestContext = createContext();

export const TestProvider = ({ children }) => {
  const [testConfig, setTestConfig] = useState({
    name: '',
    practiceNo: '',
    timerSeconds: 60,
    paragraph: '',
  });

  const [testResults, setTestResults] = useState({
    timeTakenSeconds: 0,
    errors: 0,
    misspellings: 0,
    omissions: 0,
    additions: 0,
    grossWpm: 0,
    realSpeed: 0,
    totalKeystrokes: 0,
    typedText: '',
    targetText: ''
  });

  return (
    <TestContext.Provider value={{ testConfig, setTestConfig, testResults, setTestResults }}>
      {children}
    </TestContext.Provider>
  );
};

export const useTest = () => useContext(TestContext);
