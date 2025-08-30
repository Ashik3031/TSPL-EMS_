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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">Sales Leaderboard</h1>
            </div>
            <div className="hidden md:block">
              <div className="flex space-x-1">
                <Link href="/">
                  <Button
                    variant={isActive('/') ? 'default' : 'ghost'}
                    size="sm"
                    className="text-sm font-medium"
                    data-testid="nav-leaderboard"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Leaderboard
                  </Button>
                </Link>
                
                {isAuthenticated && ['admin', 'tl'].includes(user?.role || '') && (
                  <Link href="/tl">
                    <Button
                      variant={isActive('/tl') ? 'default' : 'ghost'}
                      size="sm"
                      className="text-sm font-medium"
                      data-testid="nav-tl-dashboard"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      TL Dashboard
                    </Button>
                  </Link>
                )}
                
                {isAuthenticated && user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button
                      variant={isActive('/admin') ? 'default' : 'ghost'}
                      size="sm"
                      className="text-sm font-medium"
                      data-testid="nav-admin"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              className="text-muted-foreground hover:text-foreground"
              data-testid="sound-toggle"
            >
              {isSoundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
            
            <Link href="/?tv=true">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                title="TV Mode"
                data-testid="tv-mode"
              >
                <Tv className="w-5 h-5" />
              </Button>
            </Link>
            
            <div className="hidden md:block text-sm text-muted-foreground">
              <span className="inline-flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Live
              </span>
            </div>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {user?.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  data-testid="logout-button"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" data-testid="login-button">
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
