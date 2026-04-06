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
import heic2any from 'heic2any';
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
  Printer,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAX_PHOTOS = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const TOTAL_STEPS = 4;

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
  const [currentStep, setCurrentStep] = useState(1);
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

  // Extract first name from full name or email
  const getFirstName = (fullName, email) => {
    if (fullName && fullName.trim()) {
      return fullName.trim().split(' ')[0];
    }
    if (email) {
      return email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
    }
    return isFr ? 'Client' : 'Client';
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (photos.length + files.length > MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    // Helper function to check if file is HEIC
    const isHeicFile = (file) => {
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.heic') || fileName.endsWith('.heif') || 
             file.type === 'image/heic' || file.type === 'image/heif';
    };

    setUploadingPhotos(true);

    try {
      const processedPhotos = await Promise.all(
        files.map(async (file) => {
          // Check file size
          if (file.size > MAX_FILE_SIZE) {
            toast.error(`${file.name} is too large. Maximum size is 5MB`);
            return null;
          }

          let processedFile = file;
          let originalName = file.name;

          // Convert HEIC to JPEG if needed
          if (isHeicFile(file)) {
            try {
              toast.info(`Converting ${file.name} from HEIC to JPEG...`);
              const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.85
              });
              // Handle both single blob and array of blobs
              const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
              processedFile = new File(
                [finalBlob], 
                file.name.replace(/\.(heic|heif)$/i, '.jpg'),
                { type: 'image/jpeg' }
              );
              originalName = processedFile.name;
            } catch (heicError) {
              console.error('HEIC conversion error:', heicError);
              toast.error(`Failed to convert ${file.name}. Please use a different format.`);
              return null;
            }
          }

          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: Date.now() + Math.random(),
                name: originalName,
                preview: reader.result,
                base64: reader.result
              });
            };
            reader.onerror = () => {
              toast.error(`Failed to read ${originalName}`);
              resolve(null);
            };
            reader.readAsDataURL(processedFile);
          });
        })
      );

      const validPhotos = processedPhotos.filter(p => p !== null);
      setPhotos(prev => [...prev, ...validPhotos]);
      
      if (validPhotos.length > 0) {
        toast.success(`${validPhotos.length} photo(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to process photos');
    } finally {
      setUploadingPhotos(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.profile_name?.trim()) {
      toast.error(isFr ? 'Veuillez entrer le nom du profil' : 'Please enter the profile name');
      setCurrentStep(1);
      return;
    }

    if (!formData.client_email?.trim()) {
      toast.error(isFr ? 'Veuillez entrer votre email' : 'Please enter your email');
      setCurrentStep(1);
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
      const clientFirstName = getFirstName(user?.name, formData.client_email);
      
      setSubmissionData({
        referenceId: referenceId.substring(0, 8).toUpperCase(),
        fullReferenceId: referenceId,
        clientFirstName: clientFirstName,
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

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToStep = (step) => {
    setCurrentStep(step);
    window.scrollTo(0, 0);
  };

  // Step labels for progress indicator
  const stepLabels = isFr 
    ? ['Informations', 'Photos', 'Activité', 'Observations']
    : ['Information', 'Photos', 'Activity', 'Observations'];

  // Submission Confirmation Page (Acceptance Letter)
  if (submissionComplete && submissionData) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Print Styles */}
          <style>{`
            @media print {
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              body { background: white !important; margin: 0; padding: 20px; font-family: 'Georgia', serif; }
              .no-print { display: none !important; }
              nav, header, footer { display: none !important; }
              .print-letter { 
                background: white !important; 
                color: black !important;
                border: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 40px !important;
                font-family: 'Georgia', serif !important;
              }
              .print-letter * { color: black !important; font-family: 'Georgia', serif !important; }
              .print-letter h1 { color: #7c3aed !important; font-size: 24px !important; }
              .print-letter .letter-header { 
                border-bottom: 2px solid #7c3aed !important; 
                padding-bottom: 20px !important;
                margin-bottom: 30px !important;
              }
              .print-letter .letter-body { 
                font-size: 14px !important; 
                line-height: 1.8 !important; 
              }
              .print-letter .signature { 
                margin-top: 40px !important;
                font-style: italic !important;
              }
            }
          `}</style>

          {/* Action Buttons - No Print */}
          <div className="no-print mb-6 flex justify-center gap-4">
            <Button 
              type="button"
              onClick={() => { window.print(); }}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              {isFr ? 'Imprimer / Sauvegarder PDF' : 'Print / Save as PDF'}
            </Button>
            <Button 
              type="button"
              onClick={() => navigate('/')}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              {isFr ? 'Retour à l\'accueil' : 'Back to Home'}
            </Button>
          </div>

          {/* Acceptance Letter */}
          <div ref={printRef} className="print-letter bg-white rounded-2xl overflow-hidden border border-zinc-300 shadow-lg">
            {/* Letter Header */}
            <div className="letter-header bg-purple-50 p-8 border-b-2 border-purple-600">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-purple-700">2good2breal</h1>
                  <p className="text-gray-600 text-sm">Profile Verification Service</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>42, Avenue Montaigne</p>
                  <p>75008 Paris, France</p>
                  <p>contact@2good2breal.com</p>
                </div>
              </div>
            </div>

            {/* Letter Body */}
            <div className="letter-body p-8 bg-white text-gray-800">
              {/* Date and Reference */}
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <p className="text-gray-600">{submissionData.submissionDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{isFr ? 'Référence' : 'Reference'}:</p>
                  <p className="text-lg font-bold text-purple-700 font-mono">#{submissionData.referenceId}</p>
                </div>
              </div>

              {/* Salutation - First name only */}
              <div className="mb-6">
                <p className="text-lg">
                  {isFr ? 'Cher(e)' : 'Dear'} <span className="font-semibold">{submissionData.clientFirstName}</span>,
                </p>
              </div>

              {/* Letter Content */}
              <div className="space-y-4 leading-relaxed">
                <p>
                  {isFr 
                    ? 'Nous accusons réception de votre demande de vérification de profil et vous remercions de votre confiance envers 2good2breal.'
                    : 'We acknowledge receipt of your profile verification request and thank you for your trust in 2good2breal.'}
                </p>

                <p>
                  {isFr 
                    ? 'Votre soumission a été enregistrée avec succès dans notre système. Vous trouverez ci-dessous les détails de votre demande :'
                    : 'Your submission has been successfully recorded in our system. Below you will find the details of your request:'}
                </p>

                {/* Submission Details Box */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-6">
                  <h3 className="font-semibold text-purple-700 mb-3">{isFr ? 'Détails de la Soumission' : 'Submission Details'}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">{isFr ? 'Profil à vérifier' : 'Profile to verify'}:</span>
                      <span className="ml-2 font-medium">{submissionData.profileName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{isFr ? 'Plateforme' : 'Platform'}:</span>
                      <span className="ml-2 font-medium">{submissionData.formData.dating_platform || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{isFr ? 'Photos jointes' : 'Photos attached'}:</span>
                      <span className="ml-2 font-medium">{submissionData.photosCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium">{submissionData.clientEmail}</span>
                    </div>
                  </div>
                </div>

                <p>
                  {isFr 
                    ? 'Notre équipe d\'experts procédera à l\'analyse complète du profil que vous nous avez soumis. Cette analyse inclut :'
                    : 'Our team of experts will proceed with a complete analysis of the profile you submitted. This analysis includes:'}
                </p>

                <ul className="list-disc ml-6 space-y-1">
                  <li>{isFr ? 'Vérification d\'identité et des informations' : 'Identity and information verification'}</li>
                  <li>{isFr ? 'Analyse des photos par intelligence artificielle' : 'AI-powered photo analysis'}</li>
                  <li>{isFr ? 'Détection des incohérences et signaux d\'alerte' : 'Detection of inconsistencies and red flags'}</li>
                  <li>{isFr ? 'Recherche inverse d\'images' : 'Reverse image search'}</li>
                </ul>

                <p>
                  {isFr 
                    ? 'Vous recevrez le rapport complet de vérification par email dans un délai de 48 heures. Un email de confirmation a également été envoyé à l\'adresse indiquée.'
                    : 'You will receive the complete verification report by email within 48 hours. A confirmation email has also been sent to the address provided.'}
                </p>

                <p>
                  {isFr 
                    ? 'Pour toute question ou demande urgente, n\'hésitez pas à nous contacter par téléphone ou WhatsApp.'
                    : 'For any questions or urgent requests, please do not hesitate to contact us by phone or WhatsApp.'}
                </p>
              </div>

              {/* Signature */}
              <div className="signature mt-10">
                <p>{isFr ? 'Cordialement,' : 'Sincerely,'}</p>
                <p className="font-semibold mt-2">{isFr ? 'L\'équipe 2good2breal' : 'The 2good2breal Team'}</p>
              </div>

              {/* Contact Footer */}
              <div className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-600">
                <div className="flex justify-between">
                  <div>
                    <p>{isFr ? 'Téléphone' : 'Phone'}: +33 (0) 7 67 92 55 45</p>
                    <p>WhatsApp: +33 (0) 7 67 92 55 45</p>
                  </div>
                  <div className="text-right">
                    <p>www.2good2breal.com</p>
                    <p>contact@2good2breal.com</p>
                  </div>
                </div>
              </div>
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
            {isFr ? 'Soumission de Profil' : 'Profile Submission'}
          </h1>
          <p className="text-zinc-400">
            {isFr ? 'Entrez les détails du profil à vérifier' : 'Enter the profile details to verify'}
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
                    ? 'Vous avez besoin de crédits pour soumettre des profils. Achetez un forfait de vérification pour continuer.' 
                    : 'You need credits to submit profiles. Purchase a verification package to continue.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {stepLabels.map((label, index) => (
              <div 
                key={index}
                className={`flex flex-col items-center cursor-pointer ${index + 1 <= currentStep ? 'text-purple-400' : 'text-zinc-600'}`}
                onClick={() => goToStep(index + 1)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  index + 1 < currentStep 
                    ? 'bg-purple-600 border-purple-600' 
                    : index + 1 === currentStep 
                      ? 'border-purple-500 bg-purple-500/20' 
                      : 'border-zinc-700 bg-zinc-800/50'
                }`}>
                  {index + 1 < currentStep ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className={`text-sm font-semibold ${index + 1 === currentStep ? 'text-purple-400' : 'text-zinc-500'}`}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-2 hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ============ STEP 1: Client & Basic Info (ends with nationality/language) ============ */}
          {currentStep === 1 && (
            <>
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
                    {isFr ? "Informations de Base" : "Basic Information"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile_name" className="text-zinc-300">
                        {isFr ? "Nom du Profil" : "Profile Name"} *
                      </Label>
                      <Input
                        id="profile_name"
                        value={formData.profile_name}
                        onChange={(e) => handleChange('profile_name', e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                        placeholder={isFr ? "Entrez le nom du profil" : "Enter the profile name"}
                        required
                        data-testid="input-profile-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_real_name" className="text-zinc-300">
                        {isFr ? "Nom Réel Complet (si disponible)" : "Full Real Name if available"}
                      </Label>
                      <Input
                        id="full_real_name"
                        value={formData.full_real_name}
                        onChange={(e) => handleChange('full_real_name', e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                        placeholder={isFr ? "Entrez le nom réel si connu" : "Enter full real name if known"}
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
                </CardContent>
              </Card>
            </>
          )}

          {/* ============ STEP 2: Profile Details & Photos ============ */}
          {currentStep === 2 && (
            <>
              {/* Profile Details */}
              <Card className="bg-zinc-900/50 border-zinc-800" data-testid="profile-details-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-400" />
                    {isFr ? "Détails du Profil" : "Profile Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      {isFr ? "Localisation du Profil" : "Profile Location"}
                    </Label>
                    <Input
                      id="profile_location"
                      value={formData.profile_location}
                      onChange={(e) => handleChange('profile_location', e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                      placeholder={isFr ? "Ville, Pays" : "City, Country"}
                      data-testid="input-location"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="occupation" className="text-zinc-300">
                        {isFr ? "Profession" : "Occupation"}
                      </Label>
                      <Input
                        id="occupation"
                        value={formData.occupation}
                        onChange={(e) => handleChange('occupation', e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                        placeholder={isFr ? "ex: Ingénieur, Médecin..." : "e.g., Engineer, Doctor..."}
                        data-testid="input-occupation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_name" className="text-zinc-300">
                        {isFr ? "Nom de l'entreprise" : "Company Name"}
                      </Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                        placeholder={isFr ? "Entrez le nom de l'entreprise" : "Enter company name if known"}
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
                      {isFr ? "Plateforme de rencontre / Méthode de rencontre" : "Dating Platform / Method of meeting"}
                    </Label>
                    <Input
                      id="dating_platform"
                      value={formData.dating_platform}
                      onChange={(e) => handleChange('dating_platform', e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                      placeholder={isFr ? "ex: Tinder, Bumble, Speed Dating..." : "e.g., Tinder, Bumble, Speed Dating..."}
                      data-testid="input-platform"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile_bio" className="text-zinc-300">
                      {isFr ? "Bio et Description du Profil" : "Profile Bio and Description"}
                    </Label>
                    <Textarea
                      id="profile_bio"
                      value={formData.profile_bio}
                      onChange={(e) => handleChange('profile_bio', e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600 min-h-[100px] resize-y"
                      placeholder={isFr ? "Copiez la bio/description du profil" : "Paste the profile bio/description"}
                      data-testid="input-bio"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Photo Upload Section - Reduced size 50% */}
              <Card className="bg-zinc-900/50 border-zinc-800" data-testid="photo-upload-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-teal-400" />
                    {isFr ? "Photos du Profil pour Analyse I.A." : "Profile Photos for A.I. Analysis"}
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    {isFr 
                      ? `Téléchargez jusqu'à ${MAX_PHOTOS} photos pour la recherche d'image inversée et la vérification d'identité`
                      : `Upload up to ${MAX_PHOTOS} photos for reverse image search and identity verification`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Area - Reduced size */}
                  <div 
                    className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                      photos.length >= MAX_PHOTOS 
                        ? 'border-zinc-700 bg-zinc-800/20 cursor-not-allowed' 
                        : 'border-zinc-700 hover:border-purple-600 hover:bg-zinc-800/30 cursor-pointer'
                    }`}
                    onClick={() => photos.length < MAX_PHOTOS && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.heic,.heif"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={photos.length >= MAX_PHOTOS || uploadingPhotos}
                      data-testid="photo-upload-input"
                    />
                    
                    {uploadingPhotos ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                        <p className="text-zinc-300 text-sm">{isFr ? "Traitement des photos..." : "Processing photos..."}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className={`w-8 h-8 mb-2 ${photos.length >= MAX_PHOTOS ? 'text-zinc-600' : 'text-purple-400'}`} />
                        <p className={`font-medium text-sm ${photos.length >= MAX_PHOTOS ? 'text-zinc-600' : 'text-zinc-300'}`}>
                          {photos.length >= MAX_PHOTOS 
                            ? (isFr ? 'Maximum de photos atteint' : 'Maximum photos reached')
                            : (isFr ? 'Cliquez pour télécharger des photos' : 'Click to upload photos')}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {photos.length}/{MAX_PHOTOS} photos • Max 5MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Photo Previews - Smaller */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {photos.map((photo, index) => (
                        <div 
                          key={photo.id} 
                          className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-700"
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
                              className="bg-red-600 hover:bg-red-500 h-6 w-6 p-0"
                              data-testid={`remove-photo-${index}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* ============ STEP 3: Activity Information ============ */}
          {currentStep === 3 && (
            <>
              {/* Photo Information */}
              <Card className="bg-zinc-900/50 border-zinc-800" data-testid="photo-info-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Image className="w-5 h-5 text-teal-400" />
                    {isFr ? "Informations sur les Photos" : "Photo Information"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile_photos_count" className="text-zinc-300">
                        {isFr ? "Nombre de photos sur le profil" : "Number of Photos on Profile"}
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
                        {isFr ? "Photos vérifiées" : "Has Verified Photos"}
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
                    {isFr ? "Réseaux Sociaux" : "Social Media"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="social_media_links" className="text-zinc-300">
                      {isFr ? "Liens des réseaux sociaux" : "Social Media Links"}
                    </Label>
                    <Textarea
                      id="social_media_links"
                      value={formData.social_media_links}
                      onChange={(e) => handleChange('social_media_links', e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                      placeholder={isFr 
                        ? "Collez les liens (Instagram, Facebook, LinkedIn, etc.), séparés par des virgules" 
                        : "Paste any social media links (Instagram, Facebook, LinkedIn, etc.), separated by commas"}
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
                    {isFr ? "Informations d'Activité" : "Activity Information"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile_creation_date" className="text-zinc-300">
                        {isFr ? "Date de création du profil" : "Profile Creation Date"}
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
                        {isFr ? "Dernière communication/rencontre" : "Last communication/meeting"}
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
            </>
          )}

          {/* ============ STEP 4: Communication & Observations ============ */}
          {currentStep === 4 && (
            <>
              {/* Communication Analysis */}
              <Card className="bg-zinc-900/50 border-zinc-800" data-testid="communication-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-orange-400" />
                    {isFr ? "Analyse de la Communication" : "Communication Analysis"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="communication_frequency" className="text-zinc-300">
                      {isFr ? "Fréquence de communication" : "Frequency of Communication"}
                    </Label>
                    <Textarea
                      id="communication_frequency"
                      value={formData.communication_frequency}
                      onChange={(e) => handleChange('communication_frequency', e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600"
                      placeholder={isFr 
                        ? "ex: Régulier, Love bombing, Ghosting, Chaud/froid..." 
                        : "e.g., Regular, Love bombing, Ghosting, Hot and cold..."}
                      data-testid="input-communication-frequency"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message_substance" className="text-zinc-300">
                      {isFr ? "Substance des Messages" : "Substance of Messages"}
                    </Label>
                    <Textarea
                      id="message_substance"
                      value={formData.message_substance}
                      onChange={(e) => handleChange('message_substance', e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600 min-h-[100px]"
                      placeholder={isFr 
                        ? "ex: Messages courts et génériques, Détaillés, Grammaire correcte, Flatteur..." 
                        : "e.g., Short and generic, Lengthy and detailed, Good grammar, Overly flattering..."}
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
                    {isFr ? "Vos Observations et Préoccupations" : "Your Observations and Concerns"}
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    {isFr 
                      ? "Partagez les signaux d'alerte ou comportements suspects que vous avez remarqués"
                      : "Share any red flags or suspicious behaviors you've noticed"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="observations_concerns"
                    value={formData.observations_concerns}
                    onChange={(e) => handleChange('observations_concerns', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-600 min-h-[150px] resize-y"
                    placeholder={isFr 
                      ? "ex: Vague sur sa profession, Évite les appels vidéo, Demandes d'argent..." 
                      : "e.g., Vague about occupation, Avoids video calls, Money requests..."}
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

              {!acceptedTerms && (
                <p className="text-center text-amber-400 text-sm">
                  {isFr 
                    ? "Veuillez accepter les conditions générales pour continuer."
                    : "Please accept the terms and conditions to continue."}
                </p>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            {currentStep > 1 ? (
              <Button 
                type="button"
                variant="outline"
                onClick={prevStep}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {isFr ? "Précédent" : "Previous"}
              </Button>
            ) : (
              <div />
            )}

            {currentStep < TOTAL_STEPS ? (
              <Button 
                type="button"
                onClick={nextStep}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                {isFr ? "Suivant" : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  data-testid="print-form-btn"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {isFr ? "Imprimer" : "Print"}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8"
                  disabled={loading || paidCredits <= 0 || !acceptedTerms}
                  data-testid="analyze-submit"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isFr ? 'Soumission...' : 'Submitting...'}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Search className="w-4 h-4 mr-2" />
                      {isFr ? "Soumettre le Profil" : "Submit Profile"}
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
