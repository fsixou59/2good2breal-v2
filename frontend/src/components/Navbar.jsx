import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Menu, X, Globe, User, LogOut, LayoutDashboard, Search, Filter, CreditCard } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" data-testid="logo-link">
            <img 
              src="/logo.png" 
              alt="2good2breal Logo" 
              className="h-[103px] w-auto group-hover:scale-105 transition-transform"
            />
            <span className="text-2xl font-bold text-white tracking-tight" style={{ fontVariantNumeric: 'lining-nums' }}>
              <span className="text-2xl">2</span>good<span className="text-2xl">2</span>breal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50" data-testid="nav-dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t('nav.dashboard')}
                  </Button>
                </Link>
                <Link to="/analyze">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50" data-testid="nav-analyze">
                    <Search className="w-4 h-4 mr-2" />
                    {t('nav.analyze')}
                  </Button>
                </Link>
                <Link to="/filters">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50" data-testid="nav-filters">
                    <Filter className="w-4 h-4 mr-2" />
                    {t('nav.filters')}
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50" data-testid="nav-pricing">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pricing
                  </Button>
                </Link>
              </>
            ) : null}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              data-testid="language-toggle"
            >
              <Globe className="w-4 h-4 mr-1" />
              {language.toUpperCase()}
            </Button>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50" data-testid="user-menu-trigger">
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem onClick={handleLogout} className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white" data-testid="nav-login">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-purple-600 hover:bg-purple-500 text-white" data-testid="nav-register">
                    {t('nav.register')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-zinc-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-t border-zinc-800/50">
          <div className="px-4 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t('nav.dashboard')}
                  </Button>
                </Link>
                <Link to="/analyze" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                    <Search className="w-4 h-4 mr-2" />
                    {t('nav.analyze')}
                  </Button>
                </Link>
                <Link to="/filters" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                    <Filter className="w-4 h-4 mr-2" />
                    {t('nav.filters')}
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white">
                    {t('nav.register')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
