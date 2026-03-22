import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  CheckCircle, 
  Loader2,
  ArrowRight,
  CreditCard,
  Coins
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { getAuthHeaders, refreshUser, user } = useAuth();
  const [status, setStatus] = useState('checking');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10;

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId) => {
    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(
        `${API}/checkout/status/${sessionId}`,
        getAuthHeaders()
      );

      const data = response.data;

      if (data.payment_status === 'paid') {
        setPaymentInfo(data);
        setStatus('success');
        
        // Refresh user data to update credits
        await refreshUser();
        
        toast.success('Payment successful! Credits added to your account.');
        return;
      } else if (data.status === 'expired') {
        setStatus('expired');
        return;
      }

      // Continue polling
      setAttempts(prev => prev + 1);
      setTimeout(() => pollPaymentStatus(sessionId), 2000);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setAttempts(prev => prev + 1);
      setTimeout(() => pollPaymentStatus(sessionId), 2000);
    }
  };

  // Calculate total credits (paid credits only)
  const totalCredits = user 
    ? (user.basic_credits || 0) + (user.comprehensive_credits || 0) + (user.premium_credits || 0)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-12 flex items-center justify-center" data-testid="payment-success-page">
      <div className="max-w-md mx-auto px-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-8 text-center">
            {status === 'checking' && (
              <div>
                <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-white mb-2">Processing Payment</h1>
                <p className="text-zinc-400">Please wait while we confirm your payment...</p>
              </div>
            )}

            {status === 'success' && paymentInfo && (
              <div>
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
                <p className="text-zinc-400 mb-6">
                  Thank you for your purchase. Your credits have been added.
                </p>
                
                <div className="bg-zinc-800/50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-400">Package</span>
                    <span className="text-white font-medium">{paymentInfo.package_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Amount Paid</span>
                    <span className="text-white font-medium">
                      €{paymentInfo.amount} {paymentInfo.currency.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Credits Display */}
                <div className="bg-purple-950/30 border border-purple-800/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-purple-400" />
                    <span className="text-purple-300 font-medium">Your Credits</span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-2">{totalCredits}</p>
                  <div className="flex justify-center gap-2 flex-wrap">
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
                  </div>
                </div>

                <div className="space-y-3">
                  <Link to="/analyze" className="block">
                    <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white py-6" data-testid="start-analysis-btn">
                      Start Analyzing Profiles
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/dashboard" className="block">
                    <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {status === 'timeout' && (
              <div>
                <Loader2 className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-white mb-2">Payment Processing</h1>
                <p className="text-zinc-400 mb-6">
                  Your payment is being processed. Please check your email for confirmation or try refreshing the page.
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Refresh Page
                </Button>
              </div>
            )}

            {status === 'expired' && (
              <div>
                <CreditCard className="w-16 h-16 text-red-400 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-white mb-2">Session Expired</h1>
                <p className="text-zinc-400 mb-6">
                  Your payment session has expired. Please try again.
                </p>
                <Link to="/pricing">
                  <Button className="bg-purple-600 hover:bg-purple-500 text-white">
                    Back to Pricing
                  </Button>
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div>
                <CreditCard className="w-16 h-16 text-red-400 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
                <p className="text-zinc-400 mb-6">
                  Unable to verify your payment. Please contact support if you were charged.
                </p>
                <Link to="/pricing">
                  <Button className="bg-purple-600 hover:bg-purple-500 text-white">
                    Back to Pricing
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-12 flex items-center justify-center" data-testid="payment-cancel-page">
      <div className="max-w-md mx-auto px-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-8 text-center">
            <CreditCard className="w-16 h-16 text-zinc-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
            <p className="text-zinc-400 mb-6">
              Your payment was cancelled. No charges were made to your account.
            </p>
            <div className="space-y-3">
              <Link to="/pricing" className="block">
                <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white">
                  Back to Pricing
                </Button>
              </Link>
              <Link to="/dashboard" className="block">
                <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
