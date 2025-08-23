
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Bell, 
  Settings,
  BookOpen,
  MessageSquare
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  isOpen, 
  onClose 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'exams', label: 'Exams', icon: BookOpen },
    { id: 'marks', label: 'Marks', icon: FileText },
    { id: 'responses', label: 'Exam Responses', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onClose(); // Close mobile menu when item is selected
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:w-64 md:shadow-none md:border-r border-slate-200
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-slate-200">
            <h2 className="text-lg md:text-xl font-bold text-red-900">Admin Panel</h2>
            <p className="text-xs md:text-sm text-slate-600 mt-1">Test Management System</p>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-3 md:p-4">
            <ul className="space-y-1 md:space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleTabClick(item.id)}
                      className={`
                        w-full flex items-center px-3 md:px-4 py-2 md:py-3 text-left rounded-lg transition-colors duration-200 text-sm md:text-base
                        ${isActive 
                          ? 'bg-red-100 text-red-900 font-medium border-l-4 border-red-600' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }
                      `}
                    >
                      <IconComponent className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
