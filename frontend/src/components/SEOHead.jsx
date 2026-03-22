import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://2good2breal.com';

// SEO configuration for each page
const pageSEO = {
  '/': {
    title: '2good2breal | Vérification de Profils de Rencontre',
    description: 'Service de vérification de profils de rencontre. Protégez-vous des arnaques sentimentales avec notre analyse experte.',
  },
  '/pricing': {
    title: 'Tarifs | 2good2breal',
    description: 'Découvrez nos forfaits de vérification de profils de rencontre. Standard, Comprehensive et Premium.',
  },
  '/login': {
    title: 'Connexion | 2good2breal',
    description: 'Connectez-vous à votre compte 2good2breal pour accéder à vos vérifications de profils.',
  },
  '/register': {
    title: 'Inscription | 2good2breal',
    description: 'Créez votre compte 2good2breal et commencez à vérifier les profils de rencontre.',
  },
  '/faq': {
    title: 'FAQ | 2good2breal',
    description: 'Questions fréquentes sur notre service de vérification de profils de rencontre.',
  },
  '/terms': {
    title: 'Conditions Générales | 2good2breal',
    description: 'Conditions générales d\'utilisation du service 2good2breal.',
  },
  '/cgv': {
    title: 'CGV | 2good2breal',
    description: 'Conditions générales de vente du service 2good2breal.',
  },
  '/cookies': {
    title: 'Politique de Cookies | 2good2breal',
    description: 'Politique de cookies du site 2good2breal.',
  },
  '/refund-request': {
    title: 'Demande de Remboursement | 2good2breal',
    description: 'Formulaire de demande de remboursement 2good2breal.',
  },
  '/analyze': {
    title: 'Analyser un Profil | 2good2breal',
    description: 'Soumettez un profil de rencontre pour vérification.',
    noindex: true,
  },
  '/dashboard': {
    title: 'Tableau de Bord | 2good2breal',
    description: 'Votre tableau de bord 2good2breal.',
    noindex: true,
  },
  '/admin': {
    title: 'Administration | 2good2breal',
    description: 'Panneau d\'administration 2good2breal.',
    noindex: true,
  },
};

export function SEOHead() {
  const location = useLocation();
  
  useEffect(() => {
    // Get current path without query params
    const path = location.pathname;
    
    // Normalize path (remove trailing slash except for root)
    const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
    
    // Get SEO config for this page
    const seo = pageSEO[normalizedPath] || {
      title: '2good2breal | Vérification de Profils',
      description: 'Service de vérification de profils de rencontre.',
      noindex: true,
    };
    
    // Build canonical URL (always without trailing slash except root)
    const canonicalUrl = normalizedPath === '/' 
      ? BASE_URL + '/'
      : BASE_URL + normalizedPath;
    
    // Update document title
    document.title = seo.title;
    
    // Update or create canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', seo.description);
    }
    
    // Update robots meta
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
      metaRobots.setAttribute('content', seo.noindex ? 'noindex, nofollow' : 'index, follow');
    }
    
    // Update Open Graph URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    }
    
    // Update Open Graph title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', seo.title);
    }
    
    // Update Open Graph description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', seo.description);
    }
    
    // Update Twitter URL
    let twitterUrl = document.querySelector('meta[name="twitter:url"]');
    if (twitterUrl) {
      twitterUrl.setAttribute('content', canonicalUrl);
    }
    
    // Update Twitter title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', seo.title);
    }
    
    // Update Twitter description
    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', seo.description);
    }
    
  }, [location.pathname]);
  
  return null; // This component doesn't render anything
}

export default SEOHead;
