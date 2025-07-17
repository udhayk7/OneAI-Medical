import React, { useState } from 'react';

interface RegisterDoctorProps {
  onRegisterSuccess: () => void;
}

export const RegisterDoctor: React.FC<RegisterDoctorProps> = ({ onRegisterSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
    experience_years: '',
    qualifications: '',
    hospital_name: '',
    available_from: '',
    available_to: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);
    try {
      const payload = {
        ...form,
        experience_years: form.experience_years ? parseInt(form.experience_years) : 0
      };
      const response = await fetch('/api/users/register-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Registration failed');
      }
      setSuccess(true);
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-4 sm:mx-0 bg-white border border-gray-200 shadow-md rounded-xl px-8 py-10 md:px-16 md:py-14">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">Doctor Registration</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <label className="block font-medium mb-1 text-gray-700">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
          </div>
          <div className="relative">
            <label className="block font-medium mb-1 text-gray-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            <span className="absolute left-3 top-9 text-gray-400">
              {/* Mailbox (Envelope) Icon - Heroicons outline */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.659 1.591l-7.5 7.5a2.25 2.25 0 01-3.182 0l-7.5-7.5A2.25 2.25 0 012.25 6.993V6.75" />
              </svg>
            </span>
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
          </div>
          <div className="relative">
            <label className="block font-medium mb-1 text-gray-700">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            <span className="absolute left-3 top-9 text-gray-400">
              {/* Lock Icon - Heroicons outline */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.125a4.5 4.5 0 10-9 0V10.5m12 0A2.25 2.25 0 0121.75 12.75v6a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25v-6A2.25 2.25 0 014.5 10.5h15z" />
              </svg>
            </span>
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Specialization</label>
            <input name="specialization" value={form.specialization} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Experience (years)</label>
            <input name="experience_years" type="number" min="0" value={form.experience_years} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Qualifications</label>
            <input name="qualifications" value={form.qualifications} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Hospital Name</label>
            <input name="hospital_name" value={form.hospital_name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Available From</label>
            <input name="available_from" type="time" value={form.available_from} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Available To</label>
            <input name="available_to" type="time" value={form.available_to} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="md:col-span-2">
            {error && <div className="flex items-center justify-center bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm font-medium mb-2"><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>{error}</div>}
            {success && <div className="flex items-center justify-center bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm font-medium mb-2"><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Registration successful! You can now log in.</div>}
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 