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
  // Add audio playback ref
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

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
    setIsLiveMode(false);
  };

  // Add effect to create audio file after recording stops
  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
      const file = new File([audioBlob], 'recorded-audio.webm', { type: 'audio/webm' });
      setAudioFile(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

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
    setIsLoading(true);
    setReport(null);
    try {
      if (!patientId) {
        setError('Please enter a patient ID.');
        setIsLoading(false);
        return;
      }
      if (!department) {
        setError('Please select a department.');
        setIsLoading(false);
        return;
      }
      if (!audioFile) {
        setError('Please record or upload an audio file.');
        setIsLoading(false);
        return;
      }
      // Validate file size and type again
      if (audioFile.size > MAX_FILE_SIZE) {
        setError('File size exceeds 10MB limit');
        setIsLoading(false);
        return;
      }
      if (!ALLOWED_AUDIO_TYPES.includes(audioFile.type)) {
        setError('Unsupported audio format. Please use MP3, WAV, M4A, WEBM, or MPEG');
        setIsLoading(false);
        return;
      }
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
        throw new Error(errorData.detail || 'Failed to generate report');
      }
      const data = await response.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
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
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-lg p-6 mt-8">
      <h2 className="text-2xl font-bold mb-4">Upload or Record Audio for Medical Report</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Patient ID</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Department</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={department}
            onChange={e => setDepartment(e.target.value as typeof DEPARTMENTS[number])}
            required
          >
            {DEPARTMENTS.map(dep => (
              <option key={dep} value={dep}>{dep.charAt(0).toUpperCase() + dep.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Audio File</label>
          <input
            type="file"
            accept={ALLOWED_AUDIO_TYPES.join(',')}
            onChange={handleFileChange}
            ref={fileInputRef}
            className="mb-2"
          />
          <div className="flex items-center space-x-2 mt-2">
            {!isRecording && (
              <button
                type="button"
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={startRecording}
                disabled={isRecording}
              >
                Record Audio
              </button>
            )}
            {isRecording && (
              <button
                type="button"
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={stopRecording}
              >
                Stop Recording
              </button>
            )}
            {audioFile && !isRecording && (
              <button
                type="button"
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                onClick={() => {
                  if (audioPlayerRef.current) {
                    audioPlayerRef.current.play();
                  }
                }}
              >
                Play Recording
              </button>
            )}
          </div>
          {audioFile && !isRecording && (
            <audio ref={audioPlayerRef} src={URL.createObjectURL(audioFile)} controls className="mt-2 w-full" />
          )}
        </div>
        {error && <div className="text-red-600 font-medium">{error}</div>}
        <button
          type="submit"
          className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
          disabled={isLoading}
        >
          {isLoading ? 'Generating Report...' : 'Submit'}
        </button>
      </form>
      {/* Report display logic remains unchanged */}
      {/* ... existing code ... */}
    </div>
  );
};

export default UploadReportCard; 