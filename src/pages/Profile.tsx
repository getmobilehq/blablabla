import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-display font-bold text-2xl mb-8">Profile</h1>

      <div className="card space-y-6">
        {/* User info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald/20 flex items-center justify-center">
            <User size={32} className="text-emerald" />
          </div>
          <div>
            <p className="font-display font-semibold text-lg">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-sm text-text-secondary flex items-center gap-2">
              <Mail size={14} />
              {user?.email}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Sign out */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose/10 border border-rose/20 rounded-lg text-rose text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <button
          onClick={handleSignOut}
          disabled={loading}
          className="btn btn-danger w-full"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut size={18} />
              Sign out
            </>
          )}
        </button>
      </div>

      {/* App info */}
      <div className="mt-8 text-center">
        <Logo size="sm" className="justify-center mb-2 opacity-50" />
        <p className="text-xs text-text-muted">
          Version 2.0 • Built with ♥
        </p>
      </div>
    </div>
  );
}
