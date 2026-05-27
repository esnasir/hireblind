import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { ArrowLeft, Building2, CheckCircle2, Shield } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

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

function WorkspacePreview() {
  return (
    <div className="hidden min-h-screen flex-1 items-center justify-center border-l border-slate-200 bg-slate-50 px-10 lg:flex">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-950">Workspace setup</p>
            <p className="text-xs text-slate-500">Create a tenant for your hiring team.</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            'Invite recruiters and admins',
            'Create structured hiring campaigns',
            'Review anonymized candidate profiles',
            'Record reveal actions in the audit log',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
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

export default function Register() {
  const location = useLocation();
  const googleState = location.state as { googleEmail?: string; googleName?: string; fromGoogle?: boolean } | null;
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState(googleState?.googleName || '');
  const [email, setEmail] = useState(googleState?.googleEmail || '');
  const [isFromGoogle, setIsFromGoogle] = useState(!!googleState?.fromGoogle);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
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
        const res = await api.post('/auth/google', { credential: googleToken, companyName });
        const { accessToken, refreshToken, user } = res.data;
        setAuth(accessToken, refreshToken, user);
        navigate('/dashboard');
      } else {
        await api.post('/auth/register', { companyName, fullName, email, password });
        setSuccess('Registration successful. Please check your email to verify your account.');
        setTimeout(() => navigate('/login'), 4000);
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const registerGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await api.post('/auth/google', { credential: tokenResponse.access_token });
        const { accessToken, refreshToken, user } = res.data;
        setAuth(accessToken, refreshToken, user);
        navigate('/dashboard');
      } catch (err: unknown) {
        const response = getAuthResponse(err);
        if (response?.status === 428 && response.data?.requiresRegistration) {
          setGoogleToken(tokenResponse.access_token);
          setEmail(response.data.email || '');
          setFullName(response.data.name || '');
          setIsFromGoogle(true);
          setError('');
          setGoogleMessage('Google account verified. Enter your company name to finish setup.');
        } else {
          setError(getAuthErrorMessage(err, 'Google sign-up failed. Please try again.'));
        }
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-up failed. Please try again.'),
  });

  return (
    <div className="flex min-h-screen bg-white text-slate-950 antialiased">
      <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <Link to="/" className="mb-12 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> Back to HireBlind
        </Link>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Create workspace</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Set up HireBlind for your company and invite your hiring team.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</div>}
            {googleMessage && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{googleMessage}</div>}
            {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{success}</div>}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="companyName">Company name</label>
              <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Acme Corp" className="h-11 rounded-lg bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="fullName">Full name</label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required readOnly={isFromGoogle} placeholder="Jane Doe" className={`h-11 rounded-lg bg-white${isFromGoogle ? ' cursor-not-allowed bg-slate-50 text-slate-500' : ''}`} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">Work email</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required readOnly={isFromGoogle} placeholder="jane@company.com" className={`h-11 rounded-lg bg-white${isFromGoogle ? ' cursor-not-allowed bg-slate-50 text-slate-500' : ''}`} />
            </div>
            {!isFromGoogle && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Choose a password" className="h-11 rounded-lg bg-white" />
              </div>
            )}
            <Button type="submit" className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800" disabled={loading || !!success}>
              {loading ? 'Creating workspace...' : 'Create workspace'}
            </Button>
          </form>

          {!isFromGoogle && (
            <>
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">or</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <Button type="button" variant="outline" className="h-11 w-full gap-2" onClick={() => registerGoogle()} disabled={loading || !!success}>
                <GoogleIcon /> Sign up with Google
              </Button>
            </>
          )}

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have a workspace? <Link to="/login" className="font-semibold text-slate-950 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <WorkspacePreview />
    </div>
  );
}
