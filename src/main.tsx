import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HomeLayout } from './components/HomeLayout';
import { LoginDoctor } from './auth/LoginDoctor';
import { RegisterDoctor } from './auth/RegisterDoctor';
import './index.css';

const App: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('doctor_jwt'));
  const [showRegister, setShowRegister] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('doctor_jwt');
    localStorage.removeItem('doctor_name');
    localStorage.removeItem('doctor_email');
    localStorage.removeItem('doctor_id');
    localStorage.removeItem('doctor_role');
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full flex flex-col items-center">
          {showRegister ? (
            <>
              <RegisterDoctor onRegisterSuccess={() => setShowRegister(false)} />
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:underline font-medium" onClick={() => setShowRegister(false)}>
                  Already have an account? Login
                </button>
              </div>
            </>
          ) : (
            <LoginDoctor onLogin={() => setLoggedIn(true)} onShowRegister={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    );
  }
  // Pass doctor info and logout handler to HomeLayout
  const doctorName = localStorage.getItem('doctor_name') || 'Doctor';
  const doctorEmail = localStorage.getItem('doctor_email') || '';
  return (
    <HomeLayout doctorName={doctorName} doctorEmail={doctorEmail} onLogout={handleLogout} />
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
); 