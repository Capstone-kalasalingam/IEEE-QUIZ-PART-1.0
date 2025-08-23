import React, { useState, useMemo } from 'react';
import { Users, CheckCircle, XCircle, Settings, Eye, EyeOff, Search, Plus, Edit } from 'lucide-react';
import ExamManagement from './ExamManagement';
import MarksManagement from './MarksManagement';
import AddStudentDialog from './AddStudentDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

interface Student {
  id: number;
  name: string;
  registrationNo: string;
  email: string;
  status: 'active' | 'blocked' | 'pending';
  year: string;
  mobileAccessRequested?: boolean;
  lastActivity?: string;
  fullscreen_violations?: number;
}

interface AdminDashboardContentProps {
  activeTab: string;
  students: Student[];
  loading?: boolean;
  onToggleStudentStatus: (studentId: number) => void;
  onApproveMobileAccess: (studentId: number) => void;
  onDenyMobileAccess: (studentId: number) => void;
  onAddStudent?: (studentData: any) => void;
  onEditStudent?: (studentId: number, studentData: any) => void;
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({
  activeTab,
  students,
  loading = false,
  onToggleStudentStatus,
  onApproveMobileAccess,
  onDenyMobileAccess,
  onAddStudent,
  onEditStudent
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.registrationNo.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Active</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">Blocked</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">Pending</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
    }
  };

  const handleStatusToggle = (student: Student, checked: boolean) => {
    if (student.status === 'active' && !checked) {
      // Show confirmation dialog for blocking
      setSelectedStudent(student);
    } else {
      // Directly unblock
      onToggleStudentStatus(student.id);
    }
  };

  const confirmBlock = () => {
    if (selectedStudent) {
      onToggleStudentStatus(selectedStudent.id);
      setSelectedStudent(null);
    }
  };

  const handleAddStudent = (studentData: any) => {
    if (onAddStudent) {
      onAddStudent(studentData);
      toast({
        title: "Success",
        description: "Student added successfully",
      });
    }
  };

  const handleEditStudent = (studentData: any) => {
    if (onEditStudent && editingStudent) {
      onEditStudent(editingStudent.id, studentData);
      setEditingStudent(null);
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    }
  };

  const renderFilters = () => (
    <div className="flex flex-col space-y-3 mb-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or registration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px] text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="blocked">Blocked Only</SelectItem>
            <SelectItem value="pending">Pending Only</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>
    </div>
  );

