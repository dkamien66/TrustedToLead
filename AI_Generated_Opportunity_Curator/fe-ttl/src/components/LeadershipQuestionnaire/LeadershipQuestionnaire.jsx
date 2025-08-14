import React, { useState, useContext } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useAppContext } from '../../context/AppContext';
import styles from './LeadershipQuestionnaire.module.css';
import { chatWithBot } from '../../services/api';

const LeadershipQuestionnaire = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const questions = [
    { text: "I actively seek and apply feedback from my peers and superiors.", points_for_yes: 3, response: "" },
    { text: "I effectively delegate tasks to empower my team members.", points_for_yes: 4, response: "" },
    { text: "I take initiative to mentor and develop others.", points_for_yes: 5, response: "" },
    { text: "I can clearly articulate a vision and inspire others to follow it.", points_for_yes: 5, response: "" },
    { text: "I remain composed and make sound decisions under pressure.", points_for_yes: 3, response: "" },
    { text: "I foster an inclusive and collaborative environment within my team.", points_for_yes: 4, response: "" },
    { text: "I am proactive in identifying and addressing potential conflicts.", points_for_yes: 3, response: "" },
    { text: "I am adaptable and embrace change within my leadership approach.", points_for_yes: 3, response: "" },
    { text: "I consistently set clear goals and hold myself and others accountable.", points_for_yes: 4, response: "" },
    { text: "I celebrate team successes and acknowledge individual contributions.", points_for_yes: 2, response: "" }
  ];

  const totalPossibleScore = questions.reduce((sum, q) => sum + q.points_for_yes, 0);

  const handleAnswer = (isYes) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (isYes) {
      setScore(score + currentQuestion.points_for_yes);
      currentQuestion.response = "Yes";
    }
    else {
      currentQuestion.response = "No";
    }
    
    if (currentQuestionIndex + 1 >= questions.length) {
      setIsCompleted(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const restartQuestionnaire = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsCompleted(false);
    setFeedback('');
    for (const q in questions) {
        q.response = ""
    }
  };

  const getPersonalizedFeedback = async () => {
    setIsLoadingFeedback(true);
    
    const systemPrompt = `First, provide a supportive comment on the overall score. Second, read the user's responses and then give encouraging and actionable feedback based on them, suggesting general areas of strength and areas for development in leadership skills. Assume higher scores indicate more developed skills.`;
    let feedbackPrompt = `The user completed a leadership questionnaire with a score of ${score} out of ${totalPossibleScore}.\n`;
    for (const q of questions) {
        feedbackPrompt += `The user responded ${q.response} to the statement ${q.text}\n`
    }
    
    try {
      // This is where you would make the actual API call to your backend
      // const response = await fetch('http://localhost:8000/chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message: feedbackPrompt,
      //     system_prompt: "You are an encouraging leadership coach...",
      //     chat_type: "questionnaire"
      //   })
      // });
      // const data = await response.json();
      // setFeedback(data.response || data.error || "Could not get feedback.");
      
      // For demo purposes, providing sample feedback based on score
      let backend = await chatWithBot(feedbackPrompt, systemPrompt);
      const text = typeof backend?.response === 'string' ? backend.response : '';
      if (!text) throw new Error('Empty response from server in Leadership Questionnaire');
      else setFeedback(text);
    } catch (err) {
        console.error('Leadership Questionnaire error:', err);
        setError('Sorry, there was an error getting feedback for the questionnaire. Please try again.');
      } finally {
        setIsLoadingFeedback(false);
      }
  };

  const getScoreColor = () => {
    const percentage = (score / totalPossibleScore) * 100;
    if (percentage >= 80) return "#16a34a"; // green
    if (percentage >= 60) return "#2563eb"; // blue
    if (percentage >= 40) return "#ca8a04"; // yellow
    return "#ea580c"; // orange
  };

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + (isCompleted ? 1 : 0)) / questions.length) * 100;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          ⭐ Leadership Self-Assessment Questionnaire
        </h1>
        <p className={styles.subtitle}>Discover your leadership strengths and areas for growth</p>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressHeader}>
          <span>Progress</span>
          <span>{isCompleted ? questions.length : currentQuestionIndex + 1} of {questions.length}</span>
        </div>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar} style={{ width: `${getProgressPercentage()}%`}}></div>
        </div>
      </div>

      {!isCompleted ? (
        <div className={styles.questionContainer}>
          <div>
            <h2 className={styles.questionTitle}>
              Question {currentQuestionIndex + 1}/{questions.length}
            </h2>
            <p className={styles.questionText}>
              {questions[currentQuestionIndex].text}
            </p>
          </div>
          
          <div className={styles.buttonContainer}>
            <button
              onClick={() => handleAnswer(true)}
              className={`${styles.button} ${styles.yesButton}`}
              onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              Yes
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className={`${styles.button} ${styles.noButton}`}
              onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
            >
              No
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className={styles.completedContainer}>
            <div>
              <h2 className={styles.completedTitle}>
                ✅ Questionnaire Complete!
              </h2>
              <p className={styles.completedSubtitle}>
                Thank you for taking the time to assess your leadership skills.
              </p>
            </div>
            
            <div>
              <h3 className={styles.scoreTitle}>Your Leadership Score</h3>
              <div className={styles.scoreValue} style={{color: getScoreColor()}}>
                {score}
              </div>
              <div className={styles.scoreDetails}>
                out of {totalPossibleScore} points
              </div>
              <div className={styles.scorePercentage}>
                ({Math.round((score / totalPossibleScore) * 100)}%)
              </div>
            </div>

            <div className={styles.buttonContainer}>
              <button
                onClick={getPersonalizedFeedback}
                disabled={isLoadingFeedback}
                className={`${styles.button} ${styles.feedbackButton}`}
                style={{
                  opacity: isLoadingFeedback ? 0.5 : 1,
                  cursor: isLoadingFeedback ? 'not-allowed' : 'pointer'
                }}
              >
                📈 {isLoadingFeedback ? 'Getting Feedback...' : 'Get Personalized Feedback'}
              </button>
              
              <button
                onClick={restartQuestionnaire}
                className={`${styles.button} ${styles.restartButton}`}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
              >
                🔄 Restart Questionnaire
              </button>
            </div>
          </div>

          {feedback && (
            <div className={styles.feedbackContainer}>
              <h3 className={styles.feedbackTitle}>
                📈 Personalized Feedback
              </h3>
              <div className={styles.feedbackText}>
                {feedback}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadershipQuestionnaire;