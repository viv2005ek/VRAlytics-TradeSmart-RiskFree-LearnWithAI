import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, Login, Signup, ForgotPassword, ResetPasswordConfirm, EmailConfirmation } from './auth';
import { Dashboard } from './components/Dashboard';
import { ProfileSetup } from './components/ProfileSetup';
import { LoadingScreen } from './components/LoadingScreen';
import { profileService } from './lib/supabase';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'email-confirmation';

const AuthWrapper: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward' | 'modal'>('forward');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const { user, loading } = useAuth();

  // Check URL parameters on component mount to determine initial mode
  useEffect(() => {
    const parseHashParams = () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      return params;
    };

    const parseQueryParams = () => {
      return new URLSearchParams(window.location.search);
    };

    // Try hash parameters first (Supabase uses these), then query parameters
    const hashParams = parseHashParams();
    const queryParams = parseQueryParams();
    
    const type = hashParams.get('type') || queryParams.get('type');
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
    
    console.log('URL Parameters:', { type, accessToken: !!accessToken });
    
    if (type === 'recovery' && accessToken) {
      console.log('Detected password recovery flow');
      setAuthMode('reset-password');
    } else if (type === 'signup' || accessToken) {
      console.log('Detected email confirmation flow');
      setAuthMode('email-confirmation');
    }
  }, []);

  // Check profile completion when user is authenticated
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        const profile = await profileService.getProfile(user.id);
        
        if (!profile) {
          console.log('No profile found, showing profile setup');
          setShowProfileSetup(true);
        } else if (!profile.profile_completed) {
          console.log('Profile incomplete, showing profile setup');
          setShowProfileSetup(true);
        } else {
          console.log('Profile complete, showing dashboard');
          setShowProfileSetup(false);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // If there's an error, assume profile setup is needed
        setShowProfileSetup(true);
      } finally {
        setProfileLoading(false);
      }
    };

    checkProfileCompletion();
  }, [user]);

  const handleModeChange = (newMode: AuthMode) => {
    if (newMode === authMode || isTransitioning) return;
    
    // Determine transition direction for parallax effect
    if (authMode === 'login' && newMode === 'signup') {
      setTransitionDirection('forward');
    } else if (authMode === 'signup' && newMode === 'login') {
      setTransitionDirection('backward');
    } else if (authMode === 'login' && newMode === 'forgot-password') {
      setTransitionDirection('modal');
    } else if (authMode === 'forgot-password' && newMode === 'login') {
      setTransitionDirection('backward');
    } else {
      setTransitionDirection('forward');
    }
    
    setIsTransitioning(true);
    
    // Wait for exit animation to complete before changing mode
    setTimeout(() => {
      setAuthMode(newMode);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 600);
  };

  const handleAuthComplete = () => {
    // Clear URL parameters and redirect to login
    window.history.replaceState({}, document.title, window.location.pathname);
    setAuthMode('login');
  };

  const handleProfileComplete = () => {
    setShowProfileSetup(false);
  };

  if (loading || profileLoading) {
    return <LoadingScreen message="Initializing VRAlytics..." />;
  }

  if (user && authMode !== 'reset-password' && authMode !== 'email-confirmation') {
    if (showProfileSetup) {
      return <ProfileSetup onComplete={handleProfileComplete} />;
    }
    return <Dashboard />;
  }

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Parallax Background Layers */}
      <div className="fixed inset-0 perspective-1000">
        {/* Layer 1 - Deepest background */}
        <div 
          className={`absolute inset-0 transition-transform duration-700 ease-out ${
            isTransitioning 
              ? transitionDirection === 'forward' 
                ? 'transform translate-x-[-20%] scale-110' 
                : transitionDirection === 'backward'
                ? 'transform translate-x-[20%] scale-110'
                : 'transform translate-y-[-10%] scale-105'
              : 'transform translate-x-0 scale-100'
          }`}
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(-200px) scale(1.2)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Layer 2 - Mid background */}
        <div 
          className={`absolute inset-0 transition-transform duration-600 ease-out ${
            isTransitioning 
              ? transitionDirection === 'forward' 
                ? 'transform translate-x-[-40%] scale-120' 
                : transitionDirection === 'backward'
                ? 'transform translate-x-[40%] scale-120'
                : 'transform translate-y-[-20%] scale-110'
              : 'transform translate-x-0 scale-100'
          }`}
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(-100px) scale(1.1)' }}
        >
          <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500/8 rounded-full blur-2xl animate-pulse delay-500"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-500/8 rounded-full blur-2xl animate-pulse delay-1500"></div>
        </div>

        {/* Layer 3 - Foreground particles */}
        <div 
          className={`absolute inset-0 transition-transform duration-500 ease-out ${
            isTransitioning 
              ? transitionDirection === 'forward' 
                ? 'transform translate-x-[-60%] scale-130' 
                : transitionDirection === 'backward'
                ? 'transform translate-x-[60%] scale-130'
                : 'transform translate-y-[-30%] scale-115'
              : 'transform translate-x-0 scale-100'
          }`}
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(-50px) scale(1.05)' }}
        >
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/10 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Page Content Container with Depth Zoom Effect */}
      <div 
        className={`relative z-10 transition-all duration-700 ease-out ${
          isTransitioning 
            ? 'transform scale-75 opacity-0 blur-sm' 
            : 'transform scale-100 opacity-100 blur-0'
        }`}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isTransitioning 
            ? transitionDirection === 'forward'
              ? 'translateZ(-300px) rotateY(-15deg) scale(0.7)'
              : transitionDirection === 'backward'
              ? 'translateZ(-300px) rotateY(15deg) scale(0.7)'
              : 'translateZ(-200px) rotateX(-10deg) scale(0.8)'
            : 'translateZ(0) rotateY(0deg) rotateX(0deg) scale(1)'
        }}
      >
        {/* Page Transition Container */}
        <div 
          className={`transition-all duration-700 ease-out ${
            isTransitioning 
              ? 'opacity-0 scale-90' 
              : 'opacity-100 scale-100'
          }`}
        >
          {authMode === 'signup' && (
            <div 
              className={`${!isTransitioning ? 'animate-depth-zoom-in' : ''}`}
              style={{ 
                transformStyle: 'preserve-3d',
                animation: !isTransitioning ? 'depthZoomIn 0.8s ease-out' : 'none'
              }}
            >
              <Signup 
                onToggleMode={() => handleModeChange('login')} 
              />
            </div>
          )}
          
          {authMode === 'forgot-password' && (
            <div 
              className={`${!isTransitioning ? 'animate-depth-zoom-in' : ''}`}
              style={{ 
                transformStyle: 'preserve-3d',
                animation: !isTransitioning ? 'depthZoomIn 0.8s ease-out' : 'none'
              }}
            >
              <ForgotPassword 
                onBack={() => handleModeChange('login')} 
              />
            </div>
          )}

          {authMode === 'reset-password' && (
            <div 
              className={`${!isTransitioning ? 'animate-depth-zoom-in' : ''}`}
              style={{ 
                transformStyle: 'preserve-3d',
                animation: !isTransitioning ? 'depthZoomIn 0.8s ease-out' : 'none'
              }}
            >
              <ResetPasswordConfirm 
                onComplete={handleAuthComplete} 
              />
            </div>
          )}

          {authMode === 'email-confirmation' && (
            <div 
              className={`${!isTransitioning ? 'animate-depth-zoom-in' : ''}`}
              style={{ 
                transformStyle: 'preserve-3d',
                animation: !isTransitioning ? 'depthZoomIn 0.8s ease-out' : 'none'
              }}
            >
              <EmailConfirmation 
                onComplete={handleAuthComplete} 
              />
            </div>
          )}
          
          {authMode === 'login' && (
            <div 
              className={`${!isTransitioning ? 'animate-depth-zoom-in' : ''}`}
              style={{ 
                transformStyle: 'preserve-3d',
                animation: !isTransitioning ? 'depthZoomIn 0.8s ease-out' : 'none'
              }}
            >
              <Login 
                onToggleMode={() => handleModeChange('signup')} 
                onForgotPassword={() => handleModeChange('forgot-password')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Transition Overlay for Enhanced Depth Effect */}
      <div 
        className={`fixed inset-0 z-20 pointer-events-none transition-all duration-700 ease-out ${
          isTransitioning 
            ? 'bg-black/30 backdrop-blur-sm' 
            : 'bg-transparent backdrop-blur-0'
        }`}
      ></div>

      {/* Global Parallax Transition Styles */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }

        @keyframes depthZoomIn {
          0% {
            transform: translateZ(-500px) scale(0.5) rotateY(20deg);
            opacity: 0;
            filter: blur(10px);
          }
          30% {
            opacity: 0.3;
            filter: blur(5px);
          }
          60% {
            transform: translateZ(-100px) scale(0.8) rotateY(5deg);
            opacity: 0.7;
            filter: blur(2px);
          }
          100% {
            transform: translateZ(0) scale(1) rotateY(0deg);
            opacity: 1;
            filter: blur(0px);
          }
        }

        @keyframes depthZoomOut {
          0% {
            transform: translateZ(0) scale(1) rotateY(0deg);
            opacity: 1;
            filter: blur(0px);
          }
          40% {
            transform: translateZ(-100px) scale(0.8) rotateY(-5deg);
            opacity: 0.7;
            filter: blur(2px);
          }
          70% {
            opacity: 0.3;
            filter: blur(5px);
          }
          100% {
            transform: translateZ(-500px) scale(0.5) rotateY(-20deg);
            opacity: 0;
            filter: blur(10px);
          }
        }

        @keyframes parallaxSlideLeft {
          0% {
            transform: translateX(100%) translateZ(-200px) scale(0.8);
            opacity: 0;
          }
          100% {
            transform: translateX(0) translateZ(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes parallaxSlideRight {
          0% {
            transform: translateX(-100%) translateZ(-200px) scale(0.8);
            opacity: 0;
          }
          100% {
            transform: translateX(0) translateZ(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes parallaxSlideUp {
          0% {
            transform: translateY(50px) translateZ(-150px) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: translateY(0) translateZ(0) scale(1);
            opacity: 1;
          }
        }

        /* Enhanced 3D transforms */
        .transform-3d {
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        /* Smooth hardware acceleration */
        .page-transition-container {
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }

        /* Depth layers */
        .depth-layer-1 {
          transform: translateZ(-200px) scale(1.2);
        }

        .depth-layer-2 {
          transform: translateZ(-100px) scale(1.1);
        }

        .depth-layer-3 {
          transform: translateZ(-50px) scale(1.05);
        }

        .depth-layer-content {
          transform: translateZ(0);
        }

        /* Parallax movement classes */
        .parallax-slow {
          transform: translateZ(-200px) scale(1.2);
        }

        .parallax-medium {
          transform: translateZ(-100px) scale(1.1);
        }

        .parallax-fast {
          transform: translateZ(-50px) scale(1.05);
        }

        /* Transition states */
        .transitioning-forward .parallax-slow {
          transform: translateZ(-200px) translateX(-20%) scale(1.3);
        }

        .transitioning-forward .parallax-medium {
          transform: translateZ(-100px) translateX(-40%) scale(1.2);
        }

        .transitioning-forward .parallax-fast {
          transform: translateZ(-50px) translateX(-60%) scale(1.1);
        }

        .transitioning-backward .parallax-slow {
          transform: translateZ(-200px) translateX(20%) scale(1.3);
        }

        .transitioning-backward .parallax-medium {
          transform: translateZ(-100px) translateX(40%) scale(1.2);
        }

        .transitioning-backward .parallax-fast {
          transform: translateZ(-50px) translateX(60%) scale(1.1);
        }

        .transitioning-modal .parallax-slow {
          transform: translateZ(-200px) translateY(-10%) scale(1.25);
        }

        .transitioning-modal .parallax-medium {
          transform: translateZ(-100px) translateY(-20%) scale(1.15);
        }

        .transitioning-modal .parallax-fast {
          transform: translateZ(-50px) translateY(-30%) scale(1.1);
        }
      `}</style>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}

export default App;