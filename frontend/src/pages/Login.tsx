import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Shield, ArrowLeft, Lock } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data;
      setAuth(accessToken, user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await api.post('/auth/google', {
          credential: tokenResponse.access_token
        });
        const { accessToken, user } = res.data;
        setAuth(accessToken, user);
        navigate('/dashboard');
      } catch (err: any) {
        if (err.response?.status === 428 && err.response?.data?.requiresRegistration) {
          navigate('/register', {
            state: {
              googleEmail: err.response.data.email,
              googleName: err.response.data.name,
              fromGoogle: true
            }
          });
        } else {
          setError(err.response?.data?.message || 'Google authentication failed.');
        }
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google Login Failed');
    }
  });

  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Left Panel: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative">
        <Link to="/" className="absolute top-8 left-6 sm:left-12 flex items-center text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Link>

        <div className="w-full max-w-sm mx-auto">
          <div className="mb-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <Shield className="h-6 w-6 text-slate-800" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Welcome back</h1>
            <p className="text-[14px] text-slate-500 font-medium">Log in to your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-[13px] font-medium text-center border border-red-100">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Email address</label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 text-[14px] rounded-md border-slate-200 focus-visible:ring-slate-400"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 text-[14px] rounded-md border-slate-200 focus-visible:ring-slate-400"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[14px] font-medium mt-2"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Log in'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="w-1/5 border-b border-slate-200"></span>
            <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">or continue with</span>
            <span className="w-1/5 border-b border-slate-200"></span>
          </div>

          <Button 
            type="button"
            variant="outline"
            className="w-full h-10 mt-6 border-slate-200 text-slate-700 hover:bg-slate-50 text-[14px] font-medium"
            onClick={() => loginGoogle()}
            disabled={loading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.86C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.86z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.86c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>

          <p className="mt-8 text-center text-[13px] text-slate-500 font-medium">
            Don't have a workspace?{' '}
            <Link to="/register" className="text-slate-900 font-semibold hover:underline">
              Register company
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel: Compliance Showcase */}
      <div className="hidden lg:flex flex-1 bg-slate-50 border-l border-slate-200 items-center justify-center p-12 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
        
        <div className="relative max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 z-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-slate-900">SOC2 Compliant</div>
              <div className="text-[12px] text-slate-500 font-medium">Immutable Audit Ready</div>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug">
            "We shifted to HireBlind to meet our strict compliance requirements. The automated redaction is flawless, and the audit logs keep us completely secure."
          </h3>
          
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
            <div>
              <div className="text-[13px] font-bold text-slate-900">Sarah Jenkins</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">VP of Talent, TechFlow</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
