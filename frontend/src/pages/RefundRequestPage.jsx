import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { AlertCircle, CheckCircle, FileText, CreditCard, User, Mail, Phone, Building } from 'lucide-react';

const RefundRequestPage = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isFr = language === 'fr';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    username: user?.username || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    
    // Order Information
    orderReference: '',
    orderDate: '',
    packagePurchased: '',
    amountPaid: '',
    
    // Bank Information
    accountHolder: '',
    iban: '',
    bic: '',
    bankName: '',
    
    // Refund Reason
    reason: '',
    additionalDetails: '',
    
    // Agreement
    agreeTerms: false,
    agreeDataProcessing: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.agreeTerms || !formData.agreeDataProcessing) {
      setError(isFr ? 'Veuillez accepter les conditions requises.' : 'Please accept the required conditions.');
      return;
    }

    setIsSubmitting(true);

    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API_URL}/api/refund-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
          language: language
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.detail || (isFr ? 'Une erreur est survenue.' : 'An error occurred.'));
      }
    } catch (err) {
      setError(isFr ? 'Erreur de connexion. Veuillez réessayer.' : 'Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-green-950/30 border border-green-700/50 rounded-2xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              {isFr ? 'Demande Envoyée' : 'Request Submitted'}
            </h2>
            <p className="text-zinc-300 mb-6">
              {isFr 
                ? 'Votre demande de remboursement a été soumise avec succès. Notre équipe l\'examinera et vous contactera dans les 48 heures ouvrables.'
                : 'Your refund request has been successfully submitted. Our team will review it and contact you within 48 business hours.'}
            </p>
            <p className="text-zinc-400 text-sm">
              {isFr ? 'Référence de la demande: ' : 'Request reference: '}
              <span className="text-purple-400 font-mono">REF-{Date.now().toString(36).toUpperCase()}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {isFr ? 'Demande de Remboursement' : 'Refund Request'}
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            {isFr 
              ? 'Veuillez remplir ce formulaire pour soumettre votre demande de remboursement. Toutes les informations sont requises pour traiter votre demande.'
              : 'Please complete this form to submit your refund request. All information is required to process your request.'}
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-950/30 border border-amber-700/50 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-200">
              <p className="font-semibold mb-1">{isFr ? 'Information Importante' : 'Important Information'}</p>
              <p>
                {isFr 
                  ? 'Un remboursement peut être accordé uniquement et exceptionnellement si 2good2breal reconnaît et détermine, avant le commencement de l\'analyse du profil soumis, être dans l\'incapacité de fournir un rapport complet en raison de données insuffisantes.'
                  : 'A refund may be provided solely and exceptionally if 2good2breal acknowledge and determine, prior to commencement of the Profile Analysis submitted, to be unable to provide a completed report due to insufficient data.'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              {isFr ? 'Informations Personnelles' : 'Personal Information'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300">{isFr ? 'Prénom' : 'First Name'} *</Label>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">{isFr ? 'Nom' : 'Last Name'} *</Label>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">{isFr ? "Nom d'utilisateur" : 'Username'} *</Label>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">Email *</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">{isFr ? 'Téléphone' : 'Phone'} *</Label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+33 6 00 00 00 00"
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-zinc-300">{isFr ? 'Adresse' : 'Address'}</Label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">{isFr ? 'Ville' : 'City'}</Label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">{isFr ? 'Code Postal' : 'Postal Code'}</Label>
                <Input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">{isFr ? 'Pays' : 'Country'}</Label>
                <Input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Order Information Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              {isFr ? 'Informations de Commande' : 'Order Information'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300">{isFr ? 'Référence de Commande' : 'Order Reference'} *</Label>
                <Input
                  name="orderReference"
                  value={formData.orderReference}
                  onChange={handleChange}
                  required
                  placeholder="ex: ORD-XXXXXX"
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">{isFr ? 'Date de Commande' : 'Order Date'} *</Label>
                <Input
                  type="date"
                  name="orderDate"
                  value={formData.orderDate}
                  onChange={handleChange}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">{isFr ? 'Forfait Acheté' : 'Package Purchased'} *</Label>
                <select
                  name="packagePurchased"
                  value={formData.packagePurchased}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 rounded-md bg-zinc-800/50 border border-zinc-700 text-white mt-1"
                >
                  <option value="">{isFr ? 'Sélectionner...' : 'Select...'}</option>
                  <option value="basic">Basic - €49</option>
                  <option value="comprehensive">Comprehensive - €99</option>
                  <option value="premium">Premium - €189</option>
                </select>
              </div>
              <div>
                <Label className="text-zinc-300">{isFr ? 'Montant Payé (€)' : 'Amount Paid (€)'} *</Label>
                <Input
                  type="number"
                  name="amountPaid"
                  value={formData.amountPaid}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Bank Information Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              {isFr ? 'Informations Bancaires' : 'Bank Information'}
            </h2>
            <p className="text-zinc-400 text-sm mb-4">
              {isFr 
                ? 'Ces informations sont nécessaires pour effectuer le virement de remboursement.'
                : 'This information is required to process your refund transfer.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-zinc-300">{isFr ? 'Titulaire du Compte' : 'Account Holder Name'} *</Label>
                <Input
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  required
                  placeholder={isFr ? 'Nom tel qu\'il apparaît sur le compte' : 'Name as it appears on the account'}
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-zinc-300">IBAN *</Label>
                <Input
                  name="iban"
                  value={formData.iban}
                  onChange={handleChange}
                  required
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-zinc-300">BIC / SWIFT *</Label>
                <Input
                  name="bic"
                  value={formData.bic}
                  onChange={handleChange}
                  required
                  placeholder="XXXXXXXX"
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-zinc-300">{isFr ? 'Nom de la Banque' : 'Bank Name'} *</Label>
                <Input
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-400" />
              {isFr ? 'Motif de la Demande' : 'Reason for Request'}
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300">{isFr ? 'Raison du Remboursement' : 'Refund Reason'} *</Label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 rounded-md bg-zinc-800/50 border border-zinc-700 text-white mt-1"
                >
                  <option value="">{isFr ? 'Sélectionner...' : 'Select...'}</option>
                  <option value="insufficient_data">{isFr ? 'Données insuffisantes pour l\'analyse' : 'Insufficient data for analysis'}</option>
                  <option value="service_not_started">{isFr ? 'Service non commencé' : 'Service not started'}</option>
                  <option value="duplicate_payment">{isFr ? 'Paiement en double' : 'Duplicate payment'}</option>
                  <option value="other">{isFr ? 'Autre' : 'Other'}</option>
                </select>
              </div>
              <div>
                <Label className="text-zinc-300">{isFr ? 'Détails Supplémentaires' : 'Additional Details'}</Label>
                <Textarea
                  name="additionalDetails"
                  value={formData.additionalDetails}
                  onChange={handleChange}
                  rows={4}
                  placeholder={isFr ? 'Veuillez fournir des détails supplémentaires concernant votre demande...' : 'Please provide additional details regarding your request...'}
                  className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Agreements */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
              />
              <label className="text-zinc-300 text-sm">
                {isFr 
                  ? 'Je certifie que les informations fournies sont exactes et complètes. Je comprends que toute fausse déclaration peut entraîner le rejet de ma demande. *'
                  : 'I certify that the information provided is accurate and complete. I understand that any false statement may result in the rejection of my request. *'}
              </label>
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="agreeDataProcessing"
                checked={formData.agreeDataProcessing}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
              />
              <label className="text-zinc-300 text-sm">
                {isFr 
                  ? 'J\'autorise 2good2breal à traiter mes données bancaires dans le seul but d\'effectuer le remboursement. Ces données seront supprimées après le traitement. *'
                  : 'I authorize 2good2breal to process my bank data for the sole purpose of making the refund. This data will be deleted after processing. *'}
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-950/30 border border-red-700/50 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white py-6 text-lg"
          >
            {isSubmitting 
              ? (isFr ? 'Envoi en cours...' : 'Submitting...') 
              : (isFr ? 'Soumettre la Demande de Remboursement' : 'Submit Refund Request')}
          </Button>

          {/* Contact Info */}
          <p className="text-center text-zinc-500 text-sm">
            {isFr 
              ? 'Pour toute question, contactez-nous à contact@2good2breal.com'
              : 'For any questions, contact us at contact@2good2breal.com'}
          </p>
        </form>
      </div>
    </div>
  );
};

export default RefundRequestPage;
