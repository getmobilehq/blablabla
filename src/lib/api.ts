import type { RecordingIntent, RecordingResult, ResultItem } from '../types';
import { supabase } from './supabase';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Analyze audio using Supabase Edge Function (secure server-side OpenAI calls)
 */
export async function analyzeAudioSecure(
  audioBlob: Blob
): Promise<{
  transcription: { text: string; confidence: number };
  intent: RecordingIntent;
  result: RecordingResult;
}> {
  // Validate file size
  if (audioBlob.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  // Call Edge Function
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-audio`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to analyze audio' }));
    throw new Error(error.error || 'Failed to analyze audio');
  }

  return await response.json();
}

/**
 * Full analysis pipeline: transcribe and analyze
 */
export async function analyzeRecording(
  audioBlob: Blob,
  onProgress?: (status: { stage: string; message: string }) => void
): Promise<{
  transcription: { text: string; confidence: number };
  intent: RecordingIntent;
  result: RecordingResult;
}> {
  // Step 1: Transcribe
  onProgress?.({ stage: 'transcribing', message: 'Listening to what you said...' });

  // Step 2: Analyze (using secure Edge Function)
  onProgress?.({ stage: 'analyzing', message: 'Let me think about that...' });

  return await analyzeAudioSecure(audioBlob);
}

/**
 * Search for songs using web search (placeholder for now)
 * In production, this could use Genius API, Spotify API, or web search
 */
export async function searchSong(_query: string): Promise<ResultItem | null> {
  // This is a placeholder - in production, integrate with music APIs
  // For MVP, we're using GPT's knowledge which works well for popular songs
  return null;
}

/**
 * Search for Bible verses
 */
export async function searchScripture(query: string): Promise<ResultItem | null> {
  const BIBLE_API_KEY = import.meta.env.VITE_BIBLE_API_KEY;
  
  if (!BIBLE_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-02/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'api-key': BIBLE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const verse = data.data?.verses?.[0];

    if (!verse) {
      return null;
    }

    return {
      type: 'scripture',
      title: verse.reference,
      attribution: 'ESV',
      content: verse.text,
      source_url: `https://www.biblegateway.com/passage/?search=${encodeURIComponent(verse.reference)}&version=ESV`,
      confidence: 0.9,
    };
  } catch {
    return null;
  }
}
