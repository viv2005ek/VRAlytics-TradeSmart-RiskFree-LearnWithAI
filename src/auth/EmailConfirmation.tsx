import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Mail, Loader2, Sparkles, Zap, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailConfirmationProps {
  onComplete: () => void;
}

export const EmailConfirmation: React.FC<EmailConfirmationProps> = ({ onComplete }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  useEffect(() => {
    const confirmEmail = async () => {
      console.log('Starting email confirmation process...');
      console.log('Current URL:', window.location.href);
      
      try {
        // Parse hash parameters (Supabase uses hash fragments)
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        
        // Parse query parameters as fallback
        const queryParams = new URLSearchParams(window.location.search);
        
        // Get tokens from either source
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const type = hashParams.get('type') || queryParams.get('type');
        
        console.log('Email confirmation tokens:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
          hashParams: Object.fromEntries(hashParams.entries()),
          queryParams: Object.fromEntries(queryParams.entries())
        });
        
        if (accessToken) {
          console.log('Setting session for email confirmation...');
          
          // Set the session with the confirmation tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (error) {
            console.error('Session setup error:', error);
            setStatus('error');
            setMessage('Failed to confirm email. The link may be expired or invalid.');
          } else {
            console.log('Session established successfully:', data);
            
            // Check if the user's email is now confirmed
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
              console.error('User fetch error:', userError);
              setStatus('error');
              setMessage('Failed to verify email confirmation status.');
            } else if (user?.email_confirmed_at) {
              console.log('Email confirmed successfully');
              setStatus('success');
              setMessage('Your email has been successfully confirmed!');
              
              // Redirect to login after 3 seconds
              setTimeout(() => {
                onComplete();
              }, 3000);
            } else {
              console.log('Email not yet confirmed');
              setStatus('error');
              setMessage('Email confirmation is still pending. Please check your email again.');
            }
          }
        } else {
          console.log('No access token found');
          setStatus('error');
          setMessage('Invalid confirmation link. Please check your email and try again.');
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during email confirmation.');
      } finally {
        setInitializing(false);
      }
    };

    // Small delay to ensure component is mounted
    const timer = setTimeout(confirmEmail, 500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'emerald';
      case 'error':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-10 h-10 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-10 h-10 text-red-400" />;
      default:
        return <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Email Confirmed!';
      case 'error':
        return 'Confirmation Failed';
      default:
        return 'Confirming Email...';
    }
  };

  const colorClass = getStatusColor();

  // Show loading while initializing
  if (initializing && status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-blue-300">Processing confirmation link...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-gradient-to-br from-black via-${colorClass}-950 to-black relative overflow-hidden`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className={`absolute top-20 left-20 w-72 h-72 bg-${colorClass}-500/15 rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute bottom-20 right-20 w-96 h-96 bg-${colorClass}-400/15 rounded-full blur-3xl animate-pulse delay-1000`}></div>
        <div className={`absolute top-1/2 left-1/2 w-64 h-64 bg-${colorClass}-400/15 rounded-full blur-3xl animate-pulse delay-2000`}></div>
        <div className={`absolute top-40 right-40 w-48 h-48 bg-${colorClass}-500/10 rounded-full blur-3xl animate-pulse delay-500`}></div>
        
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        ></div>

        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => {
            const icons = [Mail, Sparkles, Zap, Star];
            const IconComponent = icons[i % icons.length];
            return (
              <div
                key={i}
                className="absolute animate-float"
                style={{
                  left: `${20 + (i * 12)}%`,
                  top: `${10 + (i * 12)}%`,
                  animationDelay: `${i * 0.4}s`,
                  transform: `translateZ(${i * 12}px) rotateY(${mousePosition.x * 0.1}deg) rotateX(${mousePosition.y * 0.1}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
              >
                <IconComponent 
                  className={`w-7 h-7 text-${colorClass}-400/20 transform rotate-${i * 60}`}
                  style={{
                    filter: `drop-shadow(0 0 12px rgba(59, 130, 246, 0.2))`
                  }}
                />
              </div>
            );
          })}
        </div>

        <div
          className={`absolute w-96 h-96 bg-gradient-radial from-${colorClass}-500/5 to-transparent rounded-full pointer-events-none transition-all duration-300 ease-out`}
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        ></div>

        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-${colorClass}-400/15 rounded-full animate-particle`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div 
            className={`backdrop-blur-xl bg-black/20 border border-${colorClass}-400/20 rounded-3xl shadow-2xl p-8 text-center transform transition-all duration-300 hover:scale-105 hover:bg-black/30`}
            style={{
              boxShadow: `
                0 8px 32px 0 rgba(0, 0, 0, 0.6),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
                0 0 0 1px rgba(255, 255, 255, 0.02)
              `,
              transform: `perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg)`,
            }}
          >
            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-${colorClass}-500/10 to-${colorClass}-500/10 backdrop-blur-sm rounded-2xl mb-6 transform transition-all duration-300 hover:scale-110 hover:rotate-12 border border-${colorClass}-400/20`}>
              {getStatusIcon()}
            </div>

            {/* Title */}
            <h1 className={`text-3xl font-bold text-white mb-4 bg-gradient-to-r from-${colorClass}-400 to-${colorClass}-400 bg-clip-text text-transparent`}>
              {getStatusTitle()}
            </h1>

            {/* Message */}
            <p className="text-gray-300 mb-6">
              {message}
            </p>

            {/* Action Button */}
            {status !== 'loading' && (
              <button
                onClick={onComplete}
                className={`w-full bg-gradient-to-r from-${colorClass}-600 to-${colorClass}-600 text-white py-4 px-6 rounded-xl font-medium hover:from-${colorClass}-700 hover:to-${colorClass}-700 focus:outline-none focus:ring-2 focus:ring-${colorClass}-500/50 transition-all duration-300 transform hover:scale-105`}
              >
                {status === 'success' ? 'Continue to Login' : 'Back to Login'}
              </button>
            )}

            {/* Loading indicator for success state */}
            {status === 'success' && (
              <p className="text-sm text-gray-400 mt-4">
                Redirecting to login in a few seconds...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(180deg); }
        }
        @keyframes particle {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        .animate-float {
          animation: float 4.5s ease-in-out infinite;
        }
        .animate-particle {
          animation: particle 12s linear infinite;
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};