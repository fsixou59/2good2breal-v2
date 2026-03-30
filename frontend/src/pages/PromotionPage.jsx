import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '../components/ui/button';
import { ArrowLeft, Copy, Mail, Share2, FileText, Users, Hash, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-6">
    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-purple-400" />}
      {title}
    </h2>
    {children}
  </div>
);

const CopyBlock = ({ title, content }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copié dans le presse-papier!');
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-purple-400 font-semibold text-sm">{title}</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCopy}
          className="text-zinc-400 hover:text-white"
        >
          <Copy className="w-4 h-4 mr-1" /> Copier
        </Button>
      </div>
      <p className="text-zinc-300 text-sm whitespace-pre-line">{content}</p>
    </div>
  );
};

export function PromotionPage() {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const postCourt = `🛡️ Protégez-vous des arnaques sentimentales!

Avant de tomber amoureux(se), vérifiez son profil.
✅ Analyse professionnelle
✅ Détection des fake profiles
✅ Résultats en 48h

👉 www.2good2breal.com

#ArnaqueSentimentale #Catfishing #DatingSafe #2good2breal`;

  const postMedium = `🚨 1 personne sur 3 rencontrée en ligne n'est pas celle qu'elle prétend être.

Les arnaques sentimentales font des milliers de victimes chaque année. Photos volées, fausses identités, manipulations émotionnelles... Les scammers sont de plus en plus sophistiqués.

2good2breal est le premier service professionnel de vérification de profils de rencontre en France.

✅ Analyse approfondie par des experts
✅ Technologie IA de détection
✅ Rapport détaillé avec score de confiance
✅ Résultats confidentiels en 48h

Ne laissez pas un escroc jouer avec vos sentiments.

🔗 Découvrez notre service : www.2good2breal.com

📞 +33 7 67 92 55 45
📧 contact@2good2breal.com

#ProtectionEnLigne #ArnaqueSentimentale #RencontreEnLigne #Catfishing #SécuritéNumérique`;

  const postLong = `💔 "Je pensais avoir trouvé l'amour de ma vie... C'était un escroc."

Chaque année en France, des milliers de personnes sont victimes d'arnaques sentimentales. Les chiffres sont alarmants :
• 500 millions d'euros perdus annuellement en Europe
• 70% des victimes sont des femmes
• Durée moyenne de l'arnaque : 6 à 12 mois

Les "romance scammers" utilisent des techniques de manipulation psychologique redoutables. Ils créent des profils parfaits, construisent une relation de confiance pendant des mois, avant de demander de l'argent pour des "urgences".

Comment se protéger ?

Chez 2good2breal, nous avons développé un service professionnel de vérification de profils de rencontre. Notre équipe d'experts, assistée par l'intelligence artificielle, analyse :

🔍 L'authenticité des photos
🔍 La cohérence des informations
🔍 Les signaux d'alerte (red flags)
🔍 Les traces numériques

Un doute ? Faites vérifier avant de vous engager émotionnellement.

👉 www.2good2breal.com

Ensemble, luttons contre les arnaques sentimentales.`;

  const lettreAssociation = `Objet : Partenariat pour la protection des femmes contre les arnaques sentimentales en ligne

Madame, Monsieur,

Je me permets de vous contacter au nom de 2good2breal, premier service français de vérification de profils de rencontre en ligne.

Le constat alarmant

Les arnaques sentimentales, également connues sous le nom de "romance scams", constituent aujourd'hui l'une des formes de cybercriminalité les plus dévastatrices. Les statistiques sont éloquentes :

• 70% des victimes sont des femmes
• Perte financière moyenne : 10 000 à 50 000 euros par victime
• Impact psychologique souvent comparable à celui d'une violence conjugale
• Sentiment de honte empêchant de nombreuses victimes de porter plainte

Notre mission

2good2breal a été créé pour offrir un outil concret de protection. Notre service permet à toute personne ayant un doute sur un profil de rencontre de faire réaliser une vérification professionnelle avant de s'engager émotionnellement ou financièrement.

Notre méthodologie

• Analyse approfondie par des experts en cybersécurité
• Utilisation de l'intelligence artificielle pour la détection de patterns frauduleux
• Vérification des photos (reverse image search avancé)
• Analyse comportementale et linguistique
• Rapport détaillé et confidentiel remis sous 48h

Proposition de partenariat

Nous souhaitons établir un partenariat avec votre association pour :

1. Sensibilisation : Interventions gratuites auprès de vos adhérentes sur les risques des arnaques sentimentales et les moyens de s'en protéger

2. Tarifs préférentiels : Offre spéciale pour les personnes orientées par votre association (-20% sur nos services)

3. Documentation : Mise à disposition de supports de prévention (guides, infographies, vidéos)

4. Ligne d'écoute : Accompagnement des victimes dans leurs démarches de vérification

Pourquoi ce partenariat est important

La prévention est la meilleure arme contre ces arnaques. En travaillant ensemble, nous pouvons :
• Informer les femmes AVANT qu'elles ne deviennent victimes
• Offrir un outil concret de protection
• Réduire le sentiment de honte en normalisant la vérification

Contact

Je serais honoré(e) de vous présenter notre service plus en détail lors d'un entretien téléphonique ou d'une rencontre.

📞 +33 7 67 92 55 45
📧 contact@2good2breal.com
🌐 www.2good2breal.com
📍 4 Avenue Laurent Cely, 92600 Asnières-sur-Seine

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

L'équipe 2good2breal`;

  const associations = [
    { name: "Femmes Solidaires", email: "federation@femmes-solidaires.org" },
    { name: "Fondation des Femmes", email: "contact@fondationdesfemmes.org" },
    { name: "Centre Hubertine Auclert", email: "contact@hubertine.fr" },
    { name: "Fédération Nationale Solidarité Femmes", email: "contact@solidaritefemmes.org" },
    { name: "Association Française des Femmes Juristes", email: "afjuristes@gmail.com" },
    { name: "Women Safe & Children", email: "contact@women-safe.org" },
    { name: "En avant toute(s)", email: "contact@enavanttoutes.fr" },
    { name: "Collectif Féministe Contre le Viol", email: "cfcv@cfcv.asso.fr" },
  ];

  const hashtagsFr = "#ArnaqueSentimentale #Catfishing #RencontreEnLigne #ProtectionFemmes #CyberSécurité #FauxProfils #Scam #LoveScam #DatingEnLigne #VérificationProfil #2good2breal";
  const hashtagsEn = "#RomanceScam #OnlineDating #CatfishAlert #DatingSafety #ScamPrevention #FakeProfiles #OnlineSafety #ProtectYourHeart";

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link to="/">
          <Button variant="ghost" className="text-zinc-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isFr ? "Retour à l'accueil" : "Back to Home"}
          </Button>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {isFr ? "Kit de Promotion" : "Promotion Kit"}
          </h1>
          <p className="text-zinc-500">
            {isFr ? "Ressources pour promouvoir 2good2breal" : "Resources to promote 2good2breal"}
          </p>
        </div>

        {/* Social Media Posts */}
        <Section title={isFr ? "Posts Réseaux Sociaux" : "Social Media Posts"} icon={Share2}>
          <CopyBlock 
            title="Twitter/X, Instagram Stories (Court)" 
            content={postCourt} 
          />
          <CopyBlock 
            title="Facebook, LinkedIn (Medium)" 
            content={postMedium} 
          />
          <CopyBlock 
            title="LinkedIn, Facebook - Sensibilisation (Long)" 
            content={postLong} 
          />
        </Section>

        {/* Letter for Associations */}
        <Section title={isFr ? "Lettre pour Associations" : "Letter for Associations"} icon={Mail}>
          <CopyBlock 
            title={isFr ? "Lettre de Partenariat" : "Partnership Letter"} 
            content={lettreAssociation} 
          />
        </Section>

        {/* List of Associations */}
        <Section title={isFr ? "Associations à Contacter" : "Associations to Contact"} icon={Users}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {associations.map((assoc, index) => (
              <div key={index} className="bg-zinc-800/50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{assoc.name}</p>
                  <p className="text-purple-400 text-xs">{assoc.email}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(assoc.email);
                    toast.success('Email copié!');
                  }}
                  className="text-zinc-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Section>

        {/* Hashtags */}
        <Section title="Hashtags" icon={Hash}>
          <CopyBlock 
            title="Français" 
            content={hashtagsFr} 
          />
          <CopyBlock 
            title="English" 
            content={hashtagsEn} 
          />
        </Section>

        {/* Tips */}
        <Section title={isFr ? "Conseils de Publication" : "Publishing Tips"} icon={CheckCircle}>
          <ul className="text-zinc-300 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>{isFr ? "Publiez aux heures de forte audience : 12h-14h et 18h-21h" : "Post during peak hours: 12pm-2pm and 6pm-9pm"}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>{isFr ? "Utilisez des visuels accrocheurs avec vos posts" : "Use eye-catching visuals with your posts"}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>{isFr ? "Répondez aux commentaires pour augmenter l'engagement" : "Reply to comments to increase engagement"}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>{isFr ? "Partagez des témoignages clients (anonymisés)" : "Share client testimonials (anonymized)"}</span>
            </li>
          </ul>
        </Section>

      </div>
    </div>
  );
}

export default PromotionPage;
