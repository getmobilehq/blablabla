import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Trash2, Music, BookOpen, Quote, Brain, Mic, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase, TABLES } from '../lib/supabase';
import type { Recording } from '../types';

const iconMap = {
  song: Music,
  scripture: BookOpen,
  quote: Quote,
  voice_note: Brain,
  unknown: Brain,
};

export function HistoryPage() {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchRecordings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(TABLES.RECORDINGS)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRecordings(data || []);
      } catch (err) {
        console.error('Failed to fetch recordings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from(TABLES.RECORDINGS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRecordings((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRecordings = recordings.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.transcription?.toLowerCase().includes(query) ||
      r.result?.primary?.title?.toLowerCase().includes(query) ||
      r.result?.primary?.content?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 size={32} className="text-emerald animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl">History</h1>
          <p className="text-text-secondary">
            {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search */}
        {recordings.length > 0 && (
          <div className="relative w-full md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recordings..."
              className="input pl-10 py-2"
            />
          </div>
        )}
      </div>

      {/* Empty state */}
      {recordings.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="text-text-muted" />
          </div>
          <h2 className="font-display font-semibold text-xl mb-2">
            No recordings yet
          </h2>
          <p className="text-text-secondary mb-6">
            Start by recording something and saving it to your history.
          </p>
          <Link to="/" className="btn btn-primary inline-flex">
            <Mic size={18} />
            Start recording
          </Link>
        </div>
      )}

      {/* No search results */}
      {recordings.length > 0 && filteredRecordings.length === 0 && (
        <div className="card text-center py-12">
          <Search size={32} className="text-text-muted mx-auto mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">
            No matches found
          </h3>
          <p className="text-text-secondary">
            Try a different search term
          </p>
        </div>
      )}

      {/* Recordings list */}
      {filteredRecordings.length > 0 && (
        <div className="space-y-4">
          {filteredRecordings.map((recording) => {
            const Icon = iconMap[recording.intent] || Brain;
            const primary = recording.result?.primary;

            return (
              <div
                key={recording.id}
                className="card-interactive group"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="result-icon flex-shrink-0">
                    <Icon size={24} className="text-emerald" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {primary?.title ? (
                          <h3 className="font-display font-semibold text-lg truncate">
                            {primary.title}
                          </h3>
                        ) : (
                          <h3 className="font-display font-semibold text-lg text-text-secondary italic">
                            Unknown
                          </h3>
                        )}
                        {primary?.attribution && (
                          <p className="text-sm text-text-secondary truncate">
                            {primary.attribution}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {formatDate(recording.created_at)}
                      </span>
                    </div>

                    {/* Transcription preview */}
                    {recording.transcription && (
                      <p className="text-sm text-text-muted mt-2 line-clamp-2">
                        "{recording.transcription}"
                      </p>
                    )}

                    {/* Confidence badge */}
                    {primary?.confidence && (
                      <div className="mt-3">
                        <span className={`badge ${
                          primary.confidence >= 0.8 ? 'badge-high' :
                          primary.confidence >= 0.5 ? 'badge-medium' : 'badge-low'
                        }`}>
                          {Math.round(primary.confidence * 100)}% match
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(recording.id)}
                    disabled={deletingId === recording.id}
                    className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-rose transition-all"
                    title="Delete recording"
                  >
                    {deletingId === recording.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
