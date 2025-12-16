import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types of scams available for testing
export type ScamCategory = 'call' | 'text' | 'email' | 'website';

export interface ScamDefinition {
  id: string;
  name: string;
  category: ScamCategory;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = easy to spot, 5 = very convincing
  navigateTo: string;
  params: Record<string, any>;
  isLegitimate?: boolean; // true for legitimate scenarios that aren't scams
}

// Metrics tracked for scoring
export interface ScamMetrics {
  // Call metrics
  callDuration?: number; // seconds on call
  sharedSensitiveInfo?: boolean;
  showedSuspicion?: boolean;
  endedCallEarly?: boolean;
  
  // Text/Email metrics
  clickedScamLink?: boolean;
  timeBeforeAction?: number; // seconds before clicking link or leaving
  
  // Website/Form metrics
  enteredCredentials?: boolean;
  submittedForm?: boolean;
  enteredPaymentInfo?: boolean;
  
  // Universal metrics
  recognizedAsScam?: boolean; // explicit user action saying "this is a scam"
  completedScam?: boolean; // user went all the way through
  
  // Legitimate scenario metrics
  reportedAsScam?: boolean; // user incorrectly reported a legit message as scam
  trustedCorrectly?: boolean; // user correctly trusted a legit message
  clickedLegitLink?: boolean; // user clicked a legitimate link
}

export interface ScamResult {
  scam: ScamDefinition;
  metrics: ScamMetrics;
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string;
  startTime: number;
  endTime: number;
}

interface TestModeState {
  isActive: boolean;
  currentScamIndex: number;
  scamsToShow: ScamDefinition[];
  results: ScamResult[];
  sessionId: string;
  currentScamStartTime: number | null;
}

interface TestModeContextType {
  state: TestModeState;
  startTestMode: () => void;
  endTestMode: () => void;
  startScam: () => void;
  recordMetrics: (metrics: Partial<ScamMetrics>) => void;
  completeCurrentScam: () => ScamResult | null;
  getCurrentScam: () => ScamDefinition | null;
  getOverallScore: () => { score: number; grade: string; };
  isTestMode: boolean;
}

// All available scams for testing
const ALL_SCAMS: ScamDefinition[] = [
  // Phone Call Scams
  {
    id: 'grandchild-scam',
    name: 'Grandchild Emergency',
    category: 'call',
    difficulty: 2,
    navigateTo: 'ScamCall',
    params: { scenario: 'grandchild', mode: 'test' }
  },
  {
    id: 'bank-security-scam',
    name: 'Bank Fraud Department',
    category: 'call',
    difficulty: 4,
    navigateTo: 'ScamCall',
    params: { scenario: 'bankSecurity', mode: 'test' }
  },
  {
    id: 'hydro-quebec-call',
    name: 'Hydro-Québec Emergency',
    category: 'call',
    difficulty: 3,
    navigateTo: 'ScamCall',
    params: { scenario: 'hydroQuebec', mode: 'test' }
  },
  
  // Text Message Scams
  {
    id: 'canada-post-text',
    name: 'Canada Post Fee',
    category: 'text',
    difficulty: 2,
    navigateTo: 'Message',
    params: { scenario: 'canada-post', mode: 'test', initialConversationId: 'canada-post' }
  },
  {
    id: 'hydro-quebec-text',
    name: 'Hydro-Québec Refund',
    category: 'text',
    difficulty: 3,
    navigateTo: 'Message',
    params: { scenario: 'hydro-quebec', mode: 'test', initialConversationId: 'hydro-quebec' }
  },
  {
    id: 'td-bank-text',
    name: 'TD Bank Security',
    category: 'text',
    difficulty: 3,
    navigateTo: 'Message',
    params: { scenario: 'td-bank', mode: 'test', initialConversationId: 'td-bank' }
  },
  
  // Email Scams
  {
    id: 'loto-quebec-email',
    name: 'Loto-Québec Prize',
    category: 'email',
    difficulty: 2,
    navigateTo: 'Gmail',
    params: { scenario: 'loto-quebec', mode: 'test' }
  },
];

// Legitimate scenarios to include in tests
const LEGITIMATE_SCENARIOS: ScamDefinition[] = [
  // Legitimate Text Messages
  {
    id: 'legit-canada-post',
    name: 'Real Canada Post',
    category: 'text',
    difficulty: 3,
    navigateTo: 'Message',
    params: { scenario: 'legit-canada-post', mode: 'test', initialConversationId: 'legit-canada-post' },
    isLegitimate: true
  },
  {
    id: 'legit-clinic',
    name: 'Medical Clinic Reminder',
    category: 'text',
    difficulty: 2,
    navigateTo: 'Message',
    params: { scenario: 'legit-clinic', mode: 'test', initialConversationId: 'legit-clinic' },
    isLegitimate: true
  },
  {
    id: 'legit-saaq',
    name: 'SAAQ Notice',
    category: 'text',
    difficulty: 3,
    navigateTo: 'Message',
    params: { scenario: 'legit-saaq', mode: 'test', initialConversationId: 'legit-saaq' },
    isLegitimate: true
  },
  
  // Legitimate Emails
  {
    id: 'legit-google',
    name: 'Google Security Code',
    category: 'email',
    difficulty: 3,
    navigateTo: 'Gmail',
    params: { scenario: 'legit-google', mode: 'test' },
    isLegitimate: true
  },
  {
    id: 'legit-cra',
    name: 'CRA Account Update',
    category: 'email',
    difficulty: 4,
    navigateTo: 'Gmail',
    params: { scenario: 'legit-cra', mode: 'test' },
    isLegitimate: true
  },
  {
    id: 'legit-desjardins',
    name: 'Desjardins Activity',
    category: 'email',
    difficulty: 3,
    navigateTo: 'Gmail',
    params: { scenario: 'legit-desjardins', mode: 'test' },
    isLegitimate: true
  },
];

