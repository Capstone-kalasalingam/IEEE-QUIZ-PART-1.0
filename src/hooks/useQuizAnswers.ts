
import { useState, useEffect } from 'react';

interface UseQuizAnswersProps {
  studentId: number;
  examId: string;
}

export const useQuizAnswers = ({ studentId, examId }: UseQuizAnswersProps) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const storageKey = `quiz_answers_${studentId}_${examId}`;

  // Load answers from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedAnswers = JSON.parse(saved);
        console.log('Loaded saved answers:', parsedAnswers);
        setSelectedAnswers(parsedAnswers);
      }
    } catch (error) {
      console.error('Error loading saved answers:', error);
    }
  }, [storageKey]);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(selectedAnswers));
    } catch (error) {
      console.error('Error saving answers:', error);
    }
  }, [selectedAnswers, storageKey]);

  const updateAnswer = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const clearAnswers = () => {
    setSelectedAnswers({});
    localStorage.removeItem(storageKey);
  };

  return { selectedAnswers, updateAnswer, clearAnswers };
};
