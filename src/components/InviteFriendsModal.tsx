import React, { useState, useRef, useEffect } from 'react';
import { X, Gift, Mail, Send, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InviteFriendsModalProps {
  onClose: () => void;
}

const emailDomains = [
  '@gmail.com',
  '@yahoo.com', 
  '@hotmail.com',
  '@customdomain.com'
];

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('@gmail.com');
  const [customDomain, setCustomDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Modal entrance animation
    if (modalRef.current) {
      modalRef.current.style.transform = 'translateY(100px) scale(0.9)';
      modalRef.current.style.opacity = '0';
      
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.style.transition = 'all 0.3s ease-out';
          modalRef.current.style.transform = 'translateY(0) scale(1)';
          modalRef.current.style.opacity = '1';
        }
      }, 50);
    }
  }, []);

  const validateEmail = (emailToValidate: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToValidate);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError('');
    
    if (value && !validateEmail(getFullEmail(value))) {
      setEmailError('Please enter a valid email address');
    }
  };

  const getFullEmail = (emailPrefix: string) => {
    const domain = selectedDomain === '@customdomain.com' ? customDomain : selectedDomain;
    return emailPrefix + domain;
  };

  const createConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;
    }> = [];

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 2,
        life: 1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.3; // gravity
        particle.life -= 0.02;

        if (particle.life <= 0) {
          particles.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (particles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        setShowConfetti(false);
      }
    };

    animate();
  };

  const handleSendInvite = async () => {
    const fullEmail = getFullEmail(email);
    
    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(fullEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (selectedDomain === '@customdomain.com' && !customDomain) {
      setError('Please enter a custom domain');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create referral link
      const referralLink = `${window.location.origin}?ref=${user.id}`;
      
      // Send email using Supabase Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
        body: {
          to: fullEmail,
          referralLink: referralLink,
          inviterEmail: user.email
        }
      });

      if (emailError) {
        throw emailError;
      }

      setSuccess(true);
      setShowConfetti(true);
      createConfetti();

      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        {showConfetti && (
          <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[70]"
            style={{ zIndex: 70 }}
          />
        )}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div 
            ref={modalRef}
            className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-purple-400/30 p-8 text-center"
            style={{
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.8),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
                0 0 0 1px rgba(147, 51, 234, 0.2)
              `
            }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-400/30">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-purple-100 mb-4">Invite Sent!</h3>
            <p className="text-purple-200 mb-6">
              Your invitation has been sent successfully. You'll earn $1,000 V-Cash when your friend joins and completes their first trade!
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
      <div 
        ref={modalRef}
        className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full border border-purple-400/30"
        style={{
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(147, 51, 234, 0.2)
          `
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-400/20">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center mr-4 border border-purple-400/30">
              <Gift className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-purple-100">Invite Friends</h3>
              <p className="text-purple-200 text-sm">Earn $1,000 V-Cash per referral</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-purple-100 transition-colors p-2 hover:bg-purple-500/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-purple-200 text-sm mb-4">
              Invite your friends to join Stock Analyzer and earn $1,000 V-Cash for each successful referral when they complete their first trade!
            </p>
          </div>

          {/* Email Input Section */}
          <div className="mb-6">
            <label className="block text-purple-100 text-sm font-medium mb-3">
              Friend's Email Address
            </label>
            
            {/* Email Input with Domain Selector */}
            <div className="flex mb-3">
              <input
                type="text"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`flex-1 px-4 py-3 bg-gray-800/50 border rounded-l-xl text-purple-100 placeholder-purple-300 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-300 backdrop-blur-sm ${
                  emailError ? 'border-red-400/50' : 'border-purple-400/30'
                }`}
                placeholder="Enter email"
                style={{ minWidth: '0' }}
              />
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="px-3 py-3 bg-gray-800/50 border border-l-0 border-purple-400/30 rounded-r-xl text-purple-100 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-300 backdrop-blur-sm"
                style={{ minWidth: '140px' }}
              >
                {emailDomains.map((domain) => (
                  <option key={domain} value={domain} className="bg-gray-800">
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Preview */}
            {email && (
              <div className="mb-3 p-3 bg-purple-500/10 border border-purple-400/20 rounded-xl backdrop-blur-sm">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 text-purple-400 mr-2" />
                  <span className="text-purple-200 text-sm">Email Preview:</span>
                </div>
                <p className="text-purple-100 font-medium mt-1 break-all">
                  {getFullEmail(email)}
                </p>
              </div>
            )}

            {emailError && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                {emailError}
              </p>
            )}
          </div>

          {/* Custom Domain Input */}
          {selectedDomain === '@customdomain.com' && (
            <div className="mb-6">
              <label className="block text-purple-100 text-sm font-medium mb-2">
                Custom Domain
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-400/30 rounded-xl text-purple-100 placeholder-purple-300 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-300 backdrop-blur-sm"
                placeholder="@company.com"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl backdrop-blur-sm">
              <p className="text-red-400 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </p>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSendInvite}
            disabled={loading || !email || emailError !== ''}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-95 active:scale-95 flex items-center justify-center shadow-lg shadow-purple-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Sending Invite...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Invitation
              </>
            )}
          </button>

          {/* Terms */}
          <p className="text-purple-300 text-xs mt-4 text-center">
            Your friend must complete profile setup and make their first trade to qualify for the referral bonus.
          </p>
        </div>
      </div>
    </div>
  );
};