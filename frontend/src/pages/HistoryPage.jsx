import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import axios from 'axios';
import { 
  Clock, 
  Shield, 
  AlertTriangle,
  Trash2,
  Search
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const HistoryPage = () => {
  const { t } = useLanguage();
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const response = await axios.get(`${API}/analyses`, getAuthHeaders());
        setAnalyses(response.data);
      } catch (error) {
        console.error('Error fetching analyses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        await axios.delete(`${API}/analyses/${id}`, getAuthHeaders());
        setAnalyses(analyses.filter(a => a.id !== id));
      } catch (error) {
        console.error('Error deleting analysis:', error);
      }
    }
  };

  const getTrustLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-emerald-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-orange-400';
      case 'very_low': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  const getTrustLevelBg = (level) => {
    switch (level) {
      case 'high': return 'bg-emerald-950/50 border-emerald-800/50';
      case 'medium': return 'bg-amber-950/50 border-amber-800/50';
      case 'low': return 'bg-orange-950/50 border-orange-800/50';
      case 'very_low': return 'bg-red-950/50 border-red-800/50';
      default: return 'bg-zinc-900/50 border-zinc-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    if (score >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-20 flex items-center justify-center">
        <div className="text-zinc-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-12" data-testid="history-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Analysis History
            </h1>
            <p className="text-zinc-400 mt-1">
              View all your previous profile verifications
            </p>
          </div>
          <Button 
            onClick={() => navigate('/analyze')}
            className="bg-purple-600 hover:bg-purple-500 text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>

        {/* Analyses List */}
        {analyses.length > 0 ? (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <Card 
                key={analysis.id}
                className={`${getTrustLevelBg(analysis.trust_level)} cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => navigate(`/results/${analysis.id}`)}
                data-testid={`history-item-${analysis.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getScoreColor(analysis.overall_score)} bg-current/10`}>
                        <span className="font-bold text-lg">{analysis.overall_score}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{analysis.profile_name}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className={`text-sm font-medium ${getTrustLevelColor(analysis.trust_level)}`}>
                            {t(`results.trustLevel.${analysis.trust_level}`)}
                          </span>
                          {analysis.red_flags?.length > 0 && (
                            <span className="flex items-center gap-1 text-sm text-red-400">
                              <AlertTriangle className="w-4 h-4" />
                              {analysis.red_flags.length} red flags
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500 text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
                        onClick={(e) => handleDelete(analysis.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="py-16 text-center">
              <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">No analyses yet. Start by verifying a profile!</p>
              <Button
                className="bg-purple-600 hover:bg-purple-500 text-white"
                onClick={() => navigate('/analyze')}
              >
                <Search className="w-4 h-4 mr-2" />
                Analyze First Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
