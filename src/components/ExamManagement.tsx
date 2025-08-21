
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Power, PowerOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CreateExamDialog from './CreateExamDialog';
import EditExamDialog from './EditExamDialog';
import QuestionManagement from './QuestionManagement';

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  is_active: boolean;
  created_at: string;
  questionCount?: number;
}

const ExamManagement: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const { toast } = useToast();

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exams:', error);
        toast({
          title: "Error",
          description: "Failed to fetch exams",
          variant: "destructive",
        });
        return;
      }

      // Fetch question counts for each exam
      const examsWithCount = await Promise.all(
        (data || []).map(async (exam) => {
          const { count, error: countError } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id);

          if (countError) {
            console.error('Error fetching question count:', countError);
            return { ...exam, questionCount: 0 };
          }

          return { ...exam, questionCount: count || 0 };
        })
      );

      setExams(examsWithCount);
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
    fetchExams();

    // Set up real-time subscription for questions
    const questionsChannel = supabase
      .channel('questions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions'
        },
        () => {
          fetchExams(); // Refresh exam list when questions change
        }
      )
      .subscribe();

    // Set up real-time subscription for exams
    const examsChannel = supabase
      .channel('exams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exams'
        },
        () => {
          fetchExams(); // Refresh exam list when exams change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(questionsChannel);
      supabase.removeChannel(examsChannel);
    };
  }, []);

  const toggleExamStatus = async (examId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId);

      if (error) {
        console.error('Error updating exam status:', error);
        toast({
          title: "Error",
          description: "Failed to update exam status",
          variant: "destructive",
        });
        return;
      }

      setExams(prev => prev.map(exam => 
        exam.id === examId 
          ? { ...exam, is_active: !currentStatus }
          : exam
      ));

      toast({
        title: "Success",
        description: `Exam ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const deleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) {
        console.error('Error deleting exam:', error);
        toast({
          title: "Error",
          description: "Failed to delete exam",
          variant: "destructive",
        });
        return;
      }

      setExams(prev => prev.filter(exam => exam.id !== examId));
      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCreateExam = (newExam: Exam) => {
    setExams(prev => [newExam, ...prev]);
    setShowCreateDialog(false);
  };

  const handleEditExam = (exam: Exam) => {
    setSelectedExam(exam);
    setShowEditDialog(true);
  };

  const handleExamUpdated = (updatedExam: Exam) => {
    setExams(prev => prev.map(exam => 
      exam.id === updatedExam.id ? updatedExam : exam
    ));
    setShowEditDialog(false);
    setSelectedExam(null);
  };

  const handleManageQuestions = (exam: Exam) => {
    setSelectedExam(exam);
    setShowQuestions(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-hsl(var(--status-active)) text-white hover:bg-hsl(var(--status-active))">
        Active
      </Badge>
    ) : (
      <Badge className="bg-hsl(var(--muted)) text-hsl(var(--muted-foreground)) hover:bg-hsl(var(--muted))">
        Inactive
      </Badge>
    );
  };

  if (showQuestions && selectedExam) {
    return (
      <QuestionManagement 
        exam={selectedExam}
        onBack={() => {
          setShowQuestions(false);
          setSelectedExam(null);
          fetchExams(); // Refresh exam list to update question count
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-hsl(var(--foreground))">Exam Management</h2>
          <p className="text-hsl(var(--muted-foreground))">Create and manage exams and questions</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="btn-ieee-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Exam
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
          <CardDescription>
            Manage your exams, questions, and availability
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hsl(var(--primary))"></div>
                        <span className="ml-2 text-hsl(var(--muted-foreground))">Loading exams...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : exams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-hsl(var(--muted-foreground))">No exams found. Create your first exam!</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{exam.description}</TableCell>
                      <TableCell>{exam.duration} minutes</TableCell>
                      <TableCell>
                        <Badge variant="outline">{exam.questionCount || 0} questions</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(exam.is_active)}</TableCell>
                      <TableCell className="text-sm text-hsl(var(--muted-foreground))">
                        {new Date(exam.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditExam(exam)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManageQuestions(exam)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Questions
                          </Button>
                          <Switch
                            checked={exam.is_active}
                            onCheckedChange={() => toggleExamStatus(exam.id, exam.is_active)}
                            className="mx-2"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteExam(exam.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateExamDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onExamCreated={handleCreateExam}
      />

      <EditExamDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedExam(null);
        }}
        exam={selectedExam}
        onExamUpdated={handleExamUpdated}
      />
    </div>
  );
};

export default ExamManagement;
