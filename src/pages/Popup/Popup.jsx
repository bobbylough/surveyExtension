import React, { useState, useEffect } from 'react';
import './Popup.css';

const Popup = () => {
  const [currentState, setCurrentState] = useState('loading'); // loading, blocked, welcome, survey, submitting, success, error
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check domain and initialize
  useEffect(() => {
    const checkDomainAndInit = async () => {
      try {
        // Check current domain
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab.url && tab.url.includes('sabiventures.com')) {
          setCurrentState('blocked');
          return;
        }

        // Fetch questions
        const response = await fetch('https://mockbackend.vercel.app/api/surveyQuestions');
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }
        
        const data = await response.json();
        setQuestions(data.questions);
        setCurrentState('welcome');
      } catch (err) {
        setError('Failed to load survey questions. Please try again.');
        setCurrentState('error');
      }
    };

    checkDomainAndInit();
  }, []);

  const startSurvey = () => {
    setCurrentState('survey');
    setCurrentQuestionIndex(0);
    setCurrentAnswer('');
  };

  const handleAnswerChange = (value) => {
    setCurrentAnswer(value);
  };

  const goToNext = () => {
    if (!currentAnswer.trim()) return;

    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: currentAnswer
    };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      // Submit survey
      submitSurvey(newAnswers);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevQuestion = questions[currentQuestionIndex - 1];
      setCurrentAnswer(answers[prevQuestion.id] || '');
    }
  };

  const submitSurvey = async (finalAnswers) => {
    setIsSubmitting(true);
    setCurrentState('submitting');

    try {
      const response = await fetch('https://mockbackend.vercel.app/api/surveyAnswers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalAnswers),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      setCurrentState('success');
    } catch (err) {
      setError('Failed to submit survey. Please try again.');
      setCurrentState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSurvey = () => {
    setAnswers({});
    setCurrentAnswer('');
    setCurrentQuestionIndex(0);
    setError('');
    setCurrentState('welcome');
  };

  const renderQuestion = () => {
    const question = questions[currentQuestionIndex];
    
    return (
      <div className="question-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        
        <div className="progress-text">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>

        <h3 className="question-title">{question.question}</h3>

        {question.answerType === 'multiple_choice' ? (
          <div className="options-container">
            {question.options.map((option) => (
              <label key={option} className="option-label">
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                />
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        ) : (
          <textarea
            className="text-input"
            placeholder="Type your answer here..."
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            rows={4}
          />
        )}

        <div className="navigation-buttons">
          <button 
            className="btn btn-secondary" 
            onClick={goToPrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={goToNext}
            disabled={!currentAnswer.trim()}
          >
            {currentQuestionIndex === questions.length - 1 ? 'Submit Survey' : 'Next'}
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentState) {
      case 'loading':
        return (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading survey...</p>
          </div>
        );

      case 'blocked':
        return (
          <div className="message-container">
            <div className="icon">🚫</div>
            <h2>Survey Not Available</h2>
            <p>No surveys are supported for this page.</p>
          </div>
        );

      case 'welcome':
        return (
          <div className="welcome-container">
            <div className="icon">📋</div>
            <h2>User Survey</h2>
            <p>Help us improve by answering {questions.length} quick questions.</p>
            <button className="btn btn-primary btn-large" onClick={startSurvey}>
              Start Survey
            </button>
          </div>
        );

      case 'survey':
        return renderQuestion();

      case 'submitting':
        return (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Submitting your responses...</p>
          </div>
        );

      case 'success':
        return (
          <div className="message-container">
            <div className="icon">✅</div>
            <h2>Thank You!</h2>
            <p>Your survey responses have been submitted successfully.</p>
            <button className="btn btn-secondary" onClick={resetSurvey}>
              Take Survey Again
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="message-container error">
            <div className="icon">❌</div>
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={resetSurvey}>
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="App">
      {renderContent()}
    </div>
  );
};

export default Popup;