import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle,
  XCircle,
  Loader2,
  Settings
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const FiltersPage = () => {
  const { t } = useLanguage();
  const { getAuthHeaders } = useAuth();
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: {
      min_photos: 3,
      require_verified_photos: false,
      require_social_media: false,
      min_profile_age_days: 7,
      max_response_time: ''
    },
    is_active: true
  });

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await axios.get(`${API}/filters`, getAuthHeaders());
      setFilters(response.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      criteria: {
        min_photos: 3,
        require_verified_photos: false,
        require_social_media: false,
        min_profile_age_days: 7,
        max_response_time: ''
      },
      is_active: true
    });
    setEditingFilter(null);
  };

  const handleEdit = (filter) => {
    setEditingFilter(filter);
    setFormData({
      name: filter.name,
      description: filter.description || '',
      criteria: filter.criteria || {
        min_photos: 3,
        require_verified_photos: false,
        require_social_media: false,
        min_profile_age_days: 7,
        max_response_time: ''
      },
      is_active: filter.is_active
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Filter name is required');
      return;
    }

    setSaving(true);
    
    try {
      if (editingFilter) {
        await axios.put(`${API}/filters/${editingFilter.id}`, formData, getAuthHeaders());
        toast.success('Filter updated');
      } else {
        await axios.post(`${API}/filters`, formData, getAuthHeaders());
        toast.success('Filter created');
      }
      setDialogOpen(false);
      resetForm();
      fetchFilters();
    } catch (error) {
      console.error('Error saving filter:', error);
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (filterId) => {
    if (window.confirm('Are you sure you want to delete this filter?')) {
      try {
        await axios.delete(`${API}/filters/${filterId}`, getAuthHeaders());
        toast.success('Filter deleted');
        fetchFilters();
      } catch (error) {
        toast.error(t('common.error'));
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCriteriaChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      criteria: { ...prev.criteria, [field]: value }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-20 flex items-center justify-center">
        <div className="text-zinc-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-12" data-testid="filters-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white" data-testid="filters-title">
              {t('filters.title')}
            </h1>
            <p className="text-zinc-400 mt-1">
              {t('filters.subtitle')}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-500 text-white" data-testid="create-filter-btn">
                <Plus className="w-4 h-4 mr-2" />
                {t('filters.create')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingFilter ? t('filters.edit') : t('filters.create')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-300">
                    {t('filters.form.name')} *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder={t('filters.form.namePlaceholder')}
                    required
                    data-testid="filter-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300">
                    {t('filters.form.description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder={t('filters.form.descriptionPlaceholder')}
                    data-testid="filter-description-input"
                  />
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <Label className="text-zinc-300 mb-4 block">{t('filters.form.criteria')}</Label>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_photos" className="text-zinc-400 text-sm">
                        {t('filters.form.minPhotos')}
                      </Label>
                      <Input
                        id="min_photos"
                        type="number"
                        min="0"
                        value={formData.criteria.min_photos}
                        onChange={(e) => handleCriteriaChange('min_photos', parseInt(e.target.value) || 0)}
                        className="bg-zinc-800/50 border-zinc-700 text-white focus:border-purple-600"
                        data-testid="filter-min-photos"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-700">
                      <Label htmlFor="require_verified" className="text-zinc-300 text-sm cursor-pointer">
                        {t('filters.form.requireVerified')}
                      </Label>
                      <Switch
                        id="require_verified"
                        checked={formData.criteria.require_verified_photos}
                        onCheckedChange={(checked) => handleCriteriaChange('require_verified_photos', checked)}
                        data-testid="filter-require-verified"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-700">
                      <Label htmlFor="require_social" className="text-zinc-300 text-sm cursor-pointer">
                        {t('filters.form.requireSocial')}
                      </Label>
                      <Switch
                        id="require_social"
                        checked={formData.criteria.require_social_media}
                        onCheckedChange={(checked) => handleCriteriaChange('require_social_media', checked)}
                        data-testid="filter-require-social"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_profile_age" className="text-zinc-400 text-sm">
                        {t('filters.form.minProfileAge')}
                      </Label>
                      <Input
                        id="min_profile_age"
                        type="number"
                        min="0"
                        value={formData.criteria.min_profile_age_days}
                        onChange={(e) => handleCriteriaChange('min_profile_age_days', parseInt(e.target.value) || 0)}
                        className="bg-zinc-800/50 border-zinc-700 text-white focus:border-purple-600"
                        data-testid="filter-min-age"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_response" className="text-zinc-400 text-sm">
                        {t('filters.form.maxResponseTime')}
                      </Label>
                      <Input
                        id="max_response"
                        value={formData.criteria.max_response_time}
                        onChange={(e) => handleCriteriaChange('max_response_time', e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                        placeholder="e.g., 24 hours"
                        data-testid="filter-max-response"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-700">
                  <Label htmlFor="is_active" className="text-zinc-300 cursor-pointer">
                    {t('filters.form.isActive')}
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleChange('is_active', checked)}
                    data-testid="filter-is-active"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    {t('filters.form.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white"
                    disabled={saving}
                    data-testid="filter-save-btn"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('filters.form.save')
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters List */}
        {filters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filters.map((filter) => (
              <Card 
                key={filter.id}
                className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors"
                data-testid={`filter-card-${filter.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-950/50 flex items-center justify-center">
                        <Filter className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{filter.name}</h3>
                        {filter.description && (
                          <p className="text-zinc-500 text-sm">{filter.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge 
                      className={filter.is_active 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                      }
                    >
                      {filter.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Criteria Summary */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {filter.criteria?.min_photos > 0 && (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                        Min {filter.criteria.min_photos} photos
                      </Badge>
                    )}
                    {filter.criteria?.require_verified_photos && (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                        Verified photos
                      </Badge>
                    )}
                    {filter.criteria?.require_social_media && (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                        Social links
                      </Badge>
                    )}
                    {filter.criteria?.min_profile_age_days > 0 && (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                        {filter.criteria.min_profile_age_days}+ days old
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      onClick={() => handleEdit(filter)}
                      data-testid={`edit-filter-${filter.id}`}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      {t('filters.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-800/50 text-red-400 hover:bg-red-950/50"
                      onClick={() => handleDelete(filter.id)}
                      data-testid={`delete-filter-${filter.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="py-16 text-center">
              <Settings className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">{t('filters.noFilters')}</p>
              <Button
                className="bg-purple-600 hover:bg-purple-500 text-white"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('filters.create')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
