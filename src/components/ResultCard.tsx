import { Music, BookOpen, Quote, Brain, Sparkles, ExternalLink, Check } from 'lucide-react';
import type { ResultItem, RecordingIntent } from '../types';

interface ResultCardProps {
  result: ResultItem;
  intent?: RecordingIntent;
  className?: string;
}

const iconMap = {
  song: Music,
  scripture: BookOpen,
  quote: Quote,
  insight: Brain,
  original: Sparkles,
};

const labelMap = {
  song: 'Song Match',
  scripture: 'Scripture',
  quote: 'Quote',
  insight: 'Analysis',
  original: 'Original',
};

export function ResultCard({ result, className = '' }: ResultCardProps) {
  const Icon = iconMap[result.type] || Brain;
  const label = labelMap[result.type] || 'Result';
  
  const confidenceLevel = 
    result.confidence >= 0.8 ? 'high' :
    result.confidence >= 0.5 ? 'medium' : 'low';

  const confidenceBadgeClass = {
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  }[confidenceLevel];

  return (
    <div className={`card-interactive animate-fade-in-up ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="result-icon">
            <Icon size={24} className="text-emerald" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
              {label}
            </p>
            {result.title && (
              <h3 className="font-display font-semibold text-lg">
                {result.title}
              </h3>
            )}
          </div>
        </div>

        <span className={`badge ${confidenceBadgeClass}`}>
          <Check size={12} />
          {Math.round(result.confidence * 100)}%
        </span>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {result.attribution && (
          <p className="text-text-secondary text-sm">
            {result.attribution}
          </p>
        )}

        <p className="text-text-primary font-body leading-relaxed">
          {result.content}
        </p>
      </div>

      {/* Footer with link */}
      {result.source_url && (
        <div className="mt-4 pt-4 border-t border-border">
          <a
            href={result.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-emerald hover:text-emerald-light transition-colors"
          >
            <ExternalLink size={14} />
            View source
          </a>
        </div>
      )}
    </div>
  );
}

interface EmptyResultProps {
  followUps?: string[];
}

export function EmptyResult({ followUps = [] }: EmptyResultProps) {
  return (
    <div className="card text-center py-8 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-4">
        <Brain size={32} className="text-text-muted" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">
        I'm not sure about this one
      </h3>
      <p className="text-text-secondary text-sm max-w-md mx-auto">
        I couldn't confidently identify what you said. Try speaking more clearly or providing more context.
      </p>

      {followUps.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs text-text-muted uppercase tracking-wider">
            Suggestions
          </p>
          {followUps.map((suggestion, i) => (
            <p key={i} className="text-text-secondary text-sm">
              • {suggestion}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
