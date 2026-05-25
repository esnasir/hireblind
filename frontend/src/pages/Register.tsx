import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Shield, ArrowLeft, Building2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function Register() {
  const location = useLocation();
  const googleState = location.state as {
    googleEmail?: string;
    googleName?: string;
    fromGoogle?: boolean;
  } | null;

  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState(googleState?.googleName || '');
  const [email, setEmail] = useState(googleState?.googleEmail || '');
  const [isFromGoogle, setIsFromGoogle] = useState(!!googleState?.fromGoogle);
  const [googleToken, setGoogleToken] = useState<string | null>(null); // stored access token for re-use at submit
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleMessage, setGoogleMessage] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isFromGoogle && googleToken) {
        // ── Google registration path ─────────────────────────────────────────
        // Re-use the stored Google access token + the company name the user typed.
        // The backend creates the user as ACTIVE (Google already verified the email)
        // and returns a JWT immediately — no email verification step needed.
        const res = await api.post('/auth/google', {
          credential: googleToken,
          companyName,
        });
        const { accessToken, user } = res.data;
        setAuth(accessToken, user);
        navigate('/dashboard');
      } else {
        // ── Standard email/password registration path ────────────────────────
        await api.post('/auth/register', {
          companyName,
          fullName,
          email,
          password,
        });
        setSuccess('Registration successful! Please check your email to verify your account.');
        setTimeout(() => navigate('/login'), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const registerGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await api.post('/auth/google', {
          credential: tokenResponse.access_token,
        });
        // Existing user — log in directly
        const { accessToken, user } = res.data;
        setAuth(accessToken, user);
        navigate('/dashboard');
      } catch (err: any) {
        if (err.response?.status === 428 && err.response?.data?.requiresRegistration) {
          // New user — store token, pre-fill form, prompt for company name
          setGoogleToken(tokenResponse.access_token);
          setEmail(err.response.data.email || '');
          setFullName(err.response.data.name || '');
          setIsFromGoogle(true);
          setError('');
          setGoogleMessage('Google account verified! Enter your company name to complete sign-up.');
        } else {
          setError(err.response?.data?.message || 'Google sign-up failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-up failed. Please try again.');
    },
  });

  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Left Panel: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative py-12 overflow-y-auto">
        <Link to="/" className="absolute top-8 left-6 sm:left-12 flex items-center text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Link>

        <div className="w-full max-w-sm mx-auto mt-8">
          <div className="mb-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <Shield className="h-6 w-6 text-slate-800" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Create Workspace</h1>
            <p className="text-[14px] text-slate-500 font-medium">Onboard your company to HireBlind</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-[13px] font-medium text-center border border-red-100">
                {error}
              </div>
            )}
            {googleMessage && (
              <div className="bg-green-50 text-green-700 p-3 rounded-md text-[13px] font-medium text-center border border-green-100">
                {googleMessage}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 p-3 rounded-md text-[13px] font-medium text-center border border-green-100">
                {success}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Company Name</label>
              <Input
                type="text"
                placeholder="Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="h-10 text-[14px] rounded-md border-slate-200 focus-visible:ring-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Full Name</label>
              <Input
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                readOnly={isFromGoogle}
                className={`h-10 text-[14px] rounded-md border-slate-200 focus-visible:ring-slate-400${isFromGoogle ? ' bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Work Email</label>
              <Input
                type="email"
                placeholder="jane@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                readOnly={isFromGoogle}
                className={`h-10 text-[14px] rounded-md border-slate-200 focus-visible:ring-slate-400${isFromGoogle ? ' bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              />
              {isFromGoogle && (
                <p className="text-[11px] text-slate-400">Verified Google email — cannot be changed.</p>
              )}
            </div>
            
            {/* Password field — hidden for Google users, they authenticate via Google */}
            {!isFromGoogle && (
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
            )}
            
            <Button 
              type="submit" 
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[14px] font-medium mt-4"
              disabled={loading || !!success}
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </form>

          {!isFromGoogle && (
            <>
              <div className="mt-6 flex items-center justify-between">
                <span className="w-1/5 border-b border-slate-200"></span>
                <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider text-center flex-1 px-2">or register with google</span>
                <span className="w-1/5 border-b border-slate-200"></span>
              </div>

              <Button 
                type="button"
                variant="outline"
                className="w-full h-10 mt-4 border-slate-200 text-slate-700 hover:bg-slate-50 text-[14px] font-medium"
                onClick={() => registerGoogle()}
                disabled={loading || !!success}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.86C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.86z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.86c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </Button>
            </>
          )}

          <p className="mt-8 text-center text-[13px] text-slate-500 font-medium pb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-slate-900 font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel: Feature Showcase */}
      <div className="hidden lg:flex flex-1 bg-slate-50 border-l border-slate-200 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
        
        <div className="relative max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 z-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-slate-900">Tenant Architecture</div>
              <div className="text-[12px] text-slate-500 font-medium">B2B SaaS Ready</div>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug">
            "We were able to onboard our entire 30-person hiring team in under an hour. The strict RBAC controls give us total peace of mind."
          </h3>
          
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
            <div>
              <div className="text-[13px] font-bold text-slate-900">David Chen</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Head of Recruiting, Nexus Corp</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