  const renderMobileStudentCard = (student: Student) => (
    <Card key={student.id} className="mb-3">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{student.name}</h3>
              <p className="text-xs text-slate-500 truncate">#{student.registrationNo}</p>
              {student.year && <p className="text-xs text-slate-500">{student.year}</p>}
            </div>
            <div className="ml-2 flex flex-col items-end space-y-1">
              {getStatusBadge(student.status)}
              <Badge variant={student.fullscreen_violations && student.fullscreen_violations > 0 ? "destructive" : "secondary"} className="text-xs">
                {student.fullscreen_violations || 0}/5
              </Badge>
            </div>
          </div>

          {/* Email */}
          <div className="text-xs text-slate-600 truncate">
            {student.email}
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                checked={student.status === 'active'}
                onCheckedChange={(checked) => handleStatusToggle(student, checked)}
                disabled={student.status === 'pending'}
                variant="success"
              />
              <span className="text-xs text-slate-600">
                {student.status === 'active' ? 'Active' : 'Blocked'}
              </span>
            </div>

            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingStudent(student)}
                className="text-xs px-2 py-1 h-7"
              >
                <Edit className="h-3 w-3" />
              </Button>
              {student.mobileAccessRequested ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => onApproveMobileAccess(student.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDenyMobileAccess(student.id)}
                    className="text-xs px-2 py-1 h-7"
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleStudentStatus(student.id)}
                  className="text-xs px-2 py-1 h-7"
                >
                  {student.status === 'active' ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Last Activity */}
          {student.lastActivity && (
            <div className="text-xs text-slate-400 pt-1 border-t">
              Last: {student.lastActivity}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderStudentTable = () => (
    <div className="space-y-4">
      {renderFilters()}
      
      {/* Mobile View - Cards */}
      <div className="block md:hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-2 text-slate-500 text-sm">Loading students...</span>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-500 text-sm">
              {searchQuery || statusFilter !== 'all' ? 'No students match your filters' : 'No students found in database'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map(renderMobileStudentCard)}
          </div>
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">ID</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Registration</TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Email</TableHead>
              <TableHead className="text-xs">Year</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Violations</TableHead>
              <TableHead className="text-xs hidden xl:table-cell">Last Activity</TableHead>
              <TableHead className="text-xs">Block/Unblock</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <span className="ml-2 text-slate-500">Loading students...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="text-slate-500">
                    {searchQuery || statusFilter !== 'all' ? 'No students match your filters' : 'No students found in database'}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium text-xs">{student.id}</TableCell>
                  <TableCell className="font-medium text-xs">{student.name}</TableCell>
                  <TableCell className="text-xs">{student.registrationNo}</TableCell>
                  <TableCell className="text-xs hidden lg:table-cell truncate max-w-[150px]">{student.email}</TableCell>
                  <TableCell className="text-xs">{student.year}</TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                  <TableCell>
                    <Badge variant={student.fullscreen_violations && student.fullscreen_violations > 0 ? "destructive" : "secondary"} className="text-xs">
                      {student.fullscreen_violations || 0}/5
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 hidden xl:table-cell">
                    {student.lastActivity}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={student.status === 'active'}
                        onCheckedChange={(checked) => handleStatusToggle(student, checked)}
                        disabled={student.status === 'pending'}
                        variant="success"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingStudent(student)}
                        className="text-xs px-2 py-1"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {student.mobileAccessRequested ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => onApproveMobileAccess(student.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDenyMobileAccess(student.id)}
                            className="text-xs px-2 py-1"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleStudentStatus(student.id)}
                          className="text-xs px-2 py-1"
                        >
                          {student.status === 'active' ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="admin-theme">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600 truncate">Total Students</p>
                <p className="text-lg md:text-xl font-bold text-slate-900">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="admin-theme">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600 truncate">Active</p>
                <p className="text-lg md:text-xl font-bold text-green-600">
                  {students.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="admin-theme">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600 truncate">Blocked</p>
                <p className="text-lg md:text-xl font-bold text-red-600">
                  {students.filter(s => s.status === 'blocked').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="admin-theme">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600 truncate">Pending</p>
                <p className="text-lg md:text-xl font-bold text-yellow-600">
                  {students.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table with Filters */}
      <Card className="admin-theme">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-red-900 text-lg md:text-xl">Student Management</CardTitle>
          <CardDescription className="text-sm">
            Manage student access and monitor test sessions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6 pt-0">
          {renderStudentTable()}
        </CardContent>
      </Card>
    </div>
  );

  const renderStudents = () => (
    <Card className="admin-theme">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-red-900 text-lg md:text-xl">All Students</CardTitle>
        <CardDescription className="text-sm">Complete list of registered students from database</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {renderStudentTable()}
      </CardContent>
    </Card>
  );

  const renderPlaceholder = (title: string, description: string) => (
    <Card className="admin-theme">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-red-900 text-lg md:text-xl">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="py-8 md:py-12">
        <div className="text-center text-slate-500">
          <p className="text-sm">This section is under development.</p>
        </div>
      </CardContent>
    </Card>
  );

  const content = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'students':
        return renderStudents();
      case 'exams':
        return <ExamManagement />;
      case 'marks':
        return <MarksManagement />;
      case 'analytics':
        return renderPlaceholder('Analytics', 'View detailed analytics and reports');
      case 'notifications':
        return renderPlaceholder('Notifications', 'Manage system notifications');
      case 'settings':
        return renderPlaceholder('Settings', 'Configure system settings');
      default:
        return renderDashboard();
    }
  };

  return (
    <>
      {content()}
      
      {/* Add/Edit Student Dialog */}
      <AddStudentDialog
        open={showAddDialog || editingStudent !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingStudent(null);
          }
        }}
        student={editingStudent}
        onSubmit={editingStudent ? handleEditStudent : handleAddStudent}
      />
      
      {/* Block Confirmation Dialog */}
      <AlertDialog open={selectedStudent !== null} onOpenChange={() => setSelectedStudent(null)}>
        <AlertDialogContent className="mx-4 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Block Student</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to block <strong>{selectedStudent?.name}</strong>? 
              This will prevent them from accessing the test platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setSelectedStudent(null)} className="text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBlock}
              className="bg-red-600 hover:bg-red-700 text-sm"
            >
              Yes, Block Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminDashboardContent;
