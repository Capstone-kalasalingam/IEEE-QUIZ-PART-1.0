
import React from 'react';
import { XCircle, AlertTriangle, Phone, Mail } from 'lucide-react';

interface DisqualifiedScreenProps {
  reason: string;
}

const DisqualifiedScreen: React.FC<DisqualifiedScreenProps> = ({ reason }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg mx-4 text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <XCircle className="h-20 w-20 text-destructive" />
        </div>
        
        <h1 className="text-3xl font-bold text-destructive mb-4">
          Test Terminated
        </h1>
        
        <div className="bg-destructive/10 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
            <span className="font-semibold text-destructive">Disqualification Reason</span>
          </div>
          <p className="text-ieee-navy font-medium">
            {reason === 'Fullscreen violation' && 'Failed to maintain fullscreen mode'}
            {reason === 'Internet connectivity violation' && 'Lost internet connection for too long'}
            {reason.includes('Manual') && reason}
          </p>
        </div>
        
        <div className="space-y-4 text-sm text-ieee-gray">
          <p className="text-base text-ieee-navy">
            Your test session has been permanently terminated due to a security violation.
          </p>
          
          <div className="bg-ieee-light-blue/30 rounded-lg p-4">
            <p className="font-medium text-ieee-navy mb-2">What happens next?</p>
            <ul className="text-left space-y-1 text-xs">
              <li>• Your responses up to this point have been recorded</li>
              <li>• The incident has been logged for review</li>
              <li>• Contact support if you believe this was an error</li>
            </ul>
          </div>
          
          <div className="border-t pt-4 space-y-2">
            <p className="font-medium text-ieee-navy">Need Help?</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <a 
                href="mailto:support@ieeecomsoc-kare.edu" 
                className="inline-flex items-center text-ieee-blue hover:underline"
              >
                <Mail className="h-4 w-4 mr-1" />
                Email Support
              </a>
              <a 
                href="tel:+911234567890" 
                className="inline-flex items-center text-ieee-blue hover:underline"
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

export default DisqualifiedScreen;
