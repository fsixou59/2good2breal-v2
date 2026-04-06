import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Check, 
  Shield, 
  Zap, 
  Crown,
  Loader2,
  CreditCard,
  Coins,
  ArrowRight,
  Lock
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function PricingPage() {
  const { isAuthenticated, getAuthHeaders, user, getTotalCredits } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPackage, setProcessingPackage] = useState(null);
  const totalCredits = getTotalCredits();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await axios.get(`${API}/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Failed to load packages:', error);
      toast.error('Failed to load pricing packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId) => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase');
      navigate('/login');
      return;
    }

    setProcessingPackage(packageId);

    try {
      const response = await axios.post(
        `${API}/checkout`,
        {
          package_id: packageId,
          origin_url: window.location.origin
        },
        getAuthHeaders()
      );

      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create checkout session');
      setProcessingPackage(null);
    }
  };

  const getFeatures = (packageId) => {
    const features = {
      basic: [
        'Standard profile analysis',
        'Trust score assessment', 
        'Red flag detection',
        'A.I. powered photo analysis',
        'Delivery within 48 hours',
        'Standard dossier report'
      ],
      comprehensive: [
        'In-depth profile analysis and investigation',
        'Trust score assessment',
        'Red flag detection',
        'Extended background check',
        'Cross-verification across social networks',
        'Reverse image search',
        'Detailed report with recommendations',
        'Priority delivery within 24 hours',
        '1 profile verification'
      ],
      premium: [
        'All COMPREHENSIVE VERIFICATION features',
        'Monitoring of your profile for 30 days',
        'Trust score assessment',
        'Direct communication with experts',
        'Priority support',
        '2 profile verifications'
      ]
    };
    return features[packageId] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-12" data-testid="pricing-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-testid="pricing-title">
            Choose Your Verification Plan
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Select the package that best fits your needs. All plans include our A.I. powered analysis to help you verify dating profiles safely.
          </p>
        </div>

        {/* User Credits Info */}
        {isAuthenticated && (
          <Card className="mb-8 bg-zinc-900/50 border-zinc-800" data-testid="user-credits-info">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Your Current Credits</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">{totalCredits}</span>
                      <span className="text-zinc-500 text-sm">available</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
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
                  
                  {totalCredits > 0 && (
                    <Link to="/analyze">
                      <Button className="bg-purple-600 hover:bg-purple-500 text-white" data-testid="go-analyze-btn">
                        Profile Submission
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Banner for non-authenticated */}
        {!isAuthenticated && (
          <Card className="mb-8 bg-purple-950/30 border-purple-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-purple-400" />
                <p className="text-purple-300">
                  <Link to="/login" className="underline hover:text-purple-200">Sign in</Link> or <Link to="/register" className="underline hover:text-purple-200">create an account</Link> to purchase a verification plan
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => {
            const isPopular = pkg.id === 'comprehensive';
            const features = getFeatures(pkg.id);
            const IconComponent = pkg.id === 'basic' ? Shield : pkg.id === 'comprehensive' ? Zap : Crown;
            const colorClass = pkg.id === 'basic' ? 'cyan' : pkg.id === 'comprehensive' ? 'teal' : 'amber';

            return (
              <Card 
                key={pkg.id}
                className={`relative bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 ${isPopular ? 'ring-2 ring-teal-500/50 md:scale-105' : ''}`}
                data-testid={`package-${pkg.id}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-teal-500 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className={`w-16 h-16 rounded-2xl bg-${colorClass}-950/50 flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className={`w-8 h-8 text-${colorClass}-400`} />
                  </div>
                  <CardTitle className="text-2xl text-white">{pkg.name}</CardTitle>
                  <CardDescription className="text-zinc-400">
                    {pkg.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    <span className="text-5xl font-bold text-white">€{pkg.amount}</span>
                    <span className="text-zinc-400 ml-2">
                      / {pkg.profiles_included > 1 ? `${pkg.profiles_included} profiles` : 'profile'}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 text-${colorClass}-400 flex-shrink-0 mt-0.5`} />
                        <span className="text-zinc-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={processingPackage === pkg.id || !isAuthenticated}
                    className={`w-full py-6 ${
                      isPopular 
                        ? 'bg-teal-600 hover:bg-teal-500' 
                        : pkg.id === 'basic' 
                          ? 'bg-purple-600 hover:bg-purple-500'
                          : 'bg-amber-600 hover:bg-amber-500'
                    } text-white disabled:opacity-50`}
                    data-testid={`buy-${pkg.id}`}
                  >
                    {processingPackage === pkg.id ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Redirecting to Stripe...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        {isAuthenticated ? 'Buy Now' : 'Login to Purchase'}
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-16 text-center">
          <p className="text-zinc-500 mb-6">Secure payments powered by</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2 text-zinc-400">
              <Shield className="w-5 h-5" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <CreditCard className="w-5 h-5" />
              <span>Stripe Payments</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Lock className="w-5 h-5" />
              <span>PCI Compliant</span>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl bg-zinc-900/30 border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-400 font-bold text-xl">1</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Choose a Plan</h3>
              <p className="text-zinc-400 text-sm">Select the verification package that fits your needs</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-zinc-900/30 border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-teal-400 font-bold text-xl">2</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Secure Payment</h3>
              <p className="text-zinc-400 text-sm">Pay securely via Stripe and receive your credits instantly</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-zinc-900/30 border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-amber-400 font-bold text-xl">3</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Submit Profiles</h3>
              <p className="text-zinc-400 text-sm">Submit profiles for AI-powered verification and get detailed reports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
