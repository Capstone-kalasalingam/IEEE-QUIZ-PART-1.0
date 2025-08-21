
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart, 
  Bell, 
  Settings,
  Trophy,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'marks', label: 'Marks & Results', icon: Trophy },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onClose(); // Close mobile menu after selection
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
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-red-200 
        transform transition-transform duration-300 ease-in-out admin-theme
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-red-200 md:hidden">
          <h2 className="text-lg font-bold text-red-900">Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-red-600 hover:bg-red-50 p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block p-6 border-b border-red-200">
          <h2 className="text-xl font-bold text-red-900">Admin Panel</h2>
          <p className="text-sm text-red-600 mt-1">Test Management System</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center px-3 py-3 text-left rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-red-100 text-red-800 border border-red-200 font-medium'
                        : 'text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${
                      activeTab === item.id ? 'text-red-800' : 'text-red-600'
                    }`} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default AdminSidebar;
