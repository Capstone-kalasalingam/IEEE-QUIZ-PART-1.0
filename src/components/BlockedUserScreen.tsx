
import React from 'react';
import { Shield, AlertTriangle, Phone, Mail, User, Hash } from 'lucide-react';

interface BlockedUserScreenProps {
  studentData?: any;
}

const BlockedUserScreen: React.FC<BlockedUserScreenProps> = ({ studentData }) => {
  // Cap violations display at 5
  const displayViolations = studentData?.fullscreen_violations ? Math.min(studentData.fullscreen_violations, 5) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg mx-4 text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center">
            <Shield className="h-10 w-10 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Access Blocked
        </h1>
        
        {studentData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center mb-2">
              <User className="h-4 w-4 text-gray-600 mr-2" />
              <span className="font-semibold text-gray-800">{studentData.name}</span>
            </div>
            <div className="flex items-center justify-center">
              <Hash className="h-4 w-4 text-gray-600 mr-2" />
              <span className="text-sm text-gray-600">Reg: {studentData.registration_no}</span>
            </div>
          </div>
        )}
        
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="font-semibold text-red-600">Account Status</span>
          </div>
          <p className="text-gray-700 font-medium">
            Your account has been temporarily blocked by the administrator.
          </p>
          {displayViolations > 0 && (
            <p className="text-sm text-red-600 mt-2">
              Reason: Multiple fullscreen violations ({displayViolations}/5)
            </p>
          )}
        </div>
        
        <div className="space-y-4 text-sm text-gray-600">
          <p className="text-base text-gray-800">
            You are currently unable to access the IEEE COMSOC KARE testing platform.
          </p>
          
          {studentData?.current_exam_id && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">
                📝 Your exam progress has been saved and will resume when access is restored.
              </p>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium text-gray-800 mb-2">What can you do?</p>
            <ul className="text-left space-y-1 text-xs">
              <li>• Contact your administrator for assistance</li>
              <li>• Wait for your account to be reactivated</li>
              <li>• Ensure you follow all platform requirements</li>
              <li>• Your exam will automatically resume when unblocked</li>
            </ul>
          </div>
          
          <div className="border-t pt-4 space-y-2">
            <p className="font-medium text-gray-800">Need Help?</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <a 
                href="mailto:support@ieeecomsoc-kare.edu" 
                className="inline-flex items-center text-blue-600 hover:underline"
              >
                <Mail className="h-4 w-4 mr-1" />
                Email Support
              </a>
              <a 
                href="tel:+911234567890" 
                className="inline-flex items-center text-blue-600 hover:underline"
              >
                <Phone className="h-4 w-4 mr-1" />
                Call Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedUserScreen;
