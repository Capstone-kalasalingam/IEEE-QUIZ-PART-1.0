import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminDashboardContent from './AdminDashboardContent';
import AdminLoginPage from './AdminLoginPage';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

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

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if admin is already logged in
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      setIsAuthenticated(true);
    }
    
    if (isAuthenticated) {
      fetchStudents();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('admin_session', 'true');
    fetchStudents();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_session');
    setActiveTab('dashboard');
    setIsMobileMenuOpen(false);
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_details')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to fetch students');
        return;
      }

      const formattedStudents = data?.map(student => ({
        id: student.id,
        name: student.name || 'N/A',
        registrationNo: student.registration_no?.toString() || 'N/A',
        email: student.email || 'N/A',
        status: student.status as 'active' | 'blocked' | 'pending' || 'pending',
        year: student.year || 'N/A',
        lastActivity: student.updated_at ? new Date(student.updated_at).toLocaleString() : 'Never',
        fullscreen_violations: student.fullscreen_violations || 0
      })) || [];

      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error in fetchStudents:', error);
      toast.error('An error occurred while fetching students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (studentData: any) => {
    try {
      const { data, error } = await supabase
        .from('student_details')
        .insert([{
          name: studentData.name,
          email: studentData.email,
          registration_no: parseInt(studentData.registration_no),
          year: studentData.year,
          status: studentData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding student:', error);
        toast.error('Failed to add student');
        return;
      }

      // Add the new student to local state
      const newStudent: Student = {
        id: data.id,
        name: data.name || 'N/A',
        registrationNo: data.registration_no?.toString() || 'N/A',
        email: data.email || 'N/A',
        status: data.status as 'active' | 'blocked' | 'pending',
        year: data.year || 'N/A',
        lastActivity: new Date(data.updated_at).toLocaleString(),
        fullscreen_violations: 0
      };

      setStudents(prev => [...prev, newStudent]);
      toast.success('Student added successfully!');
    } catch (error) {
      console.error('Error in handleAddStudent:', error);
      toast.error('An error occurred while adding student');
    }
  };

  const handleEditStudent = async (studentId: number, studentData: any) => {
    try {
      const { data, error } = await supabase
        .from('student_details')
        .update({
          name: studentData.name,
          email: studentData.email,
          registration_no: parseInt(studentData.registration_no),
          year: studentData.year,
          status: studentData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating student:', error);
        toast.error('Failed to update student');
        return;
      }

      // Update the student in local state
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? {
              ...student,
              name: data.name || 'N/A',
              email: data.email || 'N/A',
              registrationNo: data.registration_no?.toString() || 'N/A',
              year: data.year || 'N/A',
              status: data.status as 'active' | 'blocked' | 'pending',
              lastActivity: new Date(data.updated_at).toLocaleString()
            }
          : student
      ));

      toast.success('Student updated successfully!');
    } catch (error) {
      console.error('Error in handleEditStudent:', error);
      toast.error('An error occurred while updating student');
    }
  };

  const handleToggleStudentStatus = async (studentId: number) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const newStatus = student.status === 'active' ? 'blocked' : 'active';
      
      // If unblocking, reset violations to 0
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'active') {
        updateData.fullscreen_violations = 0;
      }

      const { error } = await supabase
        .from('student_details')
        .update(updateData)
        .eq('id', studentId);

      if (error) {
        console.error('Error updating student status:', error);
        toast.error('Failed to update student status');
        return;
      }

      // Update local state
      setStudents(prevStudents =>
        prevStudents.map(s =>
          s.id === studentId
            ? { 
                ...s, 
                status: newStatus, 
                lastActivity: new Date().toLocaleString(),
                fullscreen_violations: newStatus === 'active' ? 0 : s.fullscreen_violations
              }
            : s
        )
      );

      const action = newStatus === 'active' ? 'unblocked' : 'blocked';
      toast.success(`Student ${student.name} has been ${action} successfully!`);

      console.log(`Student ${studentId} ${action}. Violations reset to 0.`);
    } catch (error) {
      console.error('Error in handleToggleStudentStatus:', error);
      toast.error('An error occurred while updating student status');
    }
  };

  const handleApproveMobileAccess = async (studentId: number) => {
    try {
      const { error } = await supabase
        .from('student_details')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) {
        console.error('Error approving mobile access:', error);
        toast.error('Failed to approve mobile access');
        return;
      }

      setStudents(prevStudents =>
        prevStudents.map(s =>
          s.id === studentId
            ? { ...s, status: 'active', mobileAccessRequested: false, lastActivity: new Date().toLocaleString() }
            : s
        )
      );

      toast.success('Mobile access approved successfully!');
    } catch (error) {
      console.error('Error in handleApproveMobileAccess:', error);
      toast.error('An error occurred while approving mobile access');
    }
  };

  const handleDenyMobileAccess = async (studentId: number) => {
    try {
      const { error } = await supabase
        .from('student_details')
        .update({ 
          status: 'blocked',
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) {
        console.error('Error denying mobile access:', error);
        toast.error('Failed to deny mobile access');
        return;
      }

      setStudents(prevStudents =>
        prevStudents.map(s =>
          s.id === studentId
            ? { ...s, status: 'blocked', mobileAccessRequested: false, lastActivity: new Date().toLocaleString() }
            : s
        )
      );

      toast.success('Mobile access denied successfully!');
    } catch (error) {
      console.error('Error in handleDenyMobileAccess:', error);
      toast.error('An error occurred while denying mobile access');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AdminLoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-red-50 admin-theme">
      <AdminHeader 
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
        onLogout={handleLogout}
      />
      
      <div className="flex">
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />
        
        <div className="flex-1 p-3 md:p-6 lg:p-8 min-h-screen">
          <AdminDashboardContent
            activeTab={activeTab}
            students={students}
            loading={loading}
            onToggleStudentStatus={handleToggleStudentStatus}
            onApproveMobileAccess={handleApproveMobileAccess}
            onDenyMobileAccess={handleDenyMobileAccess}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
