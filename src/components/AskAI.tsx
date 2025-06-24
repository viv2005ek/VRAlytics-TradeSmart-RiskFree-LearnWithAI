import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Mic, 
  Video, 
  Send,
  Sparkles, 
  Zap, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Lock, 
  CreditCard, 
  RefreshCw, 
  HelpCircle,
  Brain,
  Headphones,
  Hexagon,
  Triangle,
  Circle,
  Square,
  Info,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { NavBar } from './NavBar';
import { UserPortfolio } from '../lib/database';
import { LoadingScreen } from './LoadingScreen';
import { NeuroNushka } from './NeuroNushka';
import { RishikaVox } from './RishikaVox';
import { VivekQuant } from './VivekQuant';

// Import RevenueCat service and products
import { revenueCatService, PRODUCTS, SUBSCRIPTION_TIERS } from '../lib/revenuecat';

interface AskAIProps {
  onBack: () => void;
  portfolio?: UserPortfolio | null;
}

interface AIAssistant {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  type: 'text' | 'voice' | 'video';
}

export const AskAI: React.FC<AskAIProps> = ({ onBack, portfolio }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [activePlan, setActivePlan] = useState<string>('free');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setpurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const appUserId = useRef<string>('');

  // Initialize RevenueCat only once when the component mounts
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        if (user) {
          setLoading(true);
          
          // Generate consistent appUserId
          appUserId.current = user.id;
          localStorage.setItem('revenueCatAppUserId', user.id);
          
          // Initialize RevenueCat with user ID
          await revenueCatService.initialize(user.id);
          
          // Get customer info
          const customerInfo = await revenueCatService.refreshCustomerInfo();
          
          // Set active plan based on entitlements
          setActivePlan(revenueCatService.getActiveSubscriptionTier());
          
          if (import.meta.env.DEV) {
            console.log('Current subscription tier:', revenueCatService.getActiveSubscriptionTier());
            console.log('Customer info:', customerInfo);
          }
        }
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
      } finally {
        setInitializing(false);
        setLoading(false);
      }
    };

    initRevenueCat();
    
    // No periodic checks to prevent reloading
  }, [user]);

  const checkUserHasProduct = async (productId: string): Promise<boolean> => {
    try {
      // Refresh customer info to get latest data
      await revenueCatService.refreshCustomerInfo();
      
      // Check if user has this product
      return await revenueCatService.hasProduct(productId);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error checking product ownership:', error);
      }
      return false;
    }
  };

  const handlePurchase = async (planId: string) => {
    if (!user) return;
    
    try {
      setPurchaseLoading(true);
      setpurchaseError(null);
      
      // Check if user already has this product
      const productId = planId === 'pro' ? PRODUCTS.PRO_MONTHLY.id : PRODUCTS.SUPER_PRO.id;
      const hasProduct = await checkUserHasProduct(productId);
      
      if (hasProduct) {
        setpurchaseError('You already have an active subscription to this plan.');
        setPurchaseLoading(false);
        return;
      }
      
      // Get offerings
      const offerings = await revenueCatService.getOfferings();
      
      if (!offerings.current) {
        throw new Error('No offerings available');
      }
      
      // Find the package for the selected plan
      let packageToPurchase;
      if (planId === 'pro') {
        packageToPurchase = offerings.current.monthly;
      } else if (planId === 'super_pro') {
        packageToPurchase = offerings.current.annual;
      }
      
      if (!packageToPurchase) {
        throw new Error('Selected package not available');
      }
      
      // Make the purchase
      const { customerInfo } = await revenueCatService.purchasePackage(packageToPurchase);
      
      // Update active plan
      setActivePlan(revenueCatService.getActiveSubscriptionTier());
      
      setPurchaseSuccess(true);
      setTimeout(() => {
        setShowSubscriptionModal(false);
        setPurchaseSuccess(false);
      }, 2000);
      
    } catch (error: any) {
      if (error.message === 'You already have an active subscription to this product') {
        setpurchaseError('You already have an active subscription to this plan.');
      } else {
        setpurchaseError(error.message || 'Failed to complete purchase');
      }
      
      if (import.meta.env.DEV) {
        console.error('Purchase error:', error);
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  const initiatePurchase = () => {
    const purchaseUrl = `${revenueCatService.BASE_PURCHASE_URL}/${appUserId.current}`;
    window.open(purchaseUrl, '_blank');
  };

  const plans = [
    {
      name: 'Free',
      textPrompts: '3 prompts',
      voiceCalls: '2 calls (5 min)',
      videoCalls: '1 call (5 min)',
      price: '$0',
      color: 'blue',
      buttonText: 'Current Plan',
      isActive: activePlan === 'free'
    },
    {
      name: 'Pro',
      textPrompts: 'Unlimited',
      voiceCalls: '10 calls (20 min)',
      videoCalls: '5 calls (20 min)',
      price: '$10',
      color: 'purple',
      buttonText: activePlan === 'pro' ? 'Current Plan' : 'Upgrade',
      isActive: activePlan === 'pro',
      productId: PRODUCTS.PRO_MONTHLY.id,
      isFreeFirstMonth: true
    },
    {
      name: 'Super Pro',
      textPrompts: 'Unlimited',
      voiceCalls: 'Unlimited',
      videoCalls: 'Unlimited',
      price: '$20',
      color: 'green',
      buttonText: activePlan === 'super_pro' ? 'Current Plan' : 'Upgrade',
      isActive: activePlan === 'super_pro',
      productId: PRODUCTS.SUPER_PRO.id
    }
  ];

  const assistants: AIAssistant[] = [
    {
      id: 'neuronushka',
      name: 'NeuroNushka',
      description: 'AI-powered text chat for instant stock market insights, analysis, and trade recommendations.',
      icon: Brain,
      color: 'orange',
      type: 'text'
    },
    {
      id: 'rishikavox',
      name: 'RishikaVox',
      description: 'Voice call assistant that discusses stock trends, portfolio strategies, and real-time market updates.',
      icon: Headphones,
      color: 'pink',
      type: 'voice'
    },
    {
      id: 'vivekquant',
      name: 'VivekQuant',
      description: 'Video call expert providing live stock analysis and personalized investment advice.',
      icon: Video,
      color: 'green',
      type: 'video'
    }
  ];

  const handleAssistantClick = (assistantId: string) => {
    setSelectedAssistant(assistantId);
  };

  const handleBackFromAssistant = () => {
    setSelectedAssistant(null);
  };

  if (loading) {
    return <LoadingScreen message="Loading AI assistants..." />;
  }

  // Render selected assistant page
  if (selectedAssistant === 'neuronushka') {
    return <NeuroNushka onBack={handleBackFromAssistant} portfolio={portfolio} />;
  }

  if (selectedAssistant === 'rishikavox') {
    return <RishikaVox onBack={handleBackFromAssistant} portfolio={portfolio} />;
  }

  if (selectedAssistant === 'vivekquant') {
    return <VivekQuant onBack={handleBackFromAssistant} portfolio={portfolio} />;
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, #131720 0%, #0D1117 50%, #131720 100%),
          radial-gradient(ellipse at center, rgba(255, 255, 255, 0.02) 0%, transparent 70%)
        `,
        backgroundAttachment: 'fixed'
      }}
    >
      {/* NavBar Component */}
      <NavBar 
        currentPage="ai"
        onNavigate={(page) => {
          if (page === 'dashboard') {
            onBack();
          } else{
            onBack();
          }
        }}
        portfolio={portfolio}
      />

      {/* Fixed Background Objects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Glowing Orbs */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 80 + 10}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${8 + Math.random() * 6}s`,
            }}
          >
            <div 
              className="glowing-orb"
              style={{
                width: `${8 + Math.random() * 16}px`,
                height: `${8 + Math.random() * 16}px`,
                background: `radial-gradient(circle, 
                  rgba(${i % 3 === 0 ? '59, 130, 246' : i % 3 === 1 ? '147, 51, 234' : '6, 182, 212'}, 0.8) 0%, 
                  rgba(${i % 3 === 0 ? '59, 130, 246' : i % 3 === 1 ? '147, 51, 234' : '6, 182, 212'}, 0.3) 50%,
                  transparent 100%)`,
                borderRadius: '50%',
                filter: `blur(${1 + Math.random() * 2}px)`,
                boxShadow: `
                  0 0 ${12 + Math.random() * 16}px rgba(${i % 3 === 0 ? '59, 130, 246' : i % 3 === 1 ? '147, 51, 234' : '6, 182, 212'}, 0.6),
                  0 0 ${20 + Math.random() * 24}px rgba(${i % 3 === 0 ? '59, 130, 246' : i % 3 === 1 ? '147, 51, 234' : '6, 182, 212'}, 0.3)
                `,
                animation: `orb-pulse ${3 + Math.random() * 4}s ease-in-out infinite`,
              }}
            />
          </div>
        ))}

        {/* Floating Shapes */}
        {[...Array(12)].map((_, i) => {
          const shapes = [Hexagon, Triangle, Circle, Square];
          const ShapeComponent = shapes[i % shapes.length];
          return (
            <div
              key={`shape-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 90 + 5}%`,
                top: `${Math.random() * 80 + 10}%`,
                opacity: 0.15,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              <ShapeComponent 
                className={`w-${4 + (i % 4) * 2} h-${4 + (i % 4) * 2} text-${
                  i % 3 === 0 ? 'blue' : i % 3 === 1 ? 'purple' : 'cyan'
                }-400`}
              />
            </div>
          );
        })}

        {/* Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        ></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            AskAI Premium Access
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Enhance your trading experience with AI-powered insights, analysis, and assistance
          </p>
          <div className="mt-4 inline-block px-6 py-2 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full border border-blue-500/30">
            <span className="text-white font-medium">Current Plan: </span>
            <span className={`font-bold ${
              activePlan === 'super_pro' ? 'text-green-400' : 
              activePlan === 'pro' ? 'text-purple-400' : 
              'text-blue-400'
            }`}>
              {activePlan === 'super_pro' ? 'Super Pro' : 
               activePlan === 'pro' ? 'Pro' : 
               'Free'}
            </span>
          </div>
        </div>

        {/* AI Assistants Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center justify-center">
            <Bot className="w-6 h-6 mr-3 text-purple-400" />
            Meet Your AI Assistants
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {assistants.map((assistant) => (
              <div 
                key={assistant.id}
                className={`backdrop-blur-xl bg-black/20 border border-${assistant.color}-500/30 rounded-2xl p-6 hover:bg-black/30 transition-all duration-300 transform hover:scale-105 hover:border-${assistant.color}-500/50 hover:shadow-lg hover:shadow-${assistant.color}-500/20 cursor-pointer`}
                style={{
                  boxShadow: `
                    0 8px 32px 0 rgba(0, 0, 0, 0.6),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
                    0 0 0 1px rgba(255, 255, 255, 0.02)
                  `
                }}
                onClick={() => handleAssistantClick(assistant.id)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br from-${assistant.color}-500/20 to-${assistant.color}-600/20 rounded-2xl flex items-center justify-center mb-6 border border-${assistant.color}-500/30`}>
                    <assistant.icon className={`w-10 h-10 text-${assistant.color}-400`} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{assistant.name}</h3>
                  <p className={`text-${assistant.color}-300 text-sm mb-2`}>
                    ({assistant.type.charAt(0).toUpperCase() + assistant.type.slice(1)} Specialist)
                  </p>
                  <p className="text-gray-400 mb-6 h-20">
                    "{assistant.description}"
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-4 text-yellow-300">
            <p>Super Pro for new users is free for trial, please enjoy</p>
          </div>
        </section>

        {/* Subscription Plans Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center justify-center">
            <CreditCard className="w-6 h-6 mr-3 text-green-400" />
            Subscription Plans (Monthly)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full backdrop-blur-xl bg-black/20 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="px-6 py-4 text-left text-white">Plan</th>
                  <th className="px-6 py-4 text-left text-white">Text</th>
                  <th className="px-6 py-4 text-left text-white">Voice Calls</th>
                  <th className="px-6 py-4 text-left text-white">Video Calls</th>
                  <th className="px-6 py-4 text-left text-white">Price</th>
                  <th className="px-6 py-4 text-left text-white">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {plans.map((plan) => (
                  <tr key={plan.name} className={`${plan.isActive ? `bg-${plan.color}-900/20` : ''} hover:bg-white/5 transition-colors`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${plan.color}-500/30 to-${plan.color}-600/30 flex items-center justify-center mr-3 border border-${plan.color}-500/30`}>
                          {plan.isActive && <CheckCircle className={`w-5 h-5 text-${plan.color}-400`} />}
                          {!plan.isActive && <span className={`text-${plan.color}-400 font-bold`}>{plan.name.charAt(0)}</span>}
                        </div>
                        <span className={`font-medium ${plan.isActive ? `text-${plan.color}-400` : 'text-white'}`}>
                          {plan.name}
                          {plan.isFreeFirstMonth && !plan.isActive && (
                            <span className="ml-2 text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full">First month free!</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{plan.textPrompts}</td>
                    <td className="px-6 py-4 text-gray-300">{plan.voiceCalls}</td>
                    <td className="px-6 py-4 text-gray-300">{plan.videoCalls}</td>
                    <td className="px-6 py-4 text-gray-300">{plan.price}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => initiatePurchase()}
                        disabled={plan.isActive || plan.name === 'Free' || (plan.name === 'Pro' && activePlan === 'super_pro')}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          plan.isActive 
                            ? `bg-${plan.color}-500/20 text-${plan.color}-400 border border-${plan.color}-500/30` 
                            : 'bg-black/30 text-white hover:bg-white/10 border border-white/20'
                        } transition-all duration-300 ${plan.isActive ? '' : 'hover:scale-105'}`}
                      >
                        {plan.isActive ? (
                          <span className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Current Plan
                          </span>
                        ) : plan.name === 'Free' ? (
                          'Default'
                        ) : (activePlan === 'super_pro' && plan.name === 'Pro') ? (
                          'Lower Tier'
                        ) : (
                          'Upgrade'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Sandbox Mode Notice */}
          <div className="mt-8 backdrop-blur-xl bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center">
              <Info className="w-5 h-5 text-purple-400 mr-2" />
              <p className="text-purple-300">
                <span className="font-bold">TEST MODE:</span> This is a sandbox environment. For testing, use card number <span className="font-mono bg-black/30 px-2 py-1 rounded">4242 4242 4242 4242</span> with any future expiry date and CVC.
              </p>
            </div>
          </div>
        </section>

        {/* Subscription Management Section - Simplified */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 mr-3 text-yellow-400" />
            Need Help?
          </h2>

          <div className="backdrop-blur-xl bg-black/20 border border-white/20 rounded-2xl p-6 hover:bg-black/30 transition-all duration-300">
            <div className="space-y-0">
             
              
          <p className="text-center text-gray-300 dark:text-gray-200 text-sm font-medium tracking-wide ">
  Check your mail by <span className="text-indigo-400">VRAlytics</span> to manage subscription
</p>

            </div>
          </div>
        </section>
      </main>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-white/20 p-6">
            {purchaseSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Purchase Successful</h3>
                <p className="text-gray-300 mb-6">
                  Your subscription has been activated successfully!
                </p>
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
                >
                  Continue
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  {selectedPlan === 'pro' ? 'Upgrade to Pro' : 'Upgrade to Super Pro'}
                </h3>
                
                <div className="space-y-6 mb-6">
                  <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                    <h4 className="text-lg font-medium text-white mb-2">
                      {selectedPlan === 'pro' ? 'Pro Plan' : 'Super Pro Plan'}
                    </h4>
                    <p className="text-gray-300 mb-4">
                      {selectedPlan === 'pro' 
                        ? 'Unlimited text prompts, 10 voice calls (20 min), 5 video calls (20 min)'
                        : 'Unlimited text prompts, voice calls, and video calls'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-2xl font-bold text-white">
                        {selectedPlan === 'pro' ? '$10' : '$20'} <span className="text-sm text-gray-400">/month</span>
                        {selectedPlan === 'pro' && (
                          <span className="ml-2 text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full">First month free!</span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {purchaseError && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p>{purchaseError}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={() => initiatePurchase()}
                    disabled={purchaseLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {purchaseLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Complete Purchase
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowSubscriptionModal(false)}
                    disabled={purchaseLoading}
                    className="w-full py-3 px-4 bg-black/30 border border-white/20 text-white rounded-xl font-medium hover:bg-black/50 hover:border-white/30 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Background Animation Styles */}
      <style jsx>{`
        @keyframes orb-pulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.6;
          }
          50% { 
            transform: scale(1.4); 
            opacity: 1;
          }
        }

        .glowing-orb {
          will-change: transform, opacity;
          backface-visibility: hidden;
          animation: orb-pulse 4s ease-in-out infinite;
        }

        /* Ensure fixed background attachment works properly */
        body {
          background-attachment: fixed;
        }
      `}</style>
    </div>
  );
};