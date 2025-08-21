import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  question_text: string;
  question_order: number;
  options: Option[];
}

interface Option {
  id: string;
  option_text: string;
  option_letter: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
}

interface Exam {
  id: string;
  title: string;
  description: string;
}

interface QuestionManagementProps {
  exam: Exam;
  onBack: () => void;
}

const QuestionManagement: React.FC<QuestionManagementProps> = ({ exam, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          options(*)
        `)
        .eq('exam_id', exam.id)
        .order('question_order', { ascending: true });

      if (error) {
        console.error('Error fetching questions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch questions",
          variant: "destructive",
        });
        return;
      }

      // Transform the data to match our interfaces
      const transformedQuestions = (data || []).map(question => ({
        ...question,
        options: (question.options || []).map(option => ({
          ...option,
          option_letter: option.option_letter as 'A' | 'B' | 'C' | 'D'
        }))
      }));
      setQuestions(transformedQuestions);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [exam.id]);

  const resetForm = () => {
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectAnswer('A');
  };

  const loadQuestionForEditing = (question: Question) => {
    setQuestionText(question.question_text);
    const options = question.options || [];
    setOptionA(options.find(o => o.option_letter === 'A')?.option_text || '');
    setOptionB(options.find(o => o.option_letter === 'B')?.option_text || '');
    setOptionC(options.find(o => o.option_letter === 'C')?.option_text || '');
    setOptionD(options.find(o => o.option_letter === 'D')?.option_text || '');
    setCorrectAnswer(options.find(o => o.is_correct)?.option_letter || 'A');
    setEditingQuestion(question.id);
    setShowAddForm(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingQuestion) {
        // Update existing question
        const { error: questionError } = await supabase
          .from('questions')
          .update({ question_text: questionText.trim() })
          .eq('id', editingQuestion);

        if (questionError) {
          console.error('Error updating question:', questionError);
          throw questionError;
        }

        // Update options
        const optionsData = [
          { option_letter: 'A', option_text: optionA.trim(), is_correct: correctAnswer === 'A' },
          { option_letter: 'B', option_text: optionB.trim(), is_correct: correctAnswer === 'B' },
          { option_letter: 'C', option_text: optionC.trim(), is_correct: correctAnswer === 'C' },
          { option_letter: 'D', option_text: optionD.trim(), is_correct: correctAnswer === 'D' },
        ];

        // Delete existing options and insert new ones
        await supabase.from('options').delete().eq('question_id', editingQuestion);
        
        const { error: optionsError } = await supabase
          .from('options')
          .insert(optionsData.map(opt => ({
            question_id: editingQuestion,
            ...opt
          })));

        if (optionsError) {
          console.error('Error updating options:', optionsError);
          throw optionsError;
        }

        toast({
          title: "Success",
          description: "Question updated successfully",
        });
      } else {
        // Create new question
        const nextOrder = Math.max(...questions.map(q => q.question_order), 0) + 1;

        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .insert([{
            exam_id: exam.id,
            question_text: questionText.trim(),
            question_order: nextOrder
          }])
          .select()
          .single();

        if (questionError) {
          console.error('Error creating question:', questionError);
          throw questionError;
        }

        // Create options
        const optionsData = [
          { option_letter: 'A', option_text: optionA.trim(), is_correct: correctAnswer === 'A' },
          { option_letter: 'B', option_text: optionB.trim(), is_correct: correctAnswer === 'B' },
          { option_letter: 'C', option_text: optionC.trim(), is_correct: correctAnswer === 'C' },
          { option_letter: 'D', option_text: optionD.trim(), is_correct: correctAnswer === 'D' },
        ];

        const { error: optionsError } = await supabase
          .from('options')
          .insert(optionsData.map(opt => ({
            question_id: questionData.id,
            ...opt
          })));

        if (optionsError) {
          console.error('Error creating options:', optionsError);
          throw optionsError;
        }

        toast({
          title: "Success",
          description: "Question added successfully",
        });
      }

      resetForm();
      setShowAddForm(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        console.error('Error deleting question:', error);
        toast({
          title: "Error",
          description: "Failed to delete question",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });

      fetchQuestions();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setShowAddForm(false);
    setEditingQuestion(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exams
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-hsl(var(--foreground))">{exam.title}</h2>
          <p className="text-hsl(var(--muted-foreground))">Manage questions and options</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {questions.length} Questions
          </Badge>
        </div>
        {!showAddForm && (
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="btn-ieee-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </CardTitle>
            <CardDescription>
              {editingQuestion ? 'Update the question and options' : 'Create a new question with four options (A, B, C, D)'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionText">Question Text</Label>
              <Textarea
                id="questionText"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter your question here..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="optionA">Option A</Label>
                <Input
                  id="optionA"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="Enter option A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optionB">Option B</Label>
                <Input
                  id="optionB"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="Enter option B"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optionC">Option C</Label>
                <Input
                  id="optionC"
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  placeholder="Enter option C"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optionD">Option D</Label>
                <Input
                  id="optionD"
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  placeholder="Enter option D"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Select value={correctAnswer} onValueChange={(value: 'A' | 'B' | 'C' | 'D') => setCorrectAnswer(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Option A</SelectItem>
                  <SelectItem value="B">Option B</SelectItem>
                  <SelectItem value="C">Option C</SelectItem>
                  <SelectItem value="D">Option D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSaveQuestion} className="btn-ieee-primary">
                <Save className="h-4 w-4 mr-2" />
                {editingQuestion ? 'Update Question' : 'Save Question'}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            All questions for this exam
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hsl(var(--primary))"></div>
              <span className="ml-2 text-hsl(var(--muted-foreground))">Loading questions...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-hsl(var(--muted-foreground))">
                No questions found. Add your first question!
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="border-l-4 border-l-hsl(var(--primary))">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="secondary">Q{index + 1}</Badge>
                        </div>
                        <p className="text-hsl(var(--foreground)) font-medium mb-3">
                          {question.question_text}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(question.options || []).map((option) => (
                            <div
                              key={option.id}
                              className={`p-2 rounded border ${
                                option.is_correct 
                                  ? 'bg-hsl(var(--status-active))/10 border-hsl(var(--status-active)) text-hsl(var(--status-active))' 
                                  : 'bg-hsl(var(--muted)) border-hsl(var(--border))'
                              }`}
                            >
                              <span className="font-semibold">{option.option_letter})</span> {option.option_text}
                              {option.is_correct && (
                                <Badge className="ml-2 bg-hsl(var(--status-active)) text-white text-xs">
                                  Correct
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadQuestionForEditing(question)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionManagement;