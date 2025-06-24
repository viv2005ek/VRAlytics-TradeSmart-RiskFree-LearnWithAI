import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowLeft, TrendingUp, Loader2, CheckCircle, Zap, Sparkles, Star } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface ForgotPasswordProps {
  onBack: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [shakeForm, setShakeForm] = useState(false);
  const [liquidFields, setLiquidFields] = useState<{ email?: boolean }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { resetPassword } = useAuth();

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const triggerValidationEffects = (fieldErrors: { email?: string; general?: string }) => {
    // Trigger form shake
    setShakeForm(true);
    
    // Trigger liquid wave effect for specific fields
    const newLiquidFields: { email?: boolean } = {};
    if (fieldErrors.email) newLiquidFields.email = true;
    setLiquidFields(newLiquidFields);

    // Vibrate device if supported
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }

    // Play subtle water splash sound (if audio context allows)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // Audio context not available or blocked
    }

    // Reset shake animation
    setTimeout(() => {
      setShakeForm(false);
    }, 600);

    // Reset liquid wave effect
    setTimeout(() => {
      setLiquidFields({});
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      triggerValidationEffects(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    // Use the base URL without any specific path since we handle routing via URL parameters
    const { error } = await resetPassword(email);

    if (error) {
      const errorObj: { general: string } = {
        general: error.message.includes('User not found')
          ? 'No account found with this email address.'
          : error.message.includes('Email rate limit exceeded')
          ? 'Too many password reset requests. Please wait before trying again.'
          : error.message
      };
      
      setErrors(errorObj);
      triggerValidationEffects(errorObj);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div 
        ref={containerRef}
        className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="backdrop-blur-xl bg-black/20 border border-white/10 rounded-3xl shadow-2xl p-8 text-center transform animate-bounce-in">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/5">
                <CheckCircle className="w-10 h-10 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Check Your Email
              </h1>
              <p className="text-gray-400 mb-6">
                We've sent a password reset link to <strong className="text-white">{email}</strong>. 
                Please check your email and follow the instructions to reset your password.
              </p>
              <button
                onClick={onBack}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-105"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-40 right-40 w-48 h-48 bg-red-500/8 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Moving Grid */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(251, 146, 60, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251, 146, 60, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        ></div>

        {/* 3D Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => {
            const icons = [Zap, Sparkles, Star, TrendingUp];
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
                  className={`w-7 h-7 text-orange-400/20 transform rotate-${i * 60}`}
                  style={{
                    filter: 'drop-shadow(0 0 12px rgba(251, 146, 60, 0.2))'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Mouse Follower */}
        <div
          className="absolute w-96 h-96 bg-gradient-radial from-orange-500/5 to-transparent rounded-full pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        ></div>

        {/* Particle System */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-orange-400/15 rounded-full animate-particle"
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
          {/* Glassmorphism Card */}
          <div 
            className={`backdrop-blur-xl bg-black/20 border border-white/10 rounded-3xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-105 hover:bg-black/30 ${
              shakeForm ? 'animate-shake-intense' : ''
            }`}
            style={{
              boxShadow: `
                0 8px 32px 0 rgba(0, 0, 0, 0.6),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
                0 0 0 1px rgba(255, 255, 255, 0.02)
              `,
              transform: `perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg)`,
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-sm rounded-2xl mb-6 transform transition-all duration-300 hover:scale-110 hover:rotate-12 border border-white/5">
                <TrendingUp className="w-10 h-10 text-orange-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Reset Password
              </h1>
              <p className="text-gray-400">Enter your email address and we'll send you a reset link</p>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl animate-error-glow">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-3"></div>
                  <p className="text-red-300 text-sm font-medium">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-orange-400 transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-12 pr-4 py-4 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:bg-black/40 transition-all duration-300 relative z-10 ${
                      errors.email 
                        ? 'border-red-500/50 bg-red-500/5' 
                        : ''
                    }`}
                    placeholder="Enter your email"
                  />
                  {/* Liquid Wave Overlay */}
                  {liquidFields.email && (
                    <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
                      <svg className="liquid-wave-svg\" viewBox="0 0 400 100\" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="liquidGradient\" x1="0%\" y1="0%\" x2="0%\" y2="100%">
                            <stop offset="0%\" stopColor="rgba(239, 68, 68, 0.8)" />
                            <stop offset="50%\" stopColor="rgba(220, 38, 38, 0.6)" />
                            <stop offset="100%\" stopColor="rgba(185, 28, 28, 0.4)" />
                          </linearGradient>
                        </defs>
                        <path 
                          className="liquid-wave-path"
                          d="M0,100 C150,80 250,120 400,100 L400,100 L0,100 Z" 
                          fill="url(#liquidGradient)"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.email && (
                  <div className="mt-2 animate-error-slide-in">
                    <p className="text-red-400 text-sm font-medium flex items-center">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-2 animate-pulse"></span>
                      {errors.email}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-4 px-6 rounded-xl font-medium hover:from-orange-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-8">
              <button
                onClick={onBack}
                className="flex items-center justify-center w-full text-gray-400 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(180deg); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.05) rotate(5deg); }
          70% { transform: scale(0.9) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes particle {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes shake-intense {
          0%, 100% { transform: translateX(0) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg); }
          10% { transform: translateX(-8px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg); }
          20% { transform: translateX(8px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg); }
          30% { transform: translateX(-6px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg); }
          40% { transform: translateX(6px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg); }
          50% { transform: translateX(-4px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg); }
          60% { transform: translateX(4px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg); }
          70% { transform: translateX(-2px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg); }
          80% { transform: translateX(2px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg); }
          90% { transform: translateX(-1px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(mousePosition.y - 50) * -0.1}deg); }
        }
        @keyframes liquid-wave {
          0% { 
            transform: translateY(100%) scaleY(0);
            opacity: 0;
          }
          20% { 
            transform: translateY(80%) scaleY(0.3);
            opacity: 0.6;
          }
          40% { 
            transform: translateY(60%) scaleY(0.6);
            opacity: 0.8;
          }
          60% { 
            transform: translateY(40%) scaleY(0.8);
            opacity: 0.9;
          }
          80% { 
            transform: translateY(20%) scaleY(0.9);
            opacity: 1;
          }
          100% { 
            transform: translateY(0%) scaleY(1);
            opacity: 1;
          }
        }
        @keyframes wave-motion {
          0% { 
            d: path("M0,100 C150,80 250,120 400,100 L400,100 L0,100 Z");
          }
          25% { 
            d: path("M0,100 C100,90 300,110 400,95 L400,100 L0,100 Z");
          }
          50% { 
            d: path("M0,100 C200,85 250,115 400,105 L400,100 L0,100 Z");
          }
          75% { 
            d: path("M0,100 C120,95 280,105 400,90 L400,100 L0,100 Z");
          }
          100% { 
            d: path("M0,100 C150,80 250,120 400,100 L400,100 L0,100 Z");
          }
        }
        @keyframes error-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.2);
          }
          50% { 
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
            border-color: rgba(239, 68, 68, 0.4);
          }
        }
        @keyframes error-slide-in {
          0% { 
            transform: translateY(-10px) translateX(-5px); 
            opacity: 0; 
          }
          50% { 
            transform: translateY(2px) translateX(2px); 
            opacity: 0.8; 
          }
          100% { 
            transform: translateY(0) translateX(0); 
            opacity: 1; 
          }
        }
        .animate-float {
          animation: float 4.5s ease-in-out infinite;
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
        .animate-particle {
          animation: particle 12s linear infinite;
        }
        .animate-shake-intense {
          animation: shake-intense 0.6s ease-in-out;
        }
        .animate-error-glow {
          animation: error-glow 2s ease-in-out infinite;
        }
        .animate-error-slide-in {
          animation: error-slide-in 0.4s ease-out;
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
        .liquid-wave-svg {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          animation: liquid-wave 1.5s ease-out forwards;
        }
        .liquid-wave-path {
          animation: wave-motion 2s ease-in-out infinite;
          transform-origin: center bottom;
        }
      `}</style>
    </div>
  );
};