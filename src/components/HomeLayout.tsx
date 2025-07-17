import React from 'react';
import UploadReportCard from './UploadReportCard';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

const navLinks = [
  { name: 'Token Access', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 4h.01M19.5 12a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0zm-7.5 0V9m0 3h.01" /></svg>
  ) },
  { name: 'Virtual Consultation', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6.75A2.25 2.25 0 0013.5 4.5h-3A2.25 2.25 0 008.25 6.75v3.75m7.5 0v6.75A2.25 2.25 0 0113.5 19.5h-3a2.25 2.25 0 01-2.25-2.25V10.5m7.5 0h-7.5" /></svg>
  ) },
  { name: 'Settings', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 3.75a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0v-1.5zm0 15a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0v-1.5zm8.25-7.5a.75.75 0 010 1.5h-1.5a.75.75 0 010-1.5h1.5zm-15 0a.75.75 0 010 1.5H3.75a.75.75 0 010-1.5h1.5zm12.02-5.27a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06zm-10.44 10.44a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06zm10.44 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 111.06-1.06l1.06 1.06zm-10.44-10.44a.75.75 0 01-1.06 1.06l1.06 1.06a.75.75 0 101.06-1.06l-1.06-1.06z" /></svg>
  ) },
];

interface HomeLayoutProps {
  doctorName: string;
  doctorEmail: string;
  onLogout: () => void;
}

export const HomeLayout: React.FC<HomeLayoutProps> = ({ doctorName, doctorEmail, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-sm">
        <div className="text-lg font-semibold text-gray-800">Hello, Dr. {doctorName}</div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <button
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>
      <PanelGroup direction="horizontal" autoSaveId="doctor-portal-layout" className="flex-1 overflow-hidden">
        <Panel minSize={15} defaultSize={18} maxSize={30} className="h-full">
          <nav className="h-full bg-white border-r border-gray-200 flex flex-col py-8 px-4 gap-2">
            {navLinks.map(link => (
              <button key={link.name} className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 font-medium transition">
                {link.icon}
                <span>{link.name}</span>
              </button>
            ))}
          </nav>
        </Panel>
        <PanelResizeHandle className="w-2 bg-blue-200 hover:bg-blue-400 transition-colors cursor-col-resize" />
        <Panel minSize={30} defaultSize={50} className="h-full">
          <main className="flex items-center justify-center p-8 h-full overflow-y-auto">
            <div className="w-full max-w-2xl min-h-[400px] bg-white rounded-xl shadow p-8 flex items-center justify-center text-gray-400 text-xl">
              Main content goes here (select a section)
            </div>
          </main>
        </Panel>
        <PanelResizeHandle className="w-2 bg-blue-200 hover:bg-blue-400 transition-colors cursor-col-resize" />
        <Panel minSize={18} defaultSize={22} maxSize={35} className="h-full">
          <aside className="h-full bg-white border-l border-gray-200 flex flex-col items-center py-8 px-6 gap-6 overflow-y-auto">
            <UploadReportCard />
          </aside>
        </Panel>
      </PanelGroup>
    </div>
  );
}; 