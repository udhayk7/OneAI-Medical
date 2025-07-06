import React, { useState, useRef, useEffect } from 'react';
import { Transition } from '@headlessui/react';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error: Error | null;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

// Types
interface ReportResponse {
  transcription: string;
  summary: string;
  report: string;
  created_at?: string;
}

const DEPARTMENTS = [
  'general',
  'cardiology',
  'ent',
  'neurology',
  'orthopedics',
  'pediatrics',
  'dermatology'
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/wav',
  'audio/mp3',
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/mpga',
  'audio/webm;codecs=opus'
];

export const UploadReportCard: React.FC = () => {
  // Form state
  const [patientId, setPatientId] = useState('');
  const [department, setDepartment] = useState<typeof DEPARTMENTS[number]>('general');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isReportExpanded, setIsReportExpanded] = useState(false);
  
  // Live transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // Set language to English
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          setLiveTranscript(prev => prev + result[0].transcript + ' ');
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError('Speech recognition error: ' + event.error);
        stopRecording();
      };
    }
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setLiveTranscript('');
      setRecordedChunks([]);
      setIsLiveMode(true);
      setAudioFile(null); // Clear any previously uploaded file
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        if (recordedChunks.length > 0) {
          const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
          const file = new File([audioBlob], 'recorded-audio.webm', { type: 'audio/webm' });
          setAudioFile(file);
        }
      };
      
      setMediaRecorder(recorder);
      recorder.start(1000); // Record in 1-second chunks
      recognitionRef.current?.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setLiveTranscript('');
    setIsLiveMode(false);
    
    if (!file) return;
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    // Validate file type
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      setError('Unsupported audio format. Please use MP3, WAV, M4A, WEBM, or MPEG');
      return;
    }
    
    setAudioFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!patientId) {
      setError('Please enter a patient ID');
      return;
    }
    
    if (!department) {
      setError('Please select a department');
      return;
    }
    
    if (!audioFile) {
      setError('Please record or upload an audio file');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('patient_id', patientId);
      formData.append('department', department);
      formData.append('audio_file', audioFile);
      
      const response = await fetch('http://localhost:8000/api/reports/add', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload report');
      }
      
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPatientId('');
    setDepartment('general');
    setAudioFile(null);
    setReport(null);
    setError(null);
    setLiveTranscript('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Medical Report</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient ID */}
          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
              Patient ID
            </label>
            <input
              id="patientId"
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter patient UUID"
            />
          </div>
          
          {/* Department Selection */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value as typeof DEPARTMENTS[number])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept.charAt(0).toUpperCase() + dept.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Audio Recording */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Input
            </label>
            <div className="space-y-4">
              {/* Mode Selection */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                    isLiveMode
                      ? isRecording
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-colors duration-200`}
                >
                  {isRecording ? (
                    <>
                      <div className="w-3 h-3 bg-red-200 rounded-full animate-pulse mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    'Start Recording'
                  )}
                </button>
                
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_AUDIO_TYPES.join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                    id="audio-upload"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      !isLiveMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors duration-200`}
                  >
                    Choose File
                  </button>
                </div>
              </div>

              {/* Live Transcript Display */}
              {isLiveMode && (
                <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 transition-opacity duration-200 ${
                  isRecording ? 'opacity-100' : 'opacity-75'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Live Transcript</h3>
                    {isRecording && (
                      <span className="text-xs text-gray-500 flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />
                        Recording...
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap min-h-[3rem]">
                    {liveTranscript || (isRecording ? 'Listening...' : 'Start recording to see transcript')}
                  </p>
                </div>
              )}

              {/* File Upload Display */}
              {!isLiveMode && audioFile && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Selected File</h3>
                  <p className="text-gray-600 text-sm">{audioFile.name}</p>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {isLiveMode 
                ? 'Recording will be saved automatically when you stop'
                : 'Supported formats: MP3, WAV, M4A, WEBM, MPEG (Max 10MB)'}
            </p>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading || (!audioFile && !isRecording)}
              className={`flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium
                ${(isLoading || (!audioFile && !isRecording)) ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'}
                transition-colors duration-200`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                  Processing...
                </div>
              ) : (
                'Generate Report'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50
                transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        </form>
        
        {/* Report Display */}
        <Transition
          show={!!report}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="mt-8 space-y-6">
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Transcription</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{report?.transcription}</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Summary</h3>
              <p className="text-gray-600">{report?.summary}</p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Full Medical Report</h3>
                <button
                  onClick={() => setIsReportExpanded(!isReportExpanded)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {isReportExpanded ? 'Show Less' : 'Show More'}
                </button>
              </div>
              
              <div className={`overflow-hidden transition-all duration-300 ${
                isReportExpanded ? 'max-h-[1000px]' : 'max-h-40'
              }`}>
                <div className="prose max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap">{report?.report}</p>
                </div>
              </div>
            </div>
            
            {report?.created_at && (
              <p className="text-sm text-gray-500">
                Uploaded at: {new Date(report.created_at).toLocaleString()}
              </p>
            )}
          </div>
        </Transition>
      </div>
    </div>
  );
};

export default UploadReportCard; 