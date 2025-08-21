
import React, { useState } from 'react';
import { Smartphone, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const MobileRestriction = () => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registrationNo: '',
    email: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call to admin dashboard
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Request submitted successfully!');
      
      // Here you would typically send the request to your backend
      console.log('Mobile access request:', formData);
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ieee-light-blue to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-ieee-navy mb-2">Request Submitted</h2>
            <p className="text-ieee-gray mb-4">
              Your mobile access request has been sent to the administrator. 
              You will receive an email notification once your request is reviewed.
            </p>
            <p className="text-sm text-ieee-gray">
              Please use a desktop computer to access the test platform.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ieee-light-blue to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Smartphone className="h-16 w-16 text-ieee-navy" />
              <AlertTriangle className="h-6 w-6 text-destructive absolute -top-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-ieee-navy">
            Mobile Access Restricted
          </CardTitle>
          <CardDescription className="text-base">
            IEEE COMSOC KARE Testing Platform
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-ieee-light-blue/50 rounded-lg p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-status-warning mx-auto mb-2" />
            <p className="text-sm text-ieee-navy font-medium">
              This test platform is restricted to desktop computers only for security reasons.
            </p>
          </div>

          {!showRequestForm ? (
            <div className="space-y-4">
              <p className="text-sm text-ieee-gray text-center">
                If you need to access this platform from a mobile device due to exceptional circumstances, 
                you can request permission from the administrator.
              </p>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => setShowRequestForm(true)}
                  className="btn-ieee-secondary w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Request Admin Permission
                </Button>
                
                <p className="text-xs text-ieee-gray text-center">
                  Recommended: Use a desktop computer instead
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="registrationNo">Registration Number *</Label>
                <Input
                  id="registrationNo"
                  name="registrationNo"
                  value={formData.registrationNo}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter registration number"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Reason for Mobile Access *</Label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  placeholder="Explain why you need mobile access"
                  className="w-full px-3 py-2 border border-input rounded-md text-sm min-h-[80px] resize-none"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-ieee-primary flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileRestriction;
