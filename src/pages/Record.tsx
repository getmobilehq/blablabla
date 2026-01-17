import { useState, useCallback } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { RecordButton, ResultCard, EmptyResult, ProcessingStatus } from '../components';
import { useRecorder } from '../hooks/useRecorder';
import { useAuth } from '../hooks/useAuth';
import { analyzeRecording } from '../lib/api';
import { supabase, TABLES, BUCKETS } from '../lib/supabase';
import type { RecordingResult, RecordingIntent, ProcessingStatus as ProcessingStatusType } from '../types';

const MAX_DURATION = 120; // 2 minutes

type PageState = 'idle' | 'recording' | 'processing' | 'results' | 'error';

interface AnalysisResult {
  transcription: { text: string; confidence: number };
  intent: RecordingIntent;
  result: RecordingResult;
}

export function RecordPage() {
  const { user } = useAuth();
  const [pageState, setPageState] = useState<PageState>('idle');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType>({
    stage: 'uploading',
    message: 'Getting ready...',
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const {
    state: recorderState,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    error: recorderError,
  } = useRecorder({
    maxDuration: MAX_DURATION,
    onMaxDurationReached: () => {
      // Auto-process when max duration reached
      handleProcess();
    },
  });

  const handleStart = useCallback(async () => {
    setError(null);
    setAnalysisResult(null);
    setIsSaved(false);
    setPageState('recording');
    await startRecording();
  }, [startRecording]);

  const handleStop = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  const handleProcess = useCallback(async () => {
    if (!audioBlob) {
      setError('No recording to process');
      return;
    }

    setPageState('processing');
    setError(null);

    try {
      const result = await analyzeRecording(audioBlob, (status) => {
        setProcessingStatus({
          stage: status.stage as ProcessingStatusType['stage'],
          message: status.message,
        });
      });

      setAnalysisResult(result);
      setPageState('results');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze recording');
      setPageState('error');
    }
  }, [audioBlob]);

  const handleSave = useCallback(async () => {
    if (!user || !audioBlob || !analysisResult) return;

    setIsSaving(true);
    try {
      // Upload audio file
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKETS.RECORDINGS)
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Get signed URL (valid for 1 year)
      const { data: urlData, error: urlError } = await supabase.storage
        .from(BUCKETS.RECORDINGS)
        .createSignedUrl(fileName, 31536000); // 1 year

      if (urlError) throw urlError;

      // Save recording to database
      const { error: dbError } = await supabase.from(TABLES.RECORDINGS).insert({
        user_id: user.id,
        audio_url: urlData.signedUrl,
        duration_seconds: duration,
        transcription: analysisResult.transcription.text,
        transcription_confidence: analysisResult.transcription.confidence,
        intent: analysisResult.intent,
        result: analysisResult.result,
      });

      if (dbError) throw dbError;

      setIsSaved(true);
    } catch (err) {
      console.error('Failed to save:', err);
      setError(err instanceof Error ? err.message : 'Failed to save recording');
    } finally {
      setIsSaving(false);
    }
  }, [user, audioBlob, analysisResult, duration]);

  const handleReset = useCallback(() => {
    resetRecording();
    setAnalysisResult(null);
    setError(null);
    setIsSaved(false);
    setPageState('idle');
  }, [resetRecording]);

  // When recording stops, auto-process
  const wasRecording = recorderState === 'stopped' && pageState === 'recording';
  if (wasRecording && audioBlob) {
    handleProcess();
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center px-4 py-8">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl transition-colors duration-500 ${
            recorderState === 'recording' ? 'bg-rose/10' : 'bg-emerald/5'
          }`} 
        />
      </div>

      {/* Content */}
      <div className="w-full max-w-2xl relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">
            {pageState === 'idle' && 'What do you want to know?'}
            {pageState === 'recording' && 'Listening...'}
            {pageState === 'processing' && 'Analyzing...'}
            {pageState === 'results' && 'Here\'s what I found'}
            {pageState === 'error' && 'Something went wrong'}
          </h1>
          <p className="text-text-secondary">
            {pageState === 'idle' && 'Sing, hum, or speak — I\'ll figure out what it is'}
            {pageState === 'recording' && 'Speak clearly into your microphone'}
            {pageState === 'processing' && 'Give me a moment to think...'}
            {pageState === 'results' && analysisResult?.transcription.text && (
              <span className="italic">"{analysisResult.transcription.text}"</span>
            )}
            {pageState === 'error' && error}
          </p>
        </div>

        {/* Main content area */}
        {(pageState === 'idle' || pageState === 'recording') && (
          <div className="flex justify-center">
            <RecordButton
              state={recorderState}
              duration={duration}
              maxDuration={MAX_DURATION}
              onStart={handleStart}
              onStop={handleStop}
            />
          </div>
        )}

        {pageState === 'processing' && (
          <ProcessingStatus
            stage={processingStatus.stage}
            message={processingStatus.message}
          />
        )}

        {pageState === 'results' && analysisResult && (
          <div className="space-y-6">
            {analysisResult.result.primary ? (
              <ResultCard
                result={analysisResult.result.primary}
                intent={analysisResult.intent}
              />
            ) : (
              <EmptyResult followUps={analysisResult.result.follow_ups} />
            )}

            {/* Alternatives */}
            {analysisResult.result.alternatives.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm text-text-muted uppercase tracking-wider font-medium">
                  Other possibilities
                </h3>
                {analysisResult.result.alternatives.map((alt, i) => (
                  <ResultCard key={i} result={alt} />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <button onClick={handleReset} className="btn btn-secondary">
                <RotateCcw size={18} />
                Record again
              </button>

              {!isSaved && analysisResult.result.primary && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save to history'}
                </button>
              )}

              {isSaved && (
                <span className="text-emerald text-sm flex items-center gap-2">
                  <Save size={16} />
                  Saved to history
                </span>
              )}
            </div>
          </div>
        )}

        {pageState === 'error' && (
          <div className="text-center">
            <button onClick={handleReset} className="btn btn-primary">
              <RotateCcw size={18} />
              Try again
            </button>
          </div>
        )}

        {/* Recorder error */}
        {recorderError && (
          <div className="mt-6 p-4 bg-rose/10 border border-rose/20 rounded-lg text-rose text-sm text-center">
            {recorderError}
          </div>
        )}
      </div>
    </div>
  );
}
