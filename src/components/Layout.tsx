import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Mic, Clock, User, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border">
        <NavLink to="/">
          <Logo size="md" />
        </NavLink>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Mic size={20} />
            <span>Record</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Clock size={20} />
            <span>History</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">
            {user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className="btn-ghost p-2 rounded-lg"
            title="Sign out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border safe-bottom">
        <div className="flex items-center justify-around px-4 py-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Mic size={24} />
            <span className="text-xs">Record</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Clock size={24} />
            <span className="text-xs">History</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <User size={24} />
            <span className="text-xs">Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