// Select diverse scams for a test session
const selectScamsForSession = (count: number = 6): ScamDefinition[] => {
  const selected: ScamDefinition[] = [];
  const categories: ScamCategory[] = ['call', 'text', 'email'];
  
  // First, add 1-2 legitimate scenarios
  const legitCount = Math.random() < 0.5 ? 1 : 2;
  const shuffledLegit = [...LEGITIMATE_SCENARIOS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < legitCount && i < shuffledLegit.length; i++) {
    selected.push(shuffledLegit[i]);
  }
  
  const scamCount = count - legitCount;
  
  // Ensure at least one from each category
  categories.forEach(category => {
    const scamsInCategory = ALL_SCAMS.filter(s => s.category === category);
    if (scamsInCategory.length > 0) {
      const randomIndex = Math.floor(Math.random() * scamsInCategory.length);
      selected.push(scamsInCategory[randomIndex]);
    }
  });
  
  // Fill remaining slots with random scams (avoiding duplicates)
  const remaining = ALL_SCAMS.filter(s => !selected.find(sel => sel.id === s.id));
  while (selected.length < count && remaining.length > 0) {
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(randomIndex, 1)[0]);
  }
  
  // Shuffle and sort by difficulty (easier first, harder later)
  return selected.sort((a, b) => a.difficulty - b.difficulty);
};

// Calculate score based on metrics and scam type
const calculateScore = (scam: ScamDefinition, metrics: ScamMetrics): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; feedback: string } => {
  let score = 100;
  let feedback = '';
  
  // Handle legitimate scenarios differently
  if (scam.isLegitimate) {
    // For legitimate scenarios, we want users to trust them appropriately
    if (metrics.reportedAsScam) {
      score = 40;
      feedback = 'This was actually a legitimate message! Being overly cautious can cause you to miss important communications. Look for verification signs like official sender addresses and expected context.';
    } else if (metrics.trustedCorrectly) {
      score = 100;
      feedback = 'Excellent! You correctly recognized this as a legitimate message and responded appropriately.';
    } else if (metrics.clickedLegitLink) {
      score = 95;
      feedback = 'Good job! You correctly trusted this legitimate message and clicked the appropriate link.';
    } else {
      // User didn't interact much - give partial credit
      score = 70;
      feedback = 'This was a legitimate message. It\'s okay to be cautious, but try to recognize signs of authenticity like official domains and expected content.';
    }
    
    // Adjust for difficulty (harder to recognize as legitimate = more points for getting it right)
    if (score >= 80) {
      const difficultyBonus = (scam.difficulty - 1) * 3;
      score = Math.min(100, score + difficultyBonus);
    }
    
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';
    
    return { score: Math.max(0, Math.min(100, score)), grade, feedback };
  }
  
  // Original scam scoring logic
  switch (scam.category) {
    case 'call':
      // Phone call scoring
      if (metrics.sharedSensitiveInfo) {
        score -= 50;
        feedback = 'You shared sensitive information with the caller. Never share personal or financial details over the phone with unknown callers.';
      } else if (metrics.completedScam) {
        score -= 40;
        feedback = 'You stayed on the call too long. Scammers use time to build trust and pressure you.';
      } else if (metrics.showedSuspicion) {
        score += 0; // Already at 100
        feedback = 'Excellent! You showed healthy suspicion and questioned the caller.';
      } else if (metrics.endedCallEarly) {
        score -= 10;
        feedback = 'Good job ending the call, but try to recognize warning signs earlier.';
      }
      
      // Time penalty for calls
      if (metrics.callDuration) {
        if (metrics.callDuration > 120) {
          score -= 20;
        } else if (metrics.callDuration > 60) {
          score -= 10;
        } else if (metrics.callDuration < 30) {
          score += 10; // Bonus for quick recognition
        }
      }
      break;
      
    case 'text':
      // Text message scoring
      if (metrics.clickedScamLink) {
        score -= 30;
        feedback = 'You clicked on a suspicious link. Always verify URLs before clicking.';
        
        if (metrics.enteredCredentials || metrics.enteredPaymentInfo) {
          score -= 40;
          feedback = 'You entered sensitive information on a fake website. Scammers create convincing pages to steal your data.';
        } else if (metrics.submittedForm) {
          score -= 20;
        }
      } else {
        feedback = 'Great job! You correctly identified the suspicious link and didn\'t click it.';
      }
      break;
      
    case 'email':
      // Email scoring
      if (metrics.clickedScamLink) {
        score -= 25;
        feedback = 'You clicked on a phishing link. Check sender addresses and URLs carefully.';
        
        if (metrics.enteredCredentials) {
          score -= 45;
          feedback = 'You entered login credentials on a phishing page. Legitimate companies never ask for passwords via email.';
        }
      } else {
        feedback = 'Excellent! You recognized the phishing attempt and didn\'t fall for it.';
      }
      break;
      
    case 'website':
      // Fake website scoring
      if (metrics.enteredPaymentInfo) {
        score = 10;
        feedback = 'You entered payment information on a fake website. This is extremely dangerous.';
      } else if (metrics.enteredCredentials) {
        score = 25;
        feedback = 'You entered credentials on a fake website. Always verify the URL and look for security indicators.';
      } else if (metrics.submittedForm) {
        score = 50;
        feedback = 'You interacted with a fake form but didn\'t enter critical information.';
      } else {
        feedback = 'Well done! You recognized the fake website.';
      }
      break;
  }
  
  // Adjust for difficulty
  const difficultyBonus = (scam.difficulty - 1) * 5;
  if (score >= 80) {
    score = Math.min(100, score + difficultyBonus);
  }
  
  // Calculate grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';
  
  return { score: Math.max(0, Math.min(100, score)), grade, feedback };
};

