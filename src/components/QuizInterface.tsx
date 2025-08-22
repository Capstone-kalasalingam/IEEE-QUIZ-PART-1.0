import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { CheckCircle, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useExamPersistence } from '@/hooks/useExamPersistence';
import { useQuizAnswers } from '@/hooks/useQuizAnswers';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  question_text: string;
  question_order: number;
  options: Option[];
}

interface Option {
  id: string;
  option_text: string;
  option_letter: string;
  is_correct: boolean;
}

interface QuizInterfaceProps {
  studentData: any;
  examId?: string;
  sessionStartTime?: Date | null;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ studentData, examId, sessionStartTime }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<any>(null);
  const [sessionDuration, setSessionDuration] = useState(0); // in seconds
  const { toast: shadcnToast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { timeRemaining, setTimeRemaining } = useExamPersistence({
    studentData,
    examId: examData?.id || '',
    initialTimeRemaining: 3600
  });

  const { selectedAnswers, updateAnswer, clearAnswers } = useQuizAnswers({
    studentId: studentData?.id,
    examId: examData?.id || ''
  });

  const getDisplayTimeRemaining = () => {
    if (!examData?.duration) return 0;
    const examTimeInSeconds = examData.duration * 60;
    return Math.max(0, examTimeInSeconds - sessionDuration);
  };

  useEffect(() => {
    if (!sessionStartTime) return;

    const updateSessionDuration = () => {
      const now = new Date();
      const diffSeconds = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
      setSessionDuration(diffSeconds);
    };

    updateSessionDuration();
    const interval = setInterval(updateSessionDuration, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  useEffect(() => {
    if (examData?.duration && sessionDuration > 0 && !hasAutoSubmitted && !isSubmitting) {
      const examTimeInSeconds = examData.duration * 60;
      
      if (sessionDuration >= examTimeInSeconds) {
        console.log('Auto-submitting quiz - session time reached exam duration:', sessionDuration, 'exam time:', examTimeInSeconds);
        setHasAutoSubmitted(true);
        handleSubmitQuiz(true); // Pass true to indicate auto-submission
      }
    }
  }, [sessionDuration, examData?.duration, hasAutoSubmitted, isSubmitting]);

  useEffect(() => {
    fetchExamAndQuestions();
  }, []);

  useEffect(() => {
    if (examData?.duration && !studentData?.last_exam_time_remaining) {
      setTimeRemaining(examData.duration * 60);
    }
  }, [examData, studentData]);

  const fetchExamAndQuestions = async () => {
    try {
      const { data: activeExams, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
        .single();

      if (examError || !activeExams) {
        shadcnToast({
          title: "No Active Quiz",
          description: "There are no active quizzes at the moment.",
          variant: "destructive",
        });
        return;
      }

      setExamData(activeExams);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          options (*)
        `)
        .eq('exam_id', activeExams.id)
        .order('question_order');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        shadcnToast({
          title: "Error",
          description: "Failed to load quiz questions",
          variant: "destructive",
        });
        return;
      }

      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      shadcnToast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    updateAnswer(questionId, optionId);
  };

  const handleSubmitQuiz = async (isAutoSubmit = false) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const { data: existingResult, error: checkError } = await supabase
        .from('quiz_results')
        .select('id')
        .eq('student_id', studentData.id)
        .eq('exam_id', examData.id)
        .single();

      if (existingResult && !checkError) {
        console.log('Quiz already submitted, skipping...');
        setCurrentQuestionIndex(-1);
        return;
      }

      let correctAnswers = 0;
      const responses = [];

      for (const question of questions) {
        const selectedOptionId = selectedAnswers[question.id];
        if (selectedOptionId) {
          const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
          const isCorrect = selectedOption?.is_correct || false;
          
          if (isCorrect) correctAnswers++;

          responses.push({
            student_id: studentData.id,
            exam_id: examData.id,
            question_id: question.id,
            selected_option_id: selectedOptionId,
            is_correct: isCorrect
          });
        } else {
          responses.push({
            student_id: studentData.id,
            exam_id: examData.id,
            question_id: question.id,
            selected_option_id: null,
            is_correct: false
          });
        }
      }

      const { error: responsesError } = await supabase
        .from('quiz_responses')
        .insert(responses);

      if (responsesError) {
        console.error('Error saving responses:', responsesError);
        throw responsesError;
      }

      const scorePercentage = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
      const timeTaken = sessionDuration;

      const { error: resultError } = await supabase
        .from('quiz_results')
        .insert({
          student_id: studentData.id,
          exam_id: examData.id,
          total_questions: questions.length,
          correct_answers: correctAnswers,
          score_percentage: scorePercentage,
          time_taken: timeTaken
        });

      if (resultError) {
        console.error('Error saving result:', resultError);
        throw resultError;
      }

      await supabase
        .from('student_details')
        .update({
          current_exam_id: null,
          last_exam_time_remaining: null
        })
        .eq('id', studentData.id);

      clearAnswers();

      if (isAutoSubmit) {
        toast.success(`🎯 Quiz Auto-Submitted Successfully!\nResults will be announced later.`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#f0f9ff',
            color: '#0c4a6e',
            border: '2px solid #0ea5e9',
            fontWeight: '600',
            fontSize: '14px',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          },
        });
      } else {
        toast.success(`🎉 Quiz Submitted Successfully!\nResults will be announced later.`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '2px solid #22c55e',
            fontWeight: '600',
            fontSize: '14px',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          },
        });
      }

      setCurrentQuestionIndex(-1);

      // Close the tab automatically after successful submission
      setTimeout(() => {
        window.close();
        // Fallback if window.close() doesn't work (some browsers block it)
        if (!window.closed) {
          window.location.href = 'about:blank';
        }
      }, 2000);

    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error("❌ Submission Error: Failed to submit your quiz. Please try again.", {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#fef2f2',
          color: '#991b1b',
          border: '2px solid #ef4444',
          fontWeight: '600',
        },
      });
      setHasAutoSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length;
  };

  const shouldHideTimer = () => {
    if (!examData?.duration) return false;
    return sessionDuration >= (examData.duration * 60);
  };

  // Text selection prevention styles
  const noSelectStyle = {
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    MozUserSelect: 'none' as const,
    msUserSelect: 'none' as const,
    WebkitTouchCallout: 'none' as const,
    WebkitTapHighlightColor: 'transparent'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ieee-navy"></div>
        <span className="ml-2 text-ieee-gray">Loading quiz...</span>
      </div>
    );
  }

  if (!examData || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-ieee-navy mb-4">No Quiz Available</h2>
        <p className="text-ieee-gray">There are no active quizzes at the moment.</p>
      </div>
    );
  }

  if (currentQuestionIndex === -1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ieee-light-blue via-white to-ieee-light-blue font-poppins flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-status-active mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-ieee-navy mb-4">Quiz Completed!</h2>
            <p className="text-ieee-gray mb-6">
              Your answers have been submitted successfully. Thank you for participating in the quiz.
            </p>
            <div className="bg-ieee-light-blue/10 rounded-lg p-6">
              <p className="text-sm text-ieee-gray">
                Your results will be reviewed and made available through the appropriate channels.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const displayTimeRemaining = getDisplayTimeRemaining();

  return (
    <div className="min-h-screen bg-gradient-to-br from-ieee-light-blue via-white to-ieee-light-blue font-poppins relative" style={noSelectStyle}>
      {/* IEEE ComSoc Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
        <img 
          src="/lovable-uploads/3ada9145-fa49-4a6c-b5ff-5c226b3640b8.png" 
          alt="IEEE ComSoc Watermark" 
          className="w-96 h-96 opacity-5 object-contain"
        />
      </div>

      <div className="bg-white/95 backdrop-blur-sm border-b border-ieee-navy/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-ieee-navy">{examData.title}</h1>
              <p className="text-sm text-ieee-gray">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              {!shouldHideTimer() && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-ieee-navy" />
                  <span className={`font-mono text-sm ${displayTimeRemaining < 300 ? 'text-status-blocked' : 'text-ieee-navy'}`}>
                    {formatTime(displayTimeRemaining)}
                  </span>
                </div>
              )}
              <Badge variant="outline">
                {getAnsweredCount()}/{questions.length} Answered
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-20">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-ieee-navy">
              {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAnswers[currentQuestion.id] === option.id
                      ? 'border-ieee-blue bg-ieee-light-blue/10'
                      : 'border-gray-200 hover:border-ieee-blue/50 bg-white'
                  }`}
                  onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswers[currentQuestion.id] === option.id
                          ? 'border-ieee-blue bg-ieee-blue'
                          : 'border-gray-400'
                      }`}
                    >
                      {selectedAnswers[currentQuestion.id] === option.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="font-semibold text-ieee-navy mr-2">
                      {option.option_letter}.
                    </span>
                    <span className="text-ieee-gray flex-1">{option.option_text}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="btn-ieee-primary"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={isSubmitting}
                    className="btn-ieee-primary"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure to finish the exam?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Once you submit the quiz, you won't be able to make any changes to your answers. 
                      Make sure you have reviewed all your responses.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleSubmitQuiz(false)}>
                      Yes, Submit Quiz
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;
