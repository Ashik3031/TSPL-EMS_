import { Link, useLocation } from 'wouter';
import { Trophy, Users, Settings, Tv, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAudioStore } from '@/store/audioStore';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useAudioStore();

  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-3">
        <div className="flex justify-between items-center h-10">
          <div className="flex items-center space-x-1.5">
            <div className="flex-shrink-0">
              <h1 className="text-sm sm:text-base font-bold text-primary">Sales Leaderboard</h1>
            </div>
            <div className="hidden md:block">
              <div className="flex space-x-0.5">
                <Link href="/">
                  <Button
                    variant={isActive('/') ? 'default' : 'ghost'}
                    size="sm"
                    className="text-[11px] font-medium h-7 px-1.5"
                    data-testid="nav-leaderboard"
                  >
                    <Trophy className="w-3 h-3 mr-1" />
                    Leaderboard
                  </Button>
                </Link>
                
                {isAuthenticated && ['admin', 'tl'].includes(user?.role || '') && (
                  <Link href="/tl">
                    <Button
                      variant={isActive('/tl') ? 'default' : 'ghost'}
                      size="sm"
                      className="text-[11px] font-medium h-7 px-1.5"
                      data-testid="nav-tl-dashboard"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      TL Dashboard
                    </Button>
                  </Link>
                )}
                
                {isAuthenticated && user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button
                      variant={isActive('/admin') ? 'default' : 'ghost'}
                      size="sm"
                      className="text-[11px] font-medium h-7 px-1.5"
                      data-testid="nav-admin"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Admin
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
              data-testid="sound-toggle"
            >
              {isSoundEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </Button>
            
            <Link href="/?tv=true">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
                title="TV Mode"
                data-testid="tv-mode"
              >
                <Tv className="w-3.5 h-3.5" />
              </Button>
            </Link>
            
            <div className="hidden md:block text-[11px] text-muted-foreground">
              <span className="inline-flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                Live
              </span>
            </div>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-muted-foreground hidden lg:inline">
                  {user?.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-[11px] h-7 px-2"
                  data-testid="logout-button"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-[11px] h-7 px-2" data-testid="login-button">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}