'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    try {
      setError(''); setLoading(true);
      await signUp(email, password, name);
      router.push('/dashboard');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  async function handleGoogle() {
    try { setLoading(true); await signInWithGoogle(); router.push('/dashboard'); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-center text-gray-500 mb-8">Start your couple budget journey</p>
        {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Full Name"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none" />
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Confirm Password"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none" />
          <button type="submit" disabled={loading} className="w-full bg-violet-600 text-white rounded-lg py-2.5 font-semibold hover:bg-violet-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <button onClick={handleGoogle} disabled={loading} className="w-full mt-4 border rounded-lg py-2.5 text-gray-700 hover:bg-gray-50">
          Continue with Google
        </button>
        <p className="text-center text-sm mt-6">Already have an account? <Link href="/login" className="text-violet-600">Sign in</Link></p>
      </div>
    </div>
  );
}