const TestModeContext = createContext<TestModeContextType | undefined>(undefined);

export const TestModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TestModeState>({
    isActive: false,
    currentScamIndex: 0,
    scamsToShow: [],
    results: [],
    sessionId: '',
    currentScamStartTime: null,
  });
  
  const [currentMetrics, setCurrentMetrics] = useState<Partial<ScamMetrics>>({});
  
  const startTestMode = useCallback(() => {
    const scams = selectScamsForSession(6);
    setState({
      isActive: true,
      currentScamIndex: 0,
      scamsToShow: scams,
      results: [],
      sessionId: Date.now().toString(),
      currentScamStartTime: null,
    });
    setCurrentMetrics({});
  }, []);
  
  const endTestMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
    }));
  }, []);
  
  const startScam = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentScamStartTime: Date.now(),
    }));
    setCurrentMetrics({});
  }, []);
  
  const recordMetrics = useCallback((metrics: Partial<ScamMetrics>) => {
    setCurrentMetrics(prev => ({ ...prev, ...metrics }));
  }, []);
  
  const completeCurrentScam = useCallback((): ScamResult | null => {
    const currentScam = state.scamsToShow[state.currentScamIndex];
    if (!currentScam) return null;
    
    const endTime = Date.now();
    const startTime = state.currentScamStartTime || endTime;
    
    // Add timing metrics
    const finalMetrics: ScamMetrics = {
      ...currentMetrics,
      callDuration: currentScam.category === 'call' ? Math.floor((endTime - startTime) / 1000) : undefined,
      timeBeforeAction: Math.floor((endTime - startTime) / 1000),
    };
    
    const { score, grade, feedback } = calculateScore(currentScam, finalMetrics);
    
    const result: ScamResult = {
      scam: currentScam,
      metrics: finalMetrics,
      score,
      grade,
      feedback,
      startTime,
      endTime,
    };
    
    setState(prev => ({
      ...prev,
      results: [...prev.results, result],
      currentScamIndex: prev.currentScamIndex + 1,
      currentScamStartTime: null,
    }));
    
    setCurrentMetrics({});
    
    return result;
  }, [state.scamsToShow, state.currentScamIndex, state.currentScamStartTime, currentMetrics]);
  
  const getCurrentScam = useCallback((): ScamDefinition | null => {
    return state.scamsToShow[state.currentScamIndex] || null;
  }, [state.scamsToShow, state.currentScamIndex]);
  
  const getOverallScore = useCallback(() => {
    if (state.results.length === 0) return { score: 0, grade: 'N/A' };
    
    const totalScore = state.results.reduce((sum, r) => sum + r.score, 0);
    const avgScore = Math.round(totalScore / state.results.length);
    
    let grade: string;
    if (avgScore >= 90) grade = 'A';
    else if (avgScore >= 80) grade = 'B';
    else if (avgScore >= 70) grade = 'C';
    else if (avgScore >= 60) grade = 'D';
    else grade = 'F';
    
    return { score: avgScore, grade };
  }, [state.results]);
  
  return (
    <TestModeContext.Provider
      value={{
        state,
        startTestMode,
        endTestMode,
        startScam,
        recordMetrics,
        completeCurrentScam,
        getCurrentScam,
        getOverallScore,
        isTestMode: state.isActive,
      }}
    >
      {children}
    </TestModeContext.Provider>
  );
};

export const useTestMode = () => {
  const context = useContext(TestModeContext);
  if (!context) {
    throw new Error('useTestMode must be used within a TestModeProvider');
  }
  return context;
};
