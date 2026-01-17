// Supabase Edge Function to securely handle OpenAI API calls
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const RATE_LIMIT_PER_HOUR = 10;

interface AnalyzeRequest {
  audioBlob: string; // base64 encoded
  userId: string;
}

interface RateLimitCheck {
  count: number;
}

serve(async (req) => {
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
      },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Initialize Supabase client with service role to verify JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const jwt = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the user is authenticated by checking the JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Rate limiting check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (count && count >= RATE_LIMIT_PER_HOUR) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 3600
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Parse request body
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        }),
        {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Validate file type (support codec variations like audio/webm;codecs=opus)
    const validMimeTypePrefixes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    const isValidAudioType = validMimeTypePrefixes.some(prefix => audioFile.type.startsWith(prefix));

    if (!isValidAudioType) {
      return new Response(
        JSON.stringify({ error: `Invalid file type: ${audioFile.type}. Please upload an audio file.` }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Step 1: Transcribe with Whisper
    const transcriptionFormData = new FormData();
    transcriptionFormData.append('file', audioFile);
    transcriptionFormData.append('model', 'whisper-1');
    transcriptionFormData.append('response_format', 'verbose_json');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: transcriptionFormData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to transcribe audio');
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcriptionText = transcriptionData.text?.trim() || '';

    if (!transcriptionText) {
      return new Response(
        JSON.stringify({
          transcription: { text: '', confidence: 0 },
          intent: 'unknown',
          result: {
            primary: null,
            alternatives: [],
            follow_ups: ["I couldn't hear anything. Try speaking louder or closer to the microphone."],
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Calculate confidence
    const avgLogprob = transcriptionData.segments?.[0]?.avg_logprob ?? -0.5;
    const confidence = Math.min(1, Math.max(0, 1 + avgLogprob));

    // Step 2: Analyze with GPT-4o-mini
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

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this transcription: "${transcriptionText}"` },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!analysisResponse.ok) {
      const error = await analysisResponse.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to analyze content');
    }

    const analysisData = await analysisResponse.json();
    const analysisContent = analysisData.choices?.[0]?.message?.content;

    if (!analysisContent) {
      throw new Error('No response from analysis');
    }

    const parsed = JSON.parse(analysisContent);

    // Return complete result
    return new Response(
      JSON.stringify({
        transcription: {
          text: transcriptionText,
          confidence: Math.round(confidence * 100) / 100,
        },
        intent: parsed.intent || 'unknown',
        result: {
          primary: parsed.result?.primary || null,
          alternatives: parsed.result?.alternatives || [],
          follow_ups: parsed.result?.follow_ups || [],
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
