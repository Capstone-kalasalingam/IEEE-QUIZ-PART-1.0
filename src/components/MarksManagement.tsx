import React, { useState, useEffect } from 'react';
import { Download, FileText, Users, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

interface ExamResult {
  id: string;
  student_name: string;
  registration_no: number;
  exam_title: string;
  score_percentage: number;
  correct_answers: number;
  total_questions: number;
  total_marks: number;
  time_taken: number;
  submitted_at: string;
}

interface Exam {
  id: string;
  title: string;
  description: string;
}

const MarksManagement: React.FC = () => {
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
    fetchExamResults();
  }, []);

  useEffect(() => {
    fetchExamResults();
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, title, description')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to fetch exams');
    }
  };

  const fetchExamResults = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('quiz_results')
        .select(`
          id,
          score_percentage,
          correct_answers,
          total_questions,
          time_taken,
          submitted_at,
          exams!inner(title),
          student_details!inner(name, registration_no)
        `)
        .order('submitted_at', { ascending: false });

      if (selectedExam !== 'all') {
        query = query.eq('exam_id', selectedExam);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedResults = data?.map((result: any) => ({
        id: result.id,
        student_name: result.student_details.name,
        registration_no: result.student_details.registration_no,
        exam_title: result.exams.title,
        score_percentage: result.score_percentage,
        correct_answers: result.correct_answers,
        total_questions: result.total_questions,
        total_marks: result.correct_answers * 2, // Total marks = correct answers * 2
        time_taken: result.time_taken,
        submitted_at: result.submitted_at,
      })) || [];

      setExamResults(formattedResults);
    } catch (error) {
      console.error('Error fetching exam results:', error);
      toast.error('Failed to fetch exam results');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (examResults.length === 0) {
      toast.error('No data to export');
      return;
    }

    const selectedExamTitle = selectedExam === 'all' 
      ? 'All_Exams' 
      : exams.find(e => e.id === selectedExam)?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Exam';

    const headers = [
      'Student Name',
      'Registration No',
      'Exam Title',
      'Score (%)',
      'Correct Answers',
      'Total Questions',
      'Total Marks',
      'Time Taken (min)',
      'Submitted At'
    ];

    const csvContent = [
      headers.join(','),
      ...examResults.map(result => [
        `"${result.student_name}"`,
        result.registration_no,
        `"${result.exam_title}"`,
        result.score_percentage,
        result.correct_answers,
        result.total_questions,
        result.total_marks,
        result.time_taken ? Math.round(result.time_taken / 60) : 'N/A',
        new Date(result.submitted_at).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedExamTitle}_Results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV file downloaded successfully!');
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Good</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Poor</Badge>;
  };

  const calculateStats = () => {
    if (examResults.length === 0) return { avgScore: 0, totalStudents: 0, passCount: 0 };
    
    const avgScore = examResults.reduce((sum, result) => sum + result.score_percentage, 0) / examResults.length;
    const passCount = examResults.filter(result => result.score_percentage >= 40).length;
    
    return {
      avgScore: Math.round(avgScore * 100) / 100,
      totalStudents: examResults.length,
      passCount
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total Students</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Average Score</p>
                <p className="text-2xl font-bold text-green-600">{stats.avgScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Pass Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalStudents > 0 ? Math.round((stats.passCount / stats.totalStudents) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Exam Results & Marks</CardTitle>
              <CardDescription>
                View and download exam results for all students
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={downloadCSV} disabled={examResults.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Registration No.</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Correct/Total</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Time Taken</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Submitted At</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-slate-500">Loading results...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : examResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-slate-500">No exam results found</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  examResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.student_name}</TableCell>
                      <TableCell>{result.registration_no}</TableCell>
                      <TableCell>{result.exam_title}</TableCell>
                      <TableCell className="font-bold">{result.score_percentage}%</TableCell>
                      <TableCell>{result.correct_answers}/{result.total_questions}</TableCell>
                      <TableCell className="font-bold text-green-600">{result.total_marks}</TableCell>
                      <TableCell>
                        {result.time_taken ? `${Math.round(result.time_taken / 60)} min` : 'N/A'}
                      </TableCell>
                      <TableCell>{getScoreBadge(result.score_percentage)}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(result.submitted_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarksManagement;
