
import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, User, Calendar, Trophy, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StudentResponse {
  id: string;
  student_name: string;
  registration_no: number;
  exam_title: string;
  score_percentage: number;
  submitted_at: string;
  responses: any[];
  questions: any[];
}

interface ResponseDetailsProps {
  student: StudentResponse;
  onBack: () => void;
}

const ResponseDetails: React.FC<ResponseDetailsProps> = ({ student, onBack }) => {
  const getAnswerStatus = (questionIndex: number, selectedAnswer: string, correctAnswer: string) => {
    const isCorrect = selectedAnswer === correctAnswer;
    return {
      isCorrect,
      icon: isCorrect ? CheckCircle : XCircle,
      className: isCorrect ? 'text-green-600' : 'text-red-600',
      bgClassName: isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    };
  };

  const formatResponseData = () => {
    if (!student.responses || !Array.isArray(student.responses)) {
      return [];
    }

    return student.responses.map((response: any, index: number) => ({
      questionNumber: index + 1,
      question: response.question || `Question ${index + 1}`,
      selectedAnswer: response.selectedAnswer || response.answer || 'No answer',
      correctAnswer: response.correctAnswer || 'Unknown',
      options: response.options || []
    }));
  };

  const formattedResponses = formatResponseData();
  const correctAnswers = formattedResponses.filter(r => r.selectedAnswer === r.correctAnswer).length;
  const totalQuestions = formattedResponses.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center space-x-3 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{student.student_name}</h2>
            <p className="text-slate-500">Registration: #{student.registration_no}</p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <span className="font-bold text-lg">{student.score_percentage}%</span>
            </div>
            <Badge className={student.score_percentage >= 60 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {correctAnswers}/{totalQuestions} Correct
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-6 mt-3 text-sm text-slate-600">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Exam: {student.exam_title}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Submitted: {new Date(student.submitted_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Responses */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {formattedResponses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-slate-500">No response data available for this student.</p>
              </CardContent>
            </Card>
          ) : (
            formattedResponses.map((response, index) => {
              const status = getAnswerStatus(index, response.selectedAnswer, response.correctAnswer);
              const StatusIcon = status.icon;

              return (
                <Card key={index} className={`${status.bgClassName} border-l-4`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        Question {response.questionNumber}
                      </CardTitle>
                      <StatusIcon className={`h-5 w-5 ${status.className} flex-shrink-0`} />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-slate-700 font-medium">{response.question}</p>
                      
                      {response.options && response.options.length > 0 && (
                        <div className="space-y-2">
                          {response.options.map((option: string, optIndex: number) => {
                            const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D
                            const isSelected = response.selectedAnswer === optionLetter;
                            const isCorrect = response.correctAnswer === optionLetter;
                            
                            let optionClass = "p-2 rounded border text-sm ";
                            if (isSelected && isCorrect) {
                              optionClass += "bg-green-100 border-green-300 text-green-800";
                            } else if (isSelected && !isCorrect) {
                              optionClass += "bg-red-100 border-red-300 text-red-800";
                            } else if (isCorrect) {
                              optionClass += "bg-green-50 border-green-200 text-green-700";
                            } else {
                              optionClass += "bg-slate-50 border-slate-200 text-slate-600";
                            }

                            return (
                              <div key={optIndex} className={optionClass}>
                                <div className="flex items-center justify-between">
                                  <span><strong>{optionLetter}.</strong> {option}</span>
                                  <div className="flex space-x-1">
                                    {isSelected && (
                                      <Badge variant="outline" className="text-xs">Selected</Badge>
                                    )}
                                    {isCorrect && (
                                      <Badge className="bg-green-100 text-green-800 text-xs">Correct</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-sm text-slate-600">
                          <span>Student Answer: <strong>{response.selectedAnswer}</strong></span>
                        </div>
                        <div className="text-sm text-slate-600">
                          <span>Correct Answer: <strong>{response.correctAnswer}</strong></span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ResponseDetails;
