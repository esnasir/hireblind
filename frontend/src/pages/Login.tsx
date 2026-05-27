import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { ArrowLeft, EyeOff, LockKeyhole, Shield } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

function AuthShowcase() {
  return (
    <div className="hidden min-h-screen flex-1 items-center justify-center border-l border-slate-200 bg-slate-50 px-10 lg:flex">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <EyeOff className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-950">Anonymous review mode</p>
            <p className="text-xs text-slate-500">Names and contact details stay locked.</p>
          </div>
        </div>
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {['Candidate A-184', 'Candidate B-209', 'Candidate C-771'].map((candidate, index) => (
            <div key={candidate} className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-950">{candidate}</p>
                <p className="text-xs text-slate-500">{index === 0 ? 'Strong Java and PostgreSQL fit' : index === 1 ? 'Good backend fundamentals' : 'Needs follow-up review'}</p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                {index === 0 ? '92%' : index === 1 ? '86%' : '74%'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
          Identity reveal requires admin permission and creates an audit event.
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.86C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.86z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.86c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
}

function getAuthResponse(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { status?: number; data?: { requiresRegistration?: boolean; email?: string; name?: string; message?: string } } }).response;
  }
  return undefined;
}

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
      const { accessToken, refreshToken, user } = res.data;
      setAuth(accessToken, refreshToken, user);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Login failed. Please check your credentials.'));
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
        const { accessToken, refreshToken, user } = res.data;
        setAuth(accessToken, refreshToken, user);
        navigate('/dashboard');
      } catch (err: unknown) {
        const response = getAuthResponse(err);
        if (response?.status === 428 && response.data?.requiresRegistration) {
          navigate('/register', {
            state: {
              googleEmail: response.data.email,
              googleName: response.data.name,
              fromGoogle: true
            }
          });
        } else {
          setError(getAuthErrorMessage(err, 'Google authentication failed.'));
        }
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google login failed.'),
  });

  return (
    <div className="flex min-h-screen bg-white text-slate-950 antialiased">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <Link to="/" className="mb-12 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> Back to HireBlind
        </Link>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Sign in</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Open your hiring workspace and continue reviewing candidates.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">Email address</label>
              <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-lg bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
              <Input id="password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 rounded-lg bg-white" />
            </div>
            <Button type="submit" className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <Button type="button" variant="outline" className="h-11 w-full gap-2" onClick={() => loginGoogle()} disabled={loading}>
            <GoogleIcon /> Continue with Google
          </Button>

          <p className="mt-8 text-center text-sm text-slate-500">
            New to HireBlind? <Link to="/register" className="font-semibold text-slate-950 hover:underline">Create a workspace</Link>
          </p>
        </div>
      </div>
      <AuthShowcase />
    </div>
  );
}
