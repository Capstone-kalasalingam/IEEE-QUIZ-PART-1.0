import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateExamDialogProps {
  open: boolean;
  onClose: () => void;
  onExamCreated: (exam: any) => void;
}

const CreateExamDialog: React.FC<CreateExamDialogProps> = ({
  open,
  onClose,
  onExamCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic info, 2: Question count
  const { toast } = useToast();

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setDuration(60);
    setQuestionCount(10);
    setStep(1);
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleCreateExam = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an exam title",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('exams')
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            duration,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating exam:', error);
        toast({
          title: "Error",
          description: "Failed to create exam",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Exam created successfully",
      });

      onExamCreated(data);
      setStep(2); // Move to question count step
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

  const handleProceedWithQuestions = () => {
    toast({
      title: "Questions Setup",
      description: `You can now add ${questionCount} questions to your exam from the Questions section`,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Create New Exam' : 'How many questions?'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'Enter the basic information for your new exam'
              : 'Specify the number of questions you want to add to this exam'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter exam title"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter exam description (optional)"
                rows={3}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                min={1}
                max={300}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-4 bg-hsl(var(--muted)) rounded-lg">
              <h3 className="font-semibold text-hsl(var(--foreground))">Exam Created Successfully!</h3>
              <p className="text-sm text-hsl(var(--muted-foreground)) mt-1">
                "{title}" is now ready for questions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionCount">Number of Questions</Label>
              <Input
                id="questionCount"
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                min={1}
                max={100}
                className="w-full"
              />
              <p className="text-xs text-hsl(var(--muted-foreground))">
                You can add more questions later from the exam management page
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateExam} 
                disabled={loading}
                className="btn-ieee-primary"
              >
                {loading ? 'Creating...' : 'Create Exam'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Skip for Now
              </Button>
              <Button 
                onClick={handleProceedWithQuestions}
                className="btn-ieee-primary"
              >
                Proceed with {questionCount} Questions
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamDialog;