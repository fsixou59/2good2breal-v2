import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Search, 
  User, 
  Image, 
  Share2, 
  Activity, 
  FileText,
  Loader2,
  AlertCircle,
  Upload,
  X,
  Camera,
  CreditCard,
  Coins,
  Briefcase,
  MessageSquare,
  Printer
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAX_PHOTOS = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const AnalyzePage = () => {
  const { t, language } = useLanguage();
  const { getAuthHeaders, user, refreshUser, getTotalCredits } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const printRef = useRef(null);
  
  // Only count paid credits (exclude free credits)
  const paidCredits = (user?.basic_credits || 0) + (user?.comprehensive_credits || 0) + (user?.premium_credits || 0);
  const isFr = language === 'fr';
  
  const [formData, setFormData] = useState({
    client_email: '',
    client_age: '',
    client_location: '',
    profile_name: '',
    full_real_name: '',
    gender: '',
    height: '',
    nationality: '',
    language_of_communication: '',
    profile_bio: '',
    date_of_birth: '',
    assumed_age: '',
    occupation: '',
    company_name: '',
    company_website: '',
    profile_location: '',
    dating_platform: '',
    profile_photos_count: '',
    has_verified_photos: false,
    social_media_links: '',
    profile_creation_date: '',
    last_active: '',
    communication_frequency: '',
    message_substance: '',
    observations_concerns: ''
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (photos.length + files.length > MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingPhotos(true);

    try {
      const newPhotos = await Promise.all(
        validFiles.map(async (file) => {
          const base64 = await convertToBase64(file);
          return {
            id: Date.now() + Math.random(),
            name: file.name,
            preview: URL.createObjectURL(file),
            base64: base64,
            size: file.size
          };
        })
      );

      setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
      toast.success(`${newPhotos.length} photo(s) added`);
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to process photos');
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo?.preview) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== photoId);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.profile_name.trim()) {
      toast.error(isFr ? 'Le nom du profil est requis' : 'Profile name is required');
      return;
    }

    if (!acceptedTerms) {
      toast.error(isFr ? 'Veuillez accepter les conditions générales' : 'Please accept the terms and conditions');
      return;
    }

    if (paidCredits <= 0) {
      toast.error(isFr ? 'Aucun crédit disponible. Veuillez acheter un forfait de vérification.' : 'No credits available. Please purchase a verification package.');
      navigate('/pricing');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        client_email: formData.client_email,
        client_age: formData.client_age,
        client_location: formData.client_location,
        profile_name: formData.profile_name,
        full_real_name: formData.full_real_name,
        gender: formData.gender,
        height: formData.height,
        nationality: formData.nationality,
        language_of_communication: formData.language_of_communication,
        profile_bio: formData.profile_bio,
        date_of_birth: formData.date_of_birth,
        assumed_age: formData.assumed_age,
        occupation: formData.occupation,
        company_name: formData.company_name,
        company_website: formData.company_website,
        profile_location: formData.profile_location,
        dating_platform: formData.dating_platform,
        profile_photos_count: formData.profile_photos_count ? parseInt(formData.profile_photos_count) : photos.length,
        has_verified_photos: formData.has_verified_photos,
        social_media_links: formData.social_media_links,
        profile_creation_date: formData.profile_creation_date,
        last_active: formData.last_active,
        communication_frequency: formData.communication_frequency,
        message_substance: formData.message_substance,
        observations_concerns: formData.observations_concerns,
        photos: photos.map(p => ({
          name: p.name,
          base64: p.base64
        }))
      };

      const response = await axios.post(`${API}/analyze`, payload, getAuthHeaders());
      
      await refreshUser();
      
      // Store submission data for confirmation page
      const referenceId = response.data?.id || response.data?.result_id || Date.now().toString();
      setSubmissionData({
        referenceId: referenceId.substring(0, 8).toUpperCase(),
        fullReferenceId: referenceId,
        clientName: user?.name || formData.client_email,
        clientEmail: formData.client_email || user?.email,
        profileName: formData.profile_name,
        submissionDate: new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        formData: { ...formData },
        photosCount: photos.length
      });
      
      setSubmissionComplete(true);
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error('Analysis error:', error);
      if (error.response?.status === 402) {
        toast.error(isFr ? 'Aucun crédit disponible. Veuillez acheter un forfait de vérification.' : 'No credits available. Please purchase a verification package.');
        navigate('/pricing');
      } else {
        toast.error(error.response?.data?.detail || (isFr ? 'Échec de la soumission' : 'Submission failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Submission Confirmation Page
  if (submissionComplete && submissionData) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Print Styles */}
          <style>{`
            @media print {
              body { background: white !important; }
              .no-print { display: none !important; }
              .print-section { 
                background: white !important; 
                color: black !important;
                border: none !important;
                box-shadow: none !important;
              }
              .print-section * { color: black !important; }
              .print-header { border-bottom: 2px solid #a553be !important; }
            }
          `}</style>

          {/* Action Buttons - No Print */}
          <div className="no-print mb-6 flex justify-center gap-4">
            <Button 
              onClick={handlePrint}
              className="bg-purple-600 hover:bg-purple-500"
            >
              <Printer className="w-4 h-4 mr-2" />
              {isFr ? 'Imprimer / Sauvegarder PDF' : 'Print / Save as PDF'}
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              {isFr ? 'Retour à l\'accueil' : 'Back to Home'}
            </Button>
          </div>

          {/* Confirmation Card */}
          <div ref={printRef} className="print-section bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="print-header bg-purple-600/20 border-b border-purple-500/30 p-6 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {isFr ? 'Demande de Vérification Reçue' : 'Verification Request Received'}
              </h1>
              <p className="text-purple-300">
                {isFr ? 'Votre demande a été enregistrée avec succès' : 'Your request has been successfully submitted'}
              </p>
            </div>

            {/* Reference Number - Prominent */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-800/30">
              <div className="text-center">
                <p className="text-zinc-400 text-sm mb-1">
                  {isFr ? 'Numéro de Référence' : 'Reference Number'}
                </p>
                <p className="text-3xl font-bold text-purple-400 font-mono tracking-wider">
                  #{submissionData.referenceId}
                </p>
                <p className="text-zinc-500 text-xs mt-2">
                  {isFr ? 'Conservez ce numéro pour le suivi de votre demande' : 'Keep this number for tracking your request'}
                </p>
              </div>
            </div>

            {/* Submission Details */}
            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  {isFr ? 'Informations Client' : 'Client Information'}
                </h3>
                <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{isFr ? 'Nom' : 'Name'}:</span>
                    <span className="text-white">{submissionData.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Email:</span>
                    <span className="text-white">{submissionData.clientEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{isFr ? 'Date de soumission' : 'Submission Date'}:</span>
                    <span className="text-white">{submissionData.submissionDate}</span>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-400" />
                  {isFr ? 'Profil à Vérifier' : 'Profile to Verify'}
                </h3>
                <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{isFr ? 'Nom du profil' : 'Profile Name'}:</span>
                    <span className="text-white">{submissionData.profileName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{isFr ? 'Plateforme' : 'Platform'}:</span>
                    <span className="text-white">{submissionData.formData.dating_platform || '-'}</span>
                  </div>
                  {submissionData.formData.profile_age && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{isFr ? 'Âge du profil' : 'Profile Age'}:</span>
                      <span className="text-white">{submissionData.formData.profile_age}</span>
                    </div>
                  )}
                  {submissionData.formData.profile_location && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{isFr ? 'Localisation' : 'Location'}:</span>
                      <span className="text-white">{submissionData.formData.profile_location}</span>
                    </div>
                  )}
                  {submissionData.formData.profile_occupation && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{isFr ? 'Profession' : 'Occupation'}:</span>
                      <span className="text-white">{submissionData.formData.profile_occupation}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{isFr ? 'Photos jointes' : 'Attached Photos'}:</span>
                    <span className="text-white">{submissionData.photosCount}</span>
                  </div>
                </div>
              </div>

              {/* Profile Bio */}
              {submissionData.formData.profile_bio && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    {isFr ? 'Bio du Profil' : 'Profile Bio'}
                  </h3>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-zinc-300 whitespace-pre-wrap break-words">
                      {submissionData.formData.profile_bio}
                    </p>
                  </div>
                </div>
              )}

              {/* Message Substance */}
              {submissionData.formData.message_substance && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    {isFr ? 'Substance des Messages' : 'Message Substance'}
                  </h3>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-zinc-300 whitespace-pre-wrap break-words">
                      {submissionData.formData.message_substance}
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {submissionData.formData.observations_concerns && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    {isFr ? 'Observations et Préoccupations' : 'Observations and Concerns'}
                  </h3>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-zinc-300 whitespace-pre-wrap break-words">
                      {submissionData.formData.observations_concerns}
                    </p>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">
                  {isFr ? 'Prochaines Étapes' : 'Next Steps'}
                </h3>
                <ul className="space-y-2 text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">1.</span>
                    <span>{isFr 
                      ? 'Notre équipe va analyser le profil soumis' 
                      : 'Our team will analyze the submitted profile'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">2.</span>
                    <span>{isFr 
                      ? 'Vous recevrez un email de confirmation à l\'adresse indiquée' 
                      : 'You will receive a confirmation email at the provided address'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">3.</span>
                    <span>{isFr 
                      ? 'Le rapport complet vous sera envoyé sous 48 heures' 
                      : 'The complete report will be sent to you within 48 hours'}</span>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className="text-center pt-4 border-t border-zinc-800">
                <p className="text-zinc-400 text-sm mb-2">
                  {isFr ? 'Des questions ? Contactez-nous :' : 'Questions? Contact us:'}
                </p>
                <p className="text-purple-400">
                  <a href="mailto:contact@2good2breal.com" className="hover:underline">contact@2good2breal.com</a>
                </p>
                <p className="text-zinc-400 text-sm mt-1">
                  {isFr ? 'Téléphone Bureau' : 'Office'}: <a href="tel:+33767925545" className="text-purple-400 hover:underline">+33 (0) 7 67 92 55 45</a>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-zinc-800/30 p-4 text-center border-t border-zinc-800">
              <p className="text-zinc-500 text-sm">
                2good2breal - 42, Avenue Montaigne, 75008 Paris, France
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-12" data-testid="analyze-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="analyze-title">
            Analyze Profile
          </h1>
          <p className="text-zinc-400">
            Enter the profile details to verify authenticity
          </p>
        </div>

        {/* 18+ Notice */}
        <div className="mb-6 p-4 rounded-xl bg-amber-950/30 border border-amber-800/50">
          <p className="text-amber-400 text-sm text-center font-medium">
            {isFr 
              ? "⚠️ Ce site est réservé aux clients de plus de 18 ans." 
              : "⚠️ This site is reserved for clients over 18 years old."}
          </p>
        </div>

        {/* Credits Card */}
        <Card className={`mb-6 ${paidCredits > 0 ? 'bg-zinc-900/50 border-zinc-800' : 'bg-red-950/30 border-red-800/50'}`} data-testid="credits-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${paidCredits > 0 ? 'bg-purple-500/20' : 'bg-red-500/20'}`}>
                  <Coins className={`w-5 h-5 ${paidCredits > 0 ? 'text-purple-400' : 'text-red-400'}`} />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">{isFr ? 'Crédits Disponibles' : 'Available Credits'}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${paidCredits > 0 ? 'text-white' : 'text-red-400'}`} data-testid="credits-count">
                      {paidCredits}
                    </span>
                    {paidCredits > 0 && (
                      <span className="text-zinc-500 text-sm">{isFr ? 'analyse(s) restante(s)' : `analysis${paidCredits !== 1 ? 'es' : ''} remaining`}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {paidCredits <= 0 ? (
                <Link to="/pricing">
                  <Button className="bg-purple-600 hover:bg-purple-500 text-white" data-testid="buy-credits-btn">
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isFr ? 'Acheter des Crédits' : 'Buy Credits'}
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  {user?.basic_credits > 0 && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      {user.basic_credits} Basic
                    </Badge>
                  )}
                  {user?.comprehensive_credits > 0 && (
                    <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                      {user.comprehensive_credits} Comprehensive
                    </Badge>
                  )}
                  {user?.premium_credits > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      {user.premium_credits} Premium
                    </Badge>
                  )}
                  <Link to="/pricing">
                    <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800">
                      {isFr ? 'Acheter Plus' : 'Buy More'}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            {paidCredits <= 0 && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/50 border border-red-800/50">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {isFr 
                    ? 'Vous avez besoin de crédits pour analyser les profils. Achetez un forfait de vérification pour continuer.' 
                    : 'You need credits to analyze profiles. Purchase a verification package to continue.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="client-info-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                {isFr ? "Informations Client" : "Client Information"}
              </CardTitle>
              <CardDescription className="text-zinc-400">
                {isFr ? "Vos informations personnelles" : "Your personal information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client_email" className="text-zinc-300">
                  {isFr ? "Votre Email (pour recevoir le rapport)" : "Your Email (to receive the report)"} *
                </Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email || ''}
                  onChange={(e) => handleChange('client_email', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                  placeholder={isFr ? "votre@email.com" : "your@email.com"}
                  data-testid="input-client-email"
                  required
                />
                <p className="text-xs text-zinc-500">
                  {isFr 
                    ? "L'accusé de réception et le rapport final seront envoyés à cette adresse" 
                    : "The acceptance confirmation and final report will be sent to this address"}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_age" className="text-zinc-300">
                    {isFr ? "Votre âge" : "Your Age"}
                  </Label>
                  <Input
                    id="client_age"
                    value={formData.client_age || ''}
                    onChange={(e) => handleChange('client_age', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder={isFr ? "ex: 35" : "e.g., 35"}
                    data-testid="input-client-age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_location" className="text-zinc-300">
                    {isFr ? "Votre localisation" : "Your Location"}
                  </Label>
                  <Input
                    id="client_location"
                    value={formData.client_location || ''}
                    onChange={(e) => handleChange('client_location', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder={isFr ? "Ville, Pays" : "City, Country"}
                    data-testid="input-client-location"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="basic-info-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile_name" className="text-zinc-300">
                    Profile Name *
                  </Label>
                  <Input
                    id="profile_name"
                    value={formData.profile_name}
                    onChange={(e) => handleChange('profile_name', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder="Enter the profile name"
                    required
                    data-testid="input-profile-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_real_name" className="text-zinc-300">
                    Full Real Name if available
                  </Label>
                  <Input
                    id="full_real_name"
                    value={formData.full_real_name}
                    onChange={(e) => handleChange('full_real_name', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder="Enter full real name if known"
                    data-testid="input-full-real-name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-zinc-300">
                    {isFr ? "Genre" : "Gender"}
                  </Label>
                  <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" data-testid="input-gender">
                      <SelectValue placeholder={isFr ? "Sélectionner..." : "Select..."} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="male" className="text-white">{isFr ? "Homme" : "Male"}</SelectItem>
                      <SelectItem value="female" className="text-white">{isFr ? "Femme" : "Female"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-zinc-300">
                    {isFr ? "Taille" : "Height"}
                  </Label>
                  <Input
                    id="height"
                    value={formData.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder={isFr ? "ex: 175 cm ou 5'9\"" : "e.g., 175 cm or 5'9\""}
                    data-testid="input-height"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality" className="text-zinc-300">
                    {isFr ? "Nationalité" : "Nationality"}
                  </Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => handleChange('nationality', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder={isFr ? "ex: Français, Américain..." : "e.g., French, American..."}
                    data-testid="input-nationality"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language_of_communication" className="text-zinc-300">
                    {isFr ? "Langue de communication" : "Language of Communication"}
                  </Label>
                  <Input
                    id="language_of_communication"
                    value={formData.language_of_communication}
                    onChange={(e) => handleChange('language_of_communication', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder={isFr ? "ex: Anglais, Français..." : "e.g., English, French..."}
                    data-testid="input-language"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-zinc-300">
                    {isFr ? "Date de naissance" : "Date of Birth"}
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    data-testid="input-dob"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assumed_age" className="text-zinc-300">
                    {isFr ? "Âge supposé" : "Assumed Age"}
                  </Label>
                  <Input
                    id="assumed_age"
                    value={formData.assumed_age}
                    onChange={(e) => handleChange('assumed_age', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder={isFr ? "ex: 35-40 ans" : "e.g., 35-40 years"}
                    data-testid="input-assumed-age"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_location" className="text-zinc-300">
                  Location
                </Label>
                <Input
                  id="profile_location"
                  value={formData.profile_location}
                  onChange={(e) => handleChange('profile_location', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                  placeholder="City, Country"
                  data-testid="input-location"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation" className="text-zinc-300">
                    Occupation
                  </Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => handleChange('occupation', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder="e.g., Engineer, Doctor, Business owner"
                    data-testid="input-occupation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-zinc-300">
                    Company Name
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    placeholder="Enter company name if known"
                    data-testid="input-company-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_website" className="text-zinc-300">
                  {isFr ? "Site web de l'entreprise (si disponible)" : "Company Website (if available)"}
                </Label>
                <Input
                  id="company_website"
                  value={formData.company_website}
                  onChange={(e) => handleChange('company_website', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                  placeholder="https://www.example.com"
                  data-testid="input-company-website"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dating_platform" className="text-zinc-300">
                  Dating Platform / Method of meeting
                </Label>
                <Input
                  id="dating_platform"
                  value={formData.dating_platform}
                  onChange={(e) => handleChange('dating_platform', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                  placeholder="e.g., Date Website, Speed Dating Venue, Social Event"
                  data-testid="input-platform"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_bio" className="text-zinc-300">
                  Profile Bio and Description
                </Label>
                <Textarea
                  id="profile_bio"
                  value={formData.profile_bio}
                  onChange={(e) => handleChange('profile_bio', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600 min-h-[150px] resize-y"
                  placeholder="Paste the profile bio/description"
                  data-testid="input-bio"
                />
              </div>
            </CardContent>
          </Card>

          {/* Photo Upload Section */}
          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="photo-upload-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-400" />
                Profile Photos for A.I. Analysis
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Upload up to {MAX_PHOTOS} photos for reverse image search and identity verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div 
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  photos.length >= MAX_PHOTOS 
                    ? 'border-zinc-700 bg-zinc-800/20 cursor-not-allowed' 
                    : 'border-zinc-700 hover:border-purple-600 hover:bg-zinc-800/30 cursor-pointer'
                }`}
                onClick={() => photos.length < MAX_PHOTOS && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={photos.length >= MAX_PHOTOS || uploadingPhotos}
                  data-testid="photo-upload-input"
                />
                
                {uploadingPhotos ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-3" />
                    <p className="text-zinc-300">Processing photos...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className={`w-12 h-12 mb-3 ${photos.length >= MAX_PHOTOS ? 'text-zinc-600' : 'text-purple-400'}`} />
                    <p className={`text-lg font-medium ${photos.length >= MAX_PHOTOS ? 'text-zinc-600' : 'text-zinc-300'}`}>
                      {photos.length >= MAX_PHOTOS 
                        ? 'Maximum photos reached' 
                        : 'Click to upload photos'}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      {photos.length}/{MAX_PHOTOS} photos • Max 5MB per image
                    </p>
                  </div>
                )}
              </div>

              {/* Photo Previews */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div 
                      key={photo.id} 
                      className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-700"
                      data-testid={`photo-preview-${index}`}
                    >
                      <img 
                        src={photo.preview} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removePhoto(photo.id)}
                          className="bg-red-600 hover:bg-red-500"
                          data-testid={`remove-photo-${index}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white truncate">{photo.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Analysis Info */}
              <div className="bg-purple-950/30 border border-purple-800/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-purple-300 font-medium text-sm">A.I. Powered Image Analysis</p>
                    <p className="text-purple-400/70 text-sm mt-1">
                      Our advanced A.I. systems scan profiles for inconsistencies, fake, photoshopped, stolen photos, identities and common and complex scam patterns. We cover online dating, speed dating, and all dating methods.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo Information */}
          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="photo-info-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Image className="w-5 h-5 text-teal-400" />
                Photo Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile_photos_count" className="text-zinc-300">
                    Number of Photos on Profile
                  </Label>
                  <Input
                    id="profile_photos_count"
                    type="number"
                    min="0"
                    value={formData.profile_photos_count || photos.length}
                    onChange={(e) => handleChange('profile_photos_count', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    data-testid="input-photo-count"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-700">
                  <Label htmlFor="has_verified_photos" className="text-zinc-300 cursor-pointer">
                    Has Verified Photos
                  </Label>
                  <Switch
                    id="has_verified_photos"
                    checked={formData.has_verified_photos}
                    onCheckedChange={(checked) => handleChange('has_verified_photos', checked)}
                    data-testid="switch-verified-photos"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="social-info-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" />
                Social Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="social_media_links" className="text-zinc-300">
                  Social Media Links
                </Label>
                <Textarea
                  id="social_media_links"
                  value={formData.social_media_links}
                  onChange={(e) => handleChange('social_media_links', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                  placeholder="Paste any social media links (Instagram, Facebook, LinkedIn, etc.), separated by commas"
                  data-testid="input-social-links"
                />
              </div>
            </CardContent>
          </Card>

          {/* Activity Information */}
          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="activity-info-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Activity Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile_creation_date" className="text-zinc-300">
                    Profile Creation Date
                  </Label>
                  <Input
                    id="profile_creation_date"
                    type="date"
                    value={formData.profile_creation_date}
                    onChange={(e) => handleChange('profile_creation_date', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    data-testid="input-creation-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_active" className="text-zinc-300">
                    {isFr ? "Dernière communication/rencontre avec vous" : "Last communication/meeting with you"}
                  </Label>
                  <Input
                    id="last_active"
                    type="date"
                    value={formData.last_active}
                    onChange={(e) => handleChange('last_active', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                    data-testid="input-last-active"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Communication Analysis */}
          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="communication-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-400" />
                Communication Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="communication_frequency" className="text-zinc-300">
                  Frequency of Communication
                </Label>
                <Textarea
                  id="communication_frequency"
                  value={formData.communication_frequency}
                  onChange={(e) => handleChange('communication_frequency', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                  placeholder="e.g., Regular and consistent, Love bombing (excessive early contact), Ghosting, Hot and cold, Slow to respond, Only contacts late at night..."
                  data-testid="input-communication-frequency"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message_substance" className="text-zinc-300">
                  Substance of Messages and Communication
                </Label>
                <Textarea
                  id="message_substance"
                  value={formData.message_substance}
                  onChange={(e) => handleChange('message_substance', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600 min-h-[100px]"
                  placeholder="e.g., Short and generic, Lengthy and detailed, Poor, average or excellent grammar, Personal and thoughtful, Polite and respectful, Cold, Overly flattering, Asks lots of questions, Avoids questions, Overly avoids or insists on video calls..."
                  data-testid="input-message-substance"
                />
              </div>
            </CardContent>
          </Card>

          {/* Observations and Concerns */}
          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="observations-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Your Observations and Concerns
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Share any red flags or suspicious behaviors you've noticed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="observations_concerns"
                value={formData.observations_concerns}
                onChange={(e) => handleChange('observations_concerns', e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600 min-h-[200px] resize-y"
                placeholder="e.g., Vague regarding their occupation, Claims to travel frequently but photos don't match, Avoids video calls, Requests for money, Inconsistent stories and general information, Reluctant to meet in person... just seems too good to be true."
                data-testid="input-observations"
              />
            </CardContent>
          </Card>

          {/* Terms Acceptance */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="acceptTerms"
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                className="mt-1 border-zinc-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                data-testid="accept-terms-checkbox"
              />
              <div className="flex-1">
                <Label htmlFor="acceptTerms" className="text-zinc-300 cursor-pointer">
                  {isFr 
                    ? "J'accepte les Conditions Générales d'Utilisation et les Conditions Générales de Vente de 2good2breal."
                    : "I accept the Terms and Conditions and General Terms of Sale of 2good2breal."}
                </Label>
                <div className="mt-2 flex gap-4">
                  <Link to="/terms" target="_blank" className="text-purple-400 hover:text-purple-300 text-sm">
                    {isFr ? "Voir les CGU →" : "View Terms →"}
                  </Link>
                  <Link to="/cgv" target="_blank" className="text-purple-400 hover:text-purple-300 text-sm">
                    {isFr ? "Voir les CGV →" : "View Sales Terms →"}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              type="button"
              variant="outline"
              size="lg"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => window.print()}
              data-testid="print-form-btn"
            >
              <Printer className="w-5 h-5 mr-2" />
              {isFr ? "Imprimer le formulaire" : "Print Form"}
            </Button>
            <Button 
              type="submit" 
              size="lg"
              className="bg-purple-600 hover:bg-purple-500 text-white px-12"
              disabled={loading || paidCredits <= 0 || !acceptedTerms}
              data-testid="analyze-submit"
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {photos.length > 0 
                    ? (isFr ? 'Analyse du profil et des photos...' : 'Analyzing Profile & Photos...') 
                    : (isFr ? 'Analyse du profil...' : 'Analyzing Profile...')}
                </span>
              ) : (
                <span className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  {isFr ? "Analyser le Profil" : "Analyze Profile"}
                </span>
              )}
            </Button>
          </div>
          
          {!acceptedTerms && (
            <p className="text-center text-amber-400 text-sm">
              {isFr 
                ? "Veuillez accepter les conditions générales pour continuer."
                : "Please accept the terms and conditions to continue."}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
