
import React from 'react';
import { User, Clock, Award } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

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

interface StudentResponsesListProps {
  responses: StudentResponse[];
  selectedStudent: StudentResponse | null;
  onSelectStudent: (student: StudentResponse) => void;
  loading: boolean;
  getScoreBadge: (score: number) => React.ReactNode;
}

const StudentResponsesList: React.FC<StudentResponsesListProps> = ({
  responses,
  selectedStudent,
  onSelectStudent,
  loading,
  getScoreBadge
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-slate-500">Loading responses...</span>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="p-8 text-center">
        <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No responses found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="p-2">
        {responses.map((response) => (
          <Button
            key={response.id}
            variant={selectedStudent?.id === response.id ? "default" : "ghost"}
            className="w-full justify-start p-4 h-auto mb-2 text-left"
            onClick={() => onSelectStudent(response)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <User className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <span className="font-medium truncate">{response.student_name}</span>
              </div>
              
              <div className="text-xs text-slate-500 space-y-1">
                <div>#{response.registration_no}</div>
                <div className="truncate">{response.exam_title}</div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(response.submitted_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="h-3 w-3" />
                    <span className="font-medium">{response.score_percentage}%</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-2">
                {getScoreBadge(response.score_percentage)}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default StudentResponsesList;
