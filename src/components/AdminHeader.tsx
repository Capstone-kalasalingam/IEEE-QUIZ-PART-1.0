
import React from 'react';
import { Menu, X, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminHeaderProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  onLogout: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  onMenuToggle,
  isMobileMenuOpen,
  onLogout
}) => {
  return (
    <header className="bg-white border-b border-red-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Left side - Logo and mobile menu toggle */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="md:hidden text-red-600 hover:bg-red-50"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-red-900">Admin Portal</h1>
            <p className="text-xs text-red-600">IEEE COMSOC KARE</p>
          </div>
        </div>
      </div>

      {/* Right side - Logout button */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;
