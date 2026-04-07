import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Shield, FileText, Clock, CheckCircle, Eye, LogOut, ChevronDown, ChevronUp, AlertTriangle, RefreshCw, User, Send, Printer, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function StatusBadge(props) {
  const status = props.status || 'pending';
  let className = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (status === 'in_review') className = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (status === 'completed') className = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  return React.createElement(Badge, { className }, status.replace('_', ' ').toUpperCase());
}

function TrustBadge(props) {
  const level = props.level || 'pending';
  const score = props.score;
  let className = 'bg-amber-500/20 text-amber-400';
  if (level === 'high') className = 'bg-emerald-500/20 text-emerald-400';
  if (level === 'low') className = 'bg-orange-500/20 text-orange-400';
  if (level === 'very_low') className = 'bg-red-500/20 text-red-400';
  const label = 'Score: ' + (score || 'N/A') + ' - ' + level.replace('_', ' ').toUpperCase();
  return React.createElement(Badge, { className }, label);
}

function FormDataDisplay(props) {
  const formData = props.formData;
  const photos = props.photos;
  if (!formData) return null;
  
  const entries = Object.entries(formData).filter(function(entry) { 
    // Filter out photos array from form data display
    return entry[1] && entry[0] !== 'photos'; 
  });
  
  // Fields that need larger display
  const largeFields = ['observations_concerns', 'message_substance', 'profile_bio', 'additional_notes'];
  
  return (
    <div className="bg-zinc-800/30 rounded-lg p-4 space-y-3">
      {entries.map(function(entry) {
        const key = entry[0];
        const value = entry[1];
        const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
        const isLargeField = largeFields.includes(key);
        
        if (isLargeField && displayValue.length > 50) {
          return (
            <div key={key} className="border-b border-zinc-700 pb-3">
              <span className="text-zinc-400 capitalize text-sm font-medium block mb-2">{key.replace(/_/g, ' ')}:</span>
              <div className="text-white text-sm bg-zinc-900/50 rounded-lg p-3 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {displayValue}
              </div>
            </div>
          );
        }
        
        return (
          <div key={key} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
            <span className="text-zinc-400 capitalize">{key.replace(/_/g, ' ')}:</span>
            <span className="text-white sm:text-right break-words sm:max-w-md">{displayValue}</span>
          </div>
        );
      })}
      
      {/* Display uploaded photos */}
      {photos && photos.length > 0 && (
        <div className="border-t border-zinc-700 pt-4 mt-4">
          <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
            📷 Uploaded Photos ({photos.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo, index) => {
              // Handle different photo data formats
              const photoSrc = photo.base64 || photo.data || photo.url || photo;
              const photoName = photo.name || photo.filename || `Photo ${index + 1}`;
              
              // Check if it's a valid image source
              const isValidSrc = typeof photoSrc === 'string' && (
                photoSrc.startsWith('data:image') || 
                photoSrc.startsWith('http') ||
                photoSrc.startsWith('/')
              );
              
              if (!isValidSrc) {
                return (
                  <div key={index} className="w-full h-32 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center">
                    <span className="text-zinc-500 text-xs text-center p-2">Photo {index + 1}<br/>(format non supporté)</span>
                  </div>
                );
              }
              
              return (
                <div key={index} className="relative group">
                  <img 
                    src={photoSrc} 
                    alt={photoName}
                    className="w-full h-32 object-cover rounded-lg border border-zinc-700 cursor-pointer hover:border-purple-500 transition-colors"
                    onClick={() => window.open(photoSrc, '_blank')}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-32 bg-zinc-800 rounded-lg border border-zinc-700 items-center justify-center">
                    <span className="text-zinc-500 text-xs">Image error</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg truncate">
                    {photoName}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-zinc-500 text-xs mt-2">Click on a photo to view full size</p>
        </div>
      )}
    </div>
  );
}

function AIDisplay(props) {
  const ai = props.ai;
  
  // Check if ai_analysis is null, undefined, or has an error
  if (!ai || ai.error || (typeof ai === 'object' && Object.keys(ai).length === 0)) {
    return (
      <div className="bg-zinc-800/30 rounded-lg p-4 text-center">
        <div className="text-amber-500 mb-2">
          <AlertTriangle className="w-8 h-8 mx-auto" />
        </div>
        <p className="text-zinc-400 text-sm">
          {ai && ai.error ? 'AI analysis failed: ' + ai.error : 'AI analysis not available for this submission'}
        </p>
        <p className="text-zinc-500 text-xs mt-2">
          This may be an older submission before AI was enabled
        </p>
      </div>
    );
  }
  
  const score = ai.overall_score || 0;
  let scoreColor = 'text-red-400';
  let scoreBg = 'bg-red-500/10';
  if (score >= 70) {
    scoreColor = 'text-emerald-400';
    scoreBg = 'bg-emerald-500/10';
  } else if (score >= 40) {
    scoreColor = 'text-amber-400';
    scoreBg = 'bg-amber-500/10';
  }
  
  const trustLevel = ai.trust_level || 'unknown';
  const redFlags = ai.red_flags || [];
  const recommendations = ai.recommendations || [];
  const summary = ai.analysis_summary || '';
  
  return (
    <div className="bg-zinc-800/30 rounded-lg p-4 space-y-4">
      {/* Score Header */}
      <div className={'rounded-lg p-4 ' + scoreBg}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-zinc-400 text-sm">Trust Score</span>
            <p className={'text-3xl font-bold ' + scoreColor}>{score}/100</p>
          </div>
          <div className="text-right">
            <span className="text-zinc-400 text-sm">Trust Level</span>
            <p className={'text-lg font-semibold capitalize ' + scoreColor}>
              {trustLevel.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
      
      {/* Summary */}
      {summary ? (
        <div>
          <p className="text-purple-400 text-sm font-semibold mb-2">AI Summary:</p>
          <p className="text-white text-sm bg-zinc-900/50 p-3 rounded border border-zinc-700">
            {summary}
          </p>
        </div>
      ) : null}
      
      {/* Red Flags */}
      {redFlags.length > 0 ? (
        <div>
          <p className="text-red-400 text-sm font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Red Flags Detected ({redFlags.length})
          </p>
          <div className="space-y-2">
            {redFlags.map(function(flag, idx) {
              const severityColor = flag.severity === 'high' ? 'border-red-500 bg-red-950/50' : 
                                   flag.severity === 'medium' ? 'border-amber-500 bg-amber-950/30' : 
                                   'border-yellow-500 bg-yellow-950/20';
              return (
                <div key={idx} className={'rounded p-3 border ' + severityColor}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-medium text-sm">{flag.category}</span>
                    <Badge className={
                      flag.severity === 'high' ? 'bg-red-500 text-white' :
                      flag.severity === 'medium' ? 'bg-amber-500 text-black' :
                      'bg-yellow-500 text-black'
                    }>
                      {flag.severity ? flag.severity.toUpperCase() : 'LOW'}
                    </Badge>
                  </div>
                  <p className="text-zinc-300 text-sm">{flag.description}</p>
                  {flag.recommendation ? (
                    <p className="text-zinc-400 text-xs mt-2 italic">
                      Recommendation: {flag.recommendation}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/30 border border-emerald-800/30 rounded p-3">
          <p className="text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            No major red flags detected
          </p>
        </div>
      )}
      
      {/* Recommendations */}
      {recommendations.length > 0 ? (
        <div>
          <p className="text-teal-400 text-sm font-semibold mb-2">AI Recommendations:</p>
          <ul className="space-y-1">
            {recommendations.map(function(rec, idx) {
              return (
                <li key={idx} className="text-zinc-300 text-sm flex items-start gap-2">
                  <span className="text-teal-400 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function AnalysisRow(props) {
  const navigate = useNavigate();
  const analysis = props.analysis;
  const expanded = props.expanded;
  const onToggle = props.onToggle;
  const onRefresh = props.onRefresh;
  
  const [deleting, setDeleting] = useState(false);
  
  const dateStr = analysis.created_at ? new Date(analysis.created_at).toLocaleString('fr-FR') : 'N/A';
  
  function handleCreateReport(e) {
    e.stopPropagation();
    navigate('/admin/report/' + analysis.id);
  }
  
  function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this submission?\n\nProfile: ' + analysis.profile_name + '\nClient: ' + analysis.user_email + '\n\nThis action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    const token = localStorage.getItem('admin_token');
    
    axios.delete(API + '/admin/analyses/' + analysis.id, {
      headers: { Authorization: 'Bearer ' + token }
    })
    .then(function() {
      toast.success('Submission deleted successfully');
      if (onRefresh) onRefresh();
    })
    .catch(function(err) {
      console.error(err);
      toast.error('Failed to delete submission');
    })
    .finally(function() {
      setDeleting(false);
    });
  }
  
  function handlePrint(e) {
    e.stopPropagation();
    const formData = analysis.form_data || {};
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Profile Submission - ${analysis.profile_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; background: white; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #a855f7; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #a855f7; }
          .title { font-size: 22px; margin-top: 10px; color: #333; }
          .ref { font-size: 14px; color: #666; margin-top: 5px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; color: #a855f7; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 15px; }
          .row { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { width: 200px; font-weight: 600; color: #555; }
          .value { flex: 1; color: #333; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #a855f7; text-align: center; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">2Good2bReal</div>
          <div class="title">Profile Submission</div>
          <div class="ref">Reference: ${analysis.id?.substring(0, 8).toUpperCase() || 'N/A'}</div>
          <div class="ref">Date: ${dateStr}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Client Information</div>
          <div class="row"><span class="label">Client Name:</span><span class="value">${analysis.user_name || 'N/A'}</span></div>
          <div class="row"><span class="label">Client Email:</span><span class="value">${analysis.user_email || 'N/A'}</span></div>
          <div class="row"><span class="label">Client Email (for report):</span><span class="value">${formData.client_email || 'N/A'}</span></div>
          <div class="row"><span class="label">Client Age:</span><span class="value">${formData.client_age || 'N/A'}</span></div>
          <div class="row"><span class="label">Client Location:</span><span class="value">${formData.client_location || 'N/A'}</span></div>
        </div>
        
        <div class="section">
          <div class="section-title">Profile Information</div>
          <div class="row"><span class="label">Profile Name:</span><span class="value">${formData.profile_name || analysis.profile_name || 'N/A'}</span></div>
          <div class="row"><span class="label">Full Real Name:</span><span class="value">${formData.full_real_name || 'N/A'}</span></div>
          <div class="row"><span class="label">Gender:</span><span class="value">${formData.gender || 'N/A'}</span></div>
          <div class="row"><span class="label">Height:</span><span class="value">${formData.height || 'N/A'}</span></div>
          <div class="row"><span class="label">Date of Birth:</span><span class="value">${formData.date_of_birth || 'N/A'}</span></div>
          <div class="row"><span class="label">Assumed Age:</span><span class="value">${formData.assumed_age || 'N/A'}</span></div>
          <div class="row"><span class="label">Nationality:</span><span class="value">${formData.nationality || 'N/A'}</span></div>
          <div class="row"><span class="label">Profile Location:</span><span class="value">${formData.profile_location || 'N/A'}</span></div>
        </div>
        
        <div class="section">
          <div class="section-title">Professional Information</div>
          <div class="row"><span class="label">Occupation:</span><span class="value">${formData.occupation || 'N/A'}</span></div>
          <div class="row"><span class="label">Company Name:</span><span class="value">${formData.company_name || 'N/A'}</span></div>
          <div class="row"><span class="label">Company Website:</span><span class="value">${formData.company_website || 'N/A'}</span></div>
        </div>
        
        <div class="section">
          <div class="section-title">Dating Platform Details</div>
          <div class="row"><span class="label">Dating Platform:</span><span class="value">${formData.dating_platform || 'N/A'}</span></div>
          <div class="row"><span class="label">Profile Bio:</span><span class="value">${formData.profile_bio || 'N/A'}</span></div>
          <div class="row"><span class="label">Photos Count:</span><span class="value">${formData.profile_photos_count || 'N/A'}</span></div>
          <div class="row"><span class="label">Verified Photos:</span><span class="value">${formData.has_verified_photos ? 'Yes' : 'No'}</span></div>
          <div class="row"><span class="label">Profile Creation Date:</span><span class="value">${formData.profile_creation_date || 'N/A'}</span></div>
          <div class="row"><span class="label">Last Active:</span><span class="value">${formData.last_active || 'N/A'}</span></div>
          <div class="row"><span class="label">Social Media Links:</span><span class="value">${formData.social_media_links || 'N/A'}</span></div>
        </div>
        
        <div class="section">
          <div class="section-title">Communication & Observations</div>
          <div class="row"><span class="label">Language:</span><span class="value">${formData.language_of_communication || 'N/A'}</span></div>
          <div class="row"><span class="label">Communication Frequency:</span><span class="value">${formData.communication_frequency || 'N/A'}</span></div>
          <div class="row"><span class="label">Message Substance:</span><span class="value">${formData.message_substance || 'N/A'}</span></div>
          <div class="row"><span class="label">Observations/Concerns:</span><span class="value">${formData.observations_concerns || 'N/A'}</span></div>
        </div>
        
        <div class="footer">
          <p>2Good2bReal - Professional Profile Verification Service</p>
          <p>www.2good2breal.com | contact@2good2breal.com</p>
        </div>
        
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
  
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 bg-zinc-800/30 cursor-pointer hover:bg-zinc-800/50" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{analysis.profile_name}</h3>
              <p className="text-zinc-400 text-sm">Client: {analysis.user_name} ({analysis.user_email})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={analysis.status} />
            {analysis.ai_analysis ? <TrustBadge level={analysis.ai_analysis.trust_level} score={analysis.ai_analysis.overall_score} /> : null}
            <span className="text-zinc-500 text-xs">{dateStr}</span>
            {expanded ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
          </div>
        </div>
      </div>
      
      {expanded ? (
        <div className="p-6 border-t border-zinc-800">
          {/* Action Buttons */}
          <div className="mb-4 flex justify-between">
            <Button onClick={handleDelete} disabled={deleting} variant="outline" className="border-red-600 text-red-400 hover:bg-red-950/50">
              <Trash2 className="w-4 h-4 mr-2" /> {deleting ? 'Deleting...' : 'Delete'}
            </Button>
            <div className="flex gap-3">
              <Button onClick={handlePrint} variant="outline" className="border-zinc-600 hover:bg-zinc-800">
                <Printer className="w-4 h-4 mr-2" /> Print Submission
              </Button>
              <Button onClick={handleCreateReport} className="bg-purple-600 hover:bg-purple-500">
                <Send className="w-4 h-4 mr-2" /> Create Report for Client
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-purple-400 font-semibold flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4" /> Form Data
              </h4>
              <FormDataDisplay formData={analysis.form_data} photos={analysis.photos || analysis.form_data?.photos} />
            </div>
            <div>
              <h4 className="text-teal-400 font-semibold flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4" /> AI Analysis
              </h4>
              <AIDisplay ai={analysis.ai_analysis} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(function() {
    var token = localStorage.getItem('admin_token');
    if (!token) { 
      navigate('/login'); 
      return; 
    }
    
    axios.get(API + '/admin/analyses', { headers: { Authorization: 'Bearer ' + token } })
      .then(function(res) {
        setAnalyses(res.data);
        setLoading(false);
      })
      .catch(function(err) {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('admin_token');
          navigate('/login');
        }
        toast.error('Failed to load');
        setLoading(false);
      });
  }, [navigate]);

  function handleRefresh() {
    var token = localStorage.getItem('admin_token');
    if (!token) return;
    setRefreshing(true);
    axios.get(API + '/admin/analyses', { headers: { Authorization: 'Bearer ' + token } })
      .then(function(res) {
        setAnalyses(res.data);
        setRefreshing(false);
        toast.success('Refreshed');
      })
      .catch(function() {
        setRefreshing(false);
      });
  }

  function handleLogout() {
    localStorage.removeItem('admin_token');
    navigate('/login');
    toast.success('Logged out');
  }

  function toggleExpand(id) {
    setExpandedId(expandedId === id ? null : id);
  }

  const pending = analyses.filter(function(a) { return a.status === 'pending'; }).length;
  const inReview = analyses.filter(function(a) { return a.status === 'in_review'; }).length;
  const completed = analyses.filter(function(a) { return a.status === 'completed'; }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-purple-400 flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" /> Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-12" data-testid="admin-page">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-zinc-400">2good2breal - Profile Verification</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="border-zinc-700 text-zinc-300">
              <RefreshCw className={'w-4 h-4 mr-2 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-red-800 text-red-400">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{analyses.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-amber-400">{pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm">In Review</p>
                <p className="text-2xl font-bold text-blue-400">{inReview}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-emerald-400">{completed}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" /> Profile Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">No requests yet</div>
            ) : (
              <div className="space-y-4">
                {analyses.map(function(a) {
                  return (
                    <AnalysisRow 
                      key={a.id} 
                      analysis={a} 
                      expanded={expandedId === a.id} 
                      onToggle={function() { toggleExpand(a.id); }}
                      onRefresh={handleRefresh}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminPage;
