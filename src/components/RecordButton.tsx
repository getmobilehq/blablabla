import { Mic, Square } from 'lucide-react';
import type { RecorderState } from '../hooks/useRecorder';

interface RecordButtonProps {
  state: RecorderState;
  duration: number;
  maxDuration: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecordButton({
  state,
  duration,
  maxDuration,
  onStart,
  onStop,
  disabled = false,
}: RecordButtonProps) {
  const isRecording = state === 'recording';
  const progress = (duration / maxDuration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    if (disabled) return;
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Progress ring (only visible when recording) */}
      <div className="relative">
        {/* Background ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          width="112"
          height="112"
          viewBox="0 0 112 112"
        >
          <circle
            cx="56"
            cy="56"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-surface-elevated"
          />
          {isRecording && (
            <circle
              cx="56"
              cy="56"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
              className="text-rose transition-all duration-100"
            />
          )}
        </svg>

        {/* Button */}
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`
            relative w-24 h-24 rounded-full flex items-center justify-center
            transition-all duration-300 m-2
            ${isRecording
              ? 'bg-gradient-to-br from-rose to-red-600 border-4 border-rose shadow-glow-rose animate-pulse-recording'
              : 'bg-gradient-to-br from-emerald-light to-emerald border-4 border-emerald-light shadow-glow hover:scale-105 hover:shadow-glow-strong'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? (
            <Square size={32} fill="white" className="text-white" />
          ) : (
            <Mic size={32} className="text-white" />
          )}
        </button>
      </div>

      {/* Label */}
      <div className="text-center">
        {isRecording ? (
          <>
            <p className="text-rose font-display font-semibold">
              {formatTime(duration)}
            </p>
            <p className="text-text-muted text-sm">
              Tap to stop
            </p>
          </>
        ) : state === 'stopped' ? (
          <p className="text-text-secondary text-sm">
            Tap to record again
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            Tap to start listening
          </p>
        )}
      </div>
    </div>
  );
}
