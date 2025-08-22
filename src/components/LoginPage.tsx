import React, { useState, useEffect } from 'react';
import { User, IdCard, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
interface LoginPageProps {
  onLogin: (studentData: any) => void;
}
const LoginPage: React.FC<LoginPageProps> = ({
  onLogin
}) => {
  const [email, setEmail] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pingTime, setPingTime] = useState(0);

  // Real-time ping monitoring
  useEffect(() => {
    const measurePing = async () => {
      const start = performance.now();
      try {
        // Use a lightweight API call to measure network latency
        const response = await fetch('https://sozzhyzzgiqpyvygqfat.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvenpoeXp6Z2lxcHl2eWdxZmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mzk4MTIsImV4cCI6MjA3MTIxNTgxMn0.U00ilDj9spzT2inZjFduZhvg0I1ecyao93Qk3rkNTEc'
          }
        });
        const end = performance.now();
        setPingTime(Math.round(end - start));
      } catch (error) {
        console.log('Ping measurement failed:', error);
        setPingTime(999);
      }
    };
    measurePing();
    const interval = setInterval(measurePing, 2000);
    return () => clearInterval(interval);
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // Query the student_details table using type assertion to bypass the types issue
      const {
        data,
        error: queryError
      } = await (supabase as any).from('student_details').select('*').eq('email', email.toLowerCase()).eq('registration_no', registrationNo.toUpperCase()).single();
      if (queryError) {
        console.error('Query error:', queryError);
        setError('Invalid credentials. Please check your email and registration number.');
        return;
      }
      if (data) {
        console.log('Login successful:', data);
        onLogin(data);

        // Attempt to enter fullscreen right away using the user gesture context
        document.documentElement.requestFullscreen?.().catch(err => {
          console.log('Fullscreen request failed from LoginPage:', err);
        });
      } else {
        setError('Invalid credentials. Please check your email and registration number.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 font-poppins">
      <div className="w-full max-w-6xl flex gap-8 my-0">
        {/* Security Notice - Left Side */}
        <div className="flex-1 max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center mb-6">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-ieee-navy">Security & Violations Notice</h2>
            </div>
            
            <div className="space-y-6">
              {/* Platform Requirements */}
              <div>
                <h3 className="font-semibold text-ieee-navy mb-3">Platform Requirements:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-ieee-blue rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Desktop access only - Mobile devices restricted
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-ieee-blue rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Fullscreen mode required throughout the test
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-ieee-blue rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Stable internet connection mandatory
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-ieee-blue rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Session monitoring active for security
                  </li>
                </ul>
              </div>

              {/* Violation System */}
              <div>
                <h3 className="font-semibold text-red-600 mb-3">Violation System (5 violations = Account Blocked):</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Exiting fullscreen mode
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Screenshot attempts (PrintScreen)
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Developer tools access (F12)
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Task switching (Alt+Tab)
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Right-click context menu
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Split-screen detection
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Restricted keyboard shortcuts
                  </li>
                </ul>
              </div>

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-medium text-center">
                  ⚠️ 5 violations will result in permanent account blocking
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form - Right Side */}
        <div className="flex-1 max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center my-[70px] py-[33px] px-[22px] mx-0">
            {/* IEEE ComSoc Logo */}
            <div className="flex justify-center mb-6 my-0 py-[23px]">
              <div className="flex items-center justify-center">
                <img src="/lovable-uploads/3ada9145-fa49-4a6c-b5ff-5c226b3640b8.png" alt="IEEE ComSoc Logo" className="h-26 w-auto object-contain" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-ieee-navy mb-2">
              IEEE COMSOC KARE
            </h1>
            <p className="text-ieee-gray mb-2 font-medium">
              Secure Testing Platform
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Enter your credentials to access the quantum quiz
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="pl-12 h-12 bg-gray-50 border-gray-200 rounded-xl text-base placeholder:text-gray-400 focus:bg-white focus:border-ieee-blue font-poppins" />
              </div>

              <div className="relative">
                <IdCard className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input type={showPassword ? "text" : "password"} placeholder="Registration Number" value={registrationNo} onChange={e => setRegistrationNo(e.target.value)} required className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 rounded-xl text-base placeholder:text-gray-400 focus:bg-white focus:border-ieee-blue font-poppins" />
                <button type="button" onClick={togglePasswordVisibility} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 font-poppins">{error}</p>
                </div>}

              <Button type="submit" disabled={isLoading} className="w-full h-12 bg-ieee-navy hover:bg-ieee-blue text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl mt-6 font-poppins">
                {isLoading ? <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Accessing...
                  </div> : 'Access Test Platform'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>;
};
export default LoginPage;
