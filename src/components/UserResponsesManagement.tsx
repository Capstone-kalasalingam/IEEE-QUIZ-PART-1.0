
import React, { useState, useEffect } from 'react';
import { Search, User, CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import StudentResponsesList from './StudentResponsesList';
import ResponseDetails from './ResponseDetails';

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

const UserResponsesManagement: React.FC = () => {
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<StudentResponse[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudentResponses();
  }, []);

  useEffect(() => {
    filterResponses();
  }, [searchQuery, responses]);

  const fetchStudentResponses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quiz_results')
        .select(`
          id,
          score_percentage,
          submitted_at,
          responses,
          exams!inner(title),
          student_details!inner(name, registration_no),
          questions:exams!inner(questions(*))
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const formattedResponses = data?.map((response: any) => ({
        id: response.id,
        student_name: response.student_details.name,
        registration_no: response.student_details.registration_no,
        exam_title: response.exams.title,
        score_percentage: response.score_percentage,
        submitted_at: response.submitted_at,
        responses: response.responses || [],
        questions: response.questions || []
      })) || [];

      setResponses(formattedResponses);
    } catch (error) {
      console.error('Error fetching student responses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student responses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterResponses = () => {
    if (!searchQuery.trim()) {
      setFilteredResponses(responses);
      return;
    }

    const filtered = responses.filter(response =>
      response.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.registration_no.toString().includes(searchQuery) ||
      response.exam_title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredResponses(filtered);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Good</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Poor</Badge>;
  };

  return (
    <div className="flex h-full min-h-[600px]">
      {/* Sidebar - Student List */}
      <div className="w-1/3 border-r bg-slate-50">
        <div className="p-4 border-b bg-white">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Student Responses</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, registration, or exam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <StudentResponsesList
          responses={filteredResponses}
          selectedStudent={selectedStudent}
          onSelectStudent={setSelectedStudent}
          loading={loading}
          getScoreBadge={getScoreBadge}
        />
      </div>

      {/* Main Content - Response Details */}
      <div className="flex-1 bg-white">
        {selectedStudent ? (
          <ResponseDetails
            student={selectedStudent}
            onBack={() => setSelectedStudent(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Student</h3>
              <p className="text-slate-500">Choose a student from the sidebar to view their exam responses</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserResponsesManagement;
