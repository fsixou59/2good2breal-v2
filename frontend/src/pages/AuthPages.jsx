import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Shield, Loader2, Lock } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const LoginPage = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [adminData, setAdminData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      toast.success(t('common.success'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/admin/login`, {
        username: adminData.username,
        password: adminData.password
      });
      
      localStorage.setItem('admin_token', response.data.access_token);
      toast.success('Admin login successful');
      navigate('/admin');
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-transparent" />
      
      <div className="flex flex-col items-center gap-6 relative">
        <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800 backdrop-blur-xl" data-testid="login-card">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">{t('auth.login.title')}</CardTitle>
            <CardDescription className="text-zinc-400">
              {t('auth.login.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">{t('auth.login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600 focus:ring-purple-600/20"
                  placeholder="you@example.com"
                  required
                  data-testid="login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">{t('auth.login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600 focus:ring-purple-600/20"
                  placeholder="••••••••"
                  required
                  data-testid="login-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-500 text-white"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.login.submit')
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-zinc-400 text-sm">
                {t('auth.login.noAccount')}{' '}
                <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium" data-testid="login-register-link">
                  {t('auth.login.register')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Login Box */}
        <Card 
          className={`w-full max-w-md bg-zinc-900/60 border-zinc-800 backdrop-blur-xl transition-all duration-300 ${
            showAdminLogin ? 'border-amber-800/50' : ''
          }`} 
          data-testid="admin-login-card"
        >
          <CardHeader 
            className="cursor-pointer py-3"
            onClick={() => setShowAdminLogin(!showAdminLogin)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm text-amber-500">Admin Access</CardTitle>
              </div>
              <span className="text-zinc-500 text-xs">{showAdminLogin ? 'Click to close' : 'Click to open'}</span>
            </div>
          </CardHeader>
          
          {showAdminLogin && (
            <CardContent className="pt-0">
              <form onSubmit={handleAdminLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="admin-username" className="text-zinc-400 text-xs">Username</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    value={adminData.username}
                    onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-600 focus:ring-amber-600/20 h-9 text-sm"
                    placeholder="admin"
                    required
                    data-testid="admin-username"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admin-password" className="text-zinc-400 text-xs">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminData.password}
                    onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-600 focus:ring-amber-600/20 h-9 text-sm"
                    placeholder="••••••••"
                    required
                    data-testid="admin-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white h-9 text-sm"
                  disabled={loading}
                  data-testid="admin-login-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 mr-2" />
                      Admin Login
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const { t } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await register(formData.name, formData.email, formData.password);
      toast.success(t('common.success'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-transparent" />
      
      <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800 backdrop-blur-xl relative" data-testid="register-card">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">{t('auth.register.title')}</CardTitle>
          <CardDescription className="text-zinc-400">
            {t('auth.register.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">{t('auth.register.name')}</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600 focus:ring-purple-600/20"
                placeholder="John Doe"
                required
                data-testid="register-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">{t('auth.register.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600 focus:ring-purple-600/20"
                placeholder="you@example.com"
                required
                data-testid="register-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">{t('auth.register.password')}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600 focus:ring-purple-600/20"
                placeholder="••••••••"
                minLength={6}
                required
                data-testid="register-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-500 text-white"
              disabled={loading}
              data-testid="register-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.register.submit')
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              {t('auth.register.hasAccount')}{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium" data-testid="register-login-link">
                {t('auth.register.login')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
