import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface TokenAccessProps {
  onPatientFetched: (patient: any, reports: any[]) => void;
}

export const TokenAccess: React.FC<TokenAccessProps> = ({ onPatientFetched }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setPatient(null);
    setReports([]);
    try {
      // 1. Get token row
      const { data: tokenRow, error: tokenErr } = await supabase
        .from('tokens')
        .select('patient_id')
        .eq('token_code', token)
        .single();
      if (tokenErr || !tokenRow) throw new Error('Invalid or expired token');
      // 2. Get patient info
      const { data: patientData, error: patientErr } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', tokenRow.patient_id)
        .single();
      if (patientErr || !patientData) throw new Error('Patient not found');
      // 3. Get reports
      const { data: reportsData, error: reportsErr } = await supabase
        .from('reports')
        .select('id, department, summary, created_at')
        .eq('patient_id', tokenRow.patient_id)
        .order('created_at', { ascending: false });
      if (reportsErr) throw new Error('Could not fetch reports');
      setPatient(patientData);
      setReports(reportsData || []);
      onPatientFetched(patientData, reportsData || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 4h.01M19.5 12a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0zm-7.5 0V9m0 3h.01" /></svg>
        Token Access
      </h3>
      <form onSubmit={handleFetch} className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter patient token"
          value={token}
          onChange={e => setToken(e.target.value)}
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Access'}
        </button>
      </form>
      {error && <div className="text-red-600 font-medium mb-2">{error}</div>}
      {patient && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {patient.name} ({patient.email})
          </div>
        </div>
      )}
      {reports.length > 0 && (
        <div>
          <div className="font-semibold text-gray-700 mb-2">Reports:</div>
          <ul className="divide-y divide-gray-200">
            {reports.map(r => (
              <li key={r.id} className="py-2 text-gray-600">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{r.department}</span>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-sm">{r.summary}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 