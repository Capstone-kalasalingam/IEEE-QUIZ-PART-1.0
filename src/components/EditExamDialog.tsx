
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

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  is_active: boolean;
  created_at: string;
  questionCount?: number;
}

interface EditExamDialogProps {
  open: boolean;
  onClose: () => void;
  exam: Exam | null;
  onExamUpdated: (exam: Exam) => void;
}

const EditExamDialog: React.FC<EditExamDialogProps> = ({
  open,
  onClose,
  exam,
  onExamUpdated
}) => {
  const [title, setTitle] = useState(exam?.title || '');
  const [description, setDescription] = useState(exam?.description || '');
  const [duration, setDuration] = useState(exam?.duration || 60);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (exam) {
      setTitle(exam.title);
      setDescription(exam.description || '');
      setDuration(exam.duration);
    }
  }, [exam]);

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setDuration(60);
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleUpdateExam = async () => {
    if (!exam || !title.trim()) {
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
        .update({
          title: title.trim(),
          description: description.trim(),
          duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', exam.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating exam:', error);
        toast({
          title: "Error",
          description: "Failed to update exam",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Exam updated successfully",
      });

      onExamUpdated({ ...data, questionCount: exam.questionCount });
      handleClose();
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Exam</DialogTitle>
          <DialogDescription>
            Update the exam information
          </DialogDescription>
        </DialogHeader>

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

          {exam && (
            <div className="p-3 bg-hsl(var(--muted)) rounded-lg">
              <div className="text-sm text-hsl(var(--muted-foreground))">
                Questions: {exam.questionCount || 0}
              </div>
              <div className="text-sm text-hsl(var(--muted-foreground))">
                Status: {exam.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateExam} 
            disabled={loading}
            className="btn-ieee-primary"
          >
            {loading ? 'Updating...' : 'Update Exam'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditExamDialog;
