import type { RecordingIntent, RecordingResult, ResultItem } from '../types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(audioBlob: Blob): Promise<{ text: string; confidence: number }> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to transcribe audio');
  }

  const data = await response.json();
  
  // Whisper returns average_logprob which we can convert to a confidence score
  // Higher (less negative) logprob = higher confidence
  const avgLogprob = data.segments?.[0]?.avg_logprob ?? -0.5;
  const confidence = Math.min(1, Math.max(0, 1 + avgLogprob));

  return {
    text: data.text?.trim() || '',
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Analyze transcribed text using OpenAI GPT to identify content
 */
export async function analyzeContent(
  transcription: string
): Promise<{ intent: RecordingIntent; result: RecordingResult }> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are Blablabla, an AI that identifies what users are saying or singing.

Your task is to analyze the transcribed text and determine:
1. The INTENT - what type of content this is:
   - "song" - user is singing, humming, or quoting song lyrics
   - "scripture" - user is quoting or asking about Bible verses
   - "quote" - user is quoting someone famous, a book, movie, etc.
   - "voice_note" - user is capturing their own thoughts/ideas
   - "unknown" - cannot determine

2. The RESULT - your best match(es) for what they said:
   - For songs: identify the song title, artist, and relevant lyrics
   - For scripture: identify the verse reference and text
   - For quotes: identify the source and full quote
   - For voice notes: extract key themes and related references

Always respond with valid JSON in this exact format:
{
  "intent": "song|scripture|quote|voice_note|unknown",
  "result": {
    "primary": {
      "type": "song|scripture|quote|insight|original",
      "title": "optional title",
      "attribution": "artist, author, or source",
      "content": "the full content or quote",
      "source_url": "optional URL",
      "confidence": 0.0-1.0
    },
    "alternatives": [],
    "follow_ups": ["suggested follow-up questions"]
  }
}

Be helpful and provide your best guess even if uncertain. Use the confidence score to indicate certainty.
If you truly cannot identify anything, set primary to null and explain in follow_ups.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this transcription: "${transcription}"` },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to analyze content');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from analysis');
  }

  try {
    const parsed = JSON.parse(content);
    return {
      intent: parsed.intent || 'unknown',
      result: {
        primary: parsed.result?.primary || null,
        alternatives: parsed.result?.alternatives || [],
        follow_ups: parsed.result?.follow_ups || [],
      },
    };
  } catch {
    throw new Error('Failed to parse analysis response');
  }
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
  const transcription = await transcribeAudio(audioBlob);

  if (!transcription.text) {
    return {
      transcription: { text: '', confidence: 0 },
      intent: 'unknown',
      result: {
        primary: null,
        alternatives: [],
        follow_ups: ['I couldn\'t hear anything. Try speaking louder or closer to the microphone.'],
      },
    };
  }

  // Step 2: Analyze
  onProgress?.({ stage: 'analyzing', message: 'Let me think about that...' });
  const analysis = await analyzeContent(transcription.text);

  return {
    transcription,
    intent: analysis.intent,
    result: analysis.result,
  };
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
