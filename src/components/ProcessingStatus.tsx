import { Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  stage: 'uploading' | 'transcribing' | 'analyzing' | 'complete';
  message: string;
}

const stageProgress = {
  uploading: 25,
  transcribing: 50,
  analyzing: 75,
  complete: 100,
};

export function ProcessingStatus({ stage, message }: ProcessingStatusProps) {
  const progress = stageProgress[stage];

  return (
    <div className="card text-center py-8 animate-fade-in">
      {/* Animated loader */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-surface-elevated" />
        <div 
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald animate-spin"
          style={{ animationDuration: '1s' }}
        />
        
        {/* Inner icon */}
        <div className="absolute inset-3 rounded-full bg-surface-elevated flex items-center justify-center">
          <Loader2 size={24} className="text-emerald animate-spin" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      {/* Message */}
      <p className="font-display font-semibold text-lg text-text-primary mb-2">
        {message}
      </p>

      {/* Progress bar */}
      <div className="w-48 h-1.5 bg-surface-elevated rounded-full mx-auto overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald to-emerald-light rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stage indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {(['uploading', 'transcribing', 'analyzing'] as const).map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              stageProgress[s] <= progress ? 'bg-emerald' : 'bg-surface-elevated'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
