import React, { useState } from 'react';

interface LoginDoctorProps {
  onLogin: () => void;
  onShowRegister: () => void;
}

export const LoginDoctor: React.FC<LoginDoctorProps> = ({ onLogin, onShowRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/users/login-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Login failed');
      }
      const data = await response.json();
      localStorage.setItem('doctor_jwt', data.access_token);
      localStorage.setItem('doctor_name', data.name);
      localStorage.setItem('doctor_email', data.email);
      localStorage.setItem('doctor_id', data.user_id);
      localStorage.setItem('doctor_role', data.role);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg md:max-w-xl xl:max-w-2xl mx-4 sm:mx-0 bg-white border border-gray-200 shadow-md rounded-xl px-10 py-14 md:px-16 md:py-20">
        <div className="flex flex-col items-center mb-8">
          <svg className="w-12 h-12 text-blue-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4zm0 0c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm0 0v6m0 0H9m3 0h3" /></svg>
          <span className="text-xl font-semibold text-gray-800">Doctor Login</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="email"
              id="email"
              className="w-full border border-gray-300 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="Email"
            />
            <span className="absolute left-3 top-2 text-gray-400">
              {/* Mailbox (Envelope) Icon - Heroicons outline */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.659 1.591l-7.5 7.5a2.25 2.25 0 01-3.182 0l-7.5-7.5A2.25 2.25 0 012.25 6.993V6.75" />
              </svg>
            </span>
          </div>
          <div className="relative">
            <input
              type="password"
              id="password"
              className="w-full border border-gray-300 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Password"
            />
            <span className="absolute left-3 top-2 text-gray-400">
              {/* Lock Icon - Heroicons outline */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.125a4.5 4.5 0 10-9 0V10.5m12 0A2.25 2.25 0 0121.75 12.75v6a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25v-6A2.25 2.25 0 014.5 10.5h15z" />
              </svg>
            </span>
          </div>
          {error && (
            <div className="flex items-center justify-center bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm font-medium">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:underline font-medium" onClick={onShowRegister}>
            Register new doctor
          </button>
        </div>
      </div>
    </div>
  );
}; 