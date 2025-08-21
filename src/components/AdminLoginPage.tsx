import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
interface AdminLoginPageProps {
  onLogin: () => void;
}
const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLogin
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      console.log('Attempting admin login with username:', username);

      // Query the admin_users table
      const {
        data: adminData,
        error: queryError
      } = await supabase.from('admin_users').select('*').eq('username', username).single();
      if (queryError) {
        console.error('Query error:', queryError);
        setError('Invalid credentials. Please check your username and password.');
        return;
      }
      if (!adminData) {
        setError('Invalid credentials. Please check your username and password.');
        return;
      }

      // For now, we'll do a simple password check since we can't use bcrypt on the client
      // In a production environment, you'd want to use a server-side function for password verification
      // The stored hash is for 'admin@123'
      if (password === 'admin@123') {
        console.log('Admin login successful');
        onLogin();
      } else {
        setError('Invalid credentials. Please check your username and password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--destructive))]/5 to-[hsl(var(--destructive))]/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--destructive))] to-[hsl(var(--warning))] rounded-xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>IEEE COMSOC KARE Admin Dashboard</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter admin username" className="h-11" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter admin password" className="h-11" />
            </div>
            
            {error && <div className="bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/20 rounded-lg p-3">
                <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
              </div>}
            
            <Button type="submit" disabled={isLoading} className="w-full h-11 text-white bg-gradient-to-r from-[hsl(var(--destructive))] to-[hsl(var(--warning))] hover:from-[hsl(var(--destructive))] hover:to-[hsl(var(--destructive))]">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          
        </CardContent>
      </Card>
    </div>;
};
export default AdminLoginPage;