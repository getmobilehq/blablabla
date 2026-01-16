// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

// Recording types
export interface Recording {
  id: string;
  user_id: string;
  audio_url: string | null;
  duration_seconds: number | null;
  transcription: string | null;
  transcription_confidence: number | null;
  intent: RecordingIntent;
  result: RecordingResult;
  collection_id: string | null;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

export type RecordingIntent = 'song' | 'quote' | 'scripture' | 'voice_note' | 'unknown';

export interface RecordingResult {
  primary: ResultItem | null;
  alternatives: ResultItem[];
  follow_ups: string[];
  metadata?: Record<string, unknown>;
}

export interface ResultItem {
  type: 'song' | 'quote' | 'scripture' | 'insight' | 'original';
  title?: string;
  attribution?: string;
  content: string;
  source_url?: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

// Collection types
export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  created_at: string;
}

// API Response types
export interface AnalyseResponse {
  success: boolean;
  recording_id: string;
  transcription: {
    text: string;
    confidence: number;
    duration_seconds: number;
  };
  intent: RecordingIntent;
  result: RecordingResult;
  created_at: string;
}

export interface TranscriptionResponse {
  text: string;
}

// UI State types
export type RecordingState = 'idle' | 'recording' | 'processing' | 'complete' | 'error';

export interface ProcessingStatus {
  stage: 'uploading' | 'transcribing' | 'analyzing' | 'complete';
  message: string;
  progress?: number;
}

// Auth types
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
