import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Shield,
  Plus,
  ArrowRight
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getTrustColor(level) {
  if (level === 'high') return 'text-emerald-400';
  if (level === 'medium') return 'text-amber-400';
  if (level === 'low') return 'text-orange-400';
  if (level === 'very_low') return 'text-red-400';
  return 'text-zinc-400';
}

function getTrustBg(level) {
  if (level === 'high') return 'bg-emerald-950/50 border-emerald-800/50';
  if (level === 'medium') return 'bg-amber-950/50 border-amber-800/50';
  if (level === 'low') return 'bg-orange-950/50 border-orange-800/50';
  if (level === 'very_low') return 'bg-red-950/50 border-red-800/50';
  return 'bg-zinc-900/50 border-zinc-800';
}

function getScoreColor(score) {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  if (score >= 30) return 'text-orange-400';
  return 'text-red-400';
}

function AnalysisCard({ item, t, onNavigate }) {
  const flagLen = item.red_flags ? item.red_flags.length : 0;
  const dateStr = new Date(item.created_at).toLocaleDateString();
  
  return (
    <div 
      className={`p-4 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity ${getTrustBg(item.trust_level)}`}
      onClick={() => onNavigate(`/results/${item.id}`)}
      data-testid={`analysis-item-${item.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white">{item.profile_name}</h4>
        <span className={`text-sm font-medium ${getTrustColor(item.trust_level)}`}>
          {t(`results.trustLevel.${item.trust_level}`)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Shield className={`w-4 h-4 ${getScoreColor(item.overall_score)}`} />
            <span className={`text-sm font-medium ${getScoreColor(item.overall_score)}`}>
              {item.overall_score}/100
            </span>
          </div>
          {flagLen > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{flagLen} flags</span>
            </div>
          )}
        </div>
        <span className="text-xs text-zinc-500">{dateStr}</span>
      </div>
    </div>
  );
}

function DistributionBar({ level, count, total, t }) {
  const pct = Math.round((count / total) * 100);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm ${getTrustColor(level)}`}>
          {t(`results.trustLevel.${level}`)}
        </span>
        <span className="text-sm text-zinc-400">{count}</span>
      </div>
      <Progress value={pct} className="h-2 bg-zinc-800" />
    </div>
  );
}

export function DashboardPage() {
  const { t } = useLanguage();
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const hdrs = getAuthHeaders();
      const res = await axios.get(`${API}/stats`, hdrs);
      setStats(res.data);
    } catch (err) {
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-20 flex items-center justify-center">
        <div className="text-zinc-400">{t('common.loading')}</div>
      </div>
    );
  }

  const analyses = stats ? stats.recent_analyses : [];
  const analysesExist = analyses && analyses.length > 0;
  const totalAnalyses = stats ? stats.total_analyses : 0;
  const avgScore = stats ? stats.average_score : 0;
  const filterCount = stats ? stats.total_filters : 0;
  const dist = stats ? stats.trust_distribution : {};
  
  let totalFlags = 0;
  if (analyses) {
    for (let i = 0; i < analyses.length; i++) {
      const a = analyses[i];
      if (a.red_flags) {
        totalFlags += a.red_flags.length;
      }
    }
  }

  const distKeys = Object.keys(dist);
  const hasDistribution = distKeys.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-12" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="dashboard-title">
            {t('dashboard.title')}
          </h1>
          <p className="text-zinc-400">
            {t('dashboard.welcome')}, {user ? user.name : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="stat-total-analyses">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">{t('dashboard.stats.totalAnalyses')}</p>
                  <p className="text-3xl font-bold text-white">{totalAnalyses}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-950/50 flex items-center justify-center">
                  <Search className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="stat-avg-score">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">{t('dashboard.stats.averageScore')}</p>
                  <p className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-950/50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="stat-red-flags">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">{t('dashboard.stats.redFlagsDetected')}</p>
                  <p className="text-3xl font-bold text-red-400">{totalFlags}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-950/50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="stat-filters">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">{t('dashboard.stats.filtersActive')}</p>
                  <p className="text-3xl font-bold text-teal-400">{filterCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-950/50 flex items-center justify-center">
                  <Filter className="w-6 h-6 text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900/50 border-zinc-800" data-testid="recent-analyses-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">{t('dashboard.recentAnalyses')}</CardTitle>
                {analysesExist && (
                  <Link to="/history">
                    <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                      {t('dashboard.viewAll')}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {analysesExist ? (
                  <div className="space-y-3">
                    {analyses.map((item) => (
                      <AnalysisCard key={item.id} item={item} t={t} onNavigate={navigate} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400 mb-4">{t('dashboard.noAnalyses')}</p>
                    <Link to="/analyze">
                      <Button className="bg-purple-600 hover:bg-purple-500 text-white">
                        <Search className="w-4 h-4 mr-2" />
                        {t('dashboard.quickActions.newAnalysis')}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-zinc-900/50 border-zinc-800" data-testid="quick-actions-card">
              <CardHeader>
                <CardTitle className="text-white">{t('dashboard.quickActions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/analyze" className="block">
                  <Button className="w-full justify-start bg-purple-600 hover:bg-purple-500 text-white" data-testid="quick-action-analyze">
                    <Search className="w-4 h-4 mr-3" />
                    {t('dashboard.quickActions.newAnalysis')}
                  </Button>
                </Link>
                <Link to="/filters" className="block">
                  <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white" data-testid="quick-action-filter">
                    <Plus className="w-4 h-4 mr-3" />
                    {t('dashboard.quickActions.createFilter')}
                  </Button>
                </Link>
                <Link to="/history" className="block">
                  <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white" data-testid="quick-action-history">
                    <Clock className="w-4 h-4 mr-3" />
                    {t('dashboard.quickActions.viewHistory')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {hasDistribution && (
              <Card className="bg-zinc-900/50 border-zinc-800 mt-6" data-testid="trust-distribution-card">
                <CardHeader>
                  <CardTitle className="text-white text-base">Trust Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dist.high > 0 && <DistributionBar level="high" count={dist.high} total={totalAnalyses || 1} t={t} />}
                  {dist.medium > 0 && <DistributionBar level="medium" count={dist.medium} total={totalAnalyses || 1} t={t} />}
                  {dist.low > 0 && <DistributionBar level="low" count={dist.low} total={totalAnalyses || 1} t={t} />}
                  {dist.very_low > 0 && <DistributionBar level="very_low" count={dist.very_low} total={totalAnalyses || 1} t={t} />}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
