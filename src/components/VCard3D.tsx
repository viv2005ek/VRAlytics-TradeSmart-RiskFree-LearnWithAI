import React, { useState, useRef, useEffect } from 'react';
import { UserPortfolio } from '../lib/database';
import { Profile } from '../lib/supabase';

interface VCard3DProps {
  portfolio: UserPortfolio | null;
  profile: Profile | null;
  className?: string;
}

export const VCard3D: React.FC<VCard3DProps> = ({ portfolio, profile, className = '' }) => {
  const [cardRotation, setCardRotation] = useState({ x: 5, y: 0 });
  const [targetRotation, setTargetRotation] = useState({ x: 5, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      year: '2-digit'
    });
  };

  const formatEmail = (email: string) => {
    if (!email) return 'user@domain.com';
    const [username, domain] = email.split('@');
    if (username.length <= 4) return email;
    return `${username.substring(0, 4)}•••@${domain}`;
  };

  // Smooth return to target position when not dragging
  useEffect(() => {
    if (!isDragging && !isFlipping) {
      const animate = () => {
        setCardRotation(prev => {
          const diffX = targetRotation.x - prev.x;
          const diffY = targetRotation.y - prev.y;
          
          // If close enough to target, snap to it
          if (Math.abs(diffX) < 0.1 && Math.abs(diffY) < 0.1) {
            return targetRotation;
          }
          
          // Smooth interpolation back to target
          return {
            x: prev.x + diffX * 0.15, // Smooth return speed
            y: prev.y + diffY * 0.15
          };
        });

        // Continue animation if not at target
        const currentDiffX = targetRotation.x - cardRotation.x;
        const currentDiffY = targetRotation.y - cardRotation.y;
        
        if (Math.abs(currentDiffX) > 0.1 || Math.abs(currentDiffY) > 0.1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging, isFlipping, targetRotation, cardRotation]);

  const handleCardDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastMousePos({ x: e.clientX, y: e.clientY });
    e.preventDefault();
    e.stopPropagation(); // Prevent click event
  };

  const handleCardDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    // Update rotation based on drag movement
    setCardRotation(prev => ({
      x: prev.x - deltaY * 0.5, // Invert Y for natural rotation
      y: prev.y + deltaX * 0.5
    }));
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleCardDragEnd = () => {
    setIsDragging(false);
    // Card will automatically return to target position via useEffect
  };

  const handleCardFlip = (e: React.MouseEvent) => {
    // Only flip if not dragging and not currently flipping
    if (!isDragging && !isFlipping) {
      setIsFlipping(true);
      
      // Update target rotation to include flip
      setTargetRotation(prev => ({
        ...prev,
        y: prev.y + 180
      }));
      
      // Reset flipping state after animation completes
      setTimeout(() => {
        setIsFlipping(false);
      }, 600); // Match transition duration
    }
  };

  return (
    <div className={`backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl p-8 w-full ${className}`}>
      <h3 className="text-xl font-bold text-white mb-6 text-center">
        <span className="bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-500 bg-clip-text text-transparent font-bold italic">
          V-CARD
        </span>
      </h3>
      
      <div className="relative perspective-1000">
        <div 
          ref={cardRef}
          className={`relative w-full h-56 cursor-grab active:cursor-grabbing select-none ${
            isDragging ? 'transition-none' : 'transition-transform duration-500 ease-out'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: `
              rotateX(${cardRotation.x}deg) 
              rotateY(${cardRotation.y}deg) 
              translateZ(${isDragging ? '20px' : '10px'})
            `,
            willChange: 'transform',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          onMouseDown={handleCardDragStart}
          onMouseMove={handleCardDrag}
          onMouseUp={handleCardDragEnd}
          onMouseLeave={handleCardDragEnd}
          onClick={handleCardFlip}
        >
          {/* Card Front */}
          <div 
            className="absolute inset-0 w-full h-full rounded-xl overflow-hidden backface-hidden select-none"
            style={{
              background: `
                linear-gradient(135deg, #12121D 0%, #1a1a2e 50%, #16213e 100%)
              `,
              boxShadow: `
                0 0 20px rgba(167, 139, 250, ${isDragging ? 0.6 : 0.3}),
                0 0 40px rgba(91, 33, 182, ${isDragging ? 0.4 : 0.2}),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2)
              `,
              border: '1px solid rgba(167, 139, 250, 0.3)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            {/* Network Lines Background - Reduced opacity and enhanced intersection glow */}
            <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 400 250">
              <defs>
                <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#FFA500" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path 
                d="M50,50 L150,50 L150,100 L250,100 L250,150 L350,150" 
                stroke="url(#circuitGradient)" 
                strokeWidth="1" 
                fill="none"
                className="animate-pulse"
              />
              <path 
                d="M100,20 L100,80 L200,80 L200,120 L300,120" 
                stroke="url(#circuitGradient)" 
                strokeWidth="1" 
                fill="none"
                className="animate-pulse"
                style={{ animationDelay: '1s' }}
              />
              <path 
                d="M50,180 L150,180 L150,220 L250,220" 
                stroke="url(#circuitGradient)" 
                strokeWidth="1" 
                fill="none"
                className="animate-pulse"
                style={{ animationDelay: '2s' }}
              />
              <path 
                d="M300,50 L300,150 L200,150 L200,200" 
                stroke="url(#circuitGradient)" 
                strokeWidth="1" 
                fill="none"
                className="animate-pulse"
                style={{ animationDelay: '1.5s' }}
              />
              
              {/* Enhanced Network Points with Glow */}
              <circle cx="150" cy="50" r="4" fill="#FFD700" filter="url(#glow)" className="animate-network-point" />
              <circle cx="250" cy="100" r="4" fill="#FFD700" filter="url(#glow)" className="animate-network-point" style={{ animationDelay: '0.5s' }} />
              <circle cx="200" cy="80" r="4" fill="#FFD700" filter="url(#glow)" className="animate-network-point" style={{ animationDelay: '1.5s' }} />
              <circle cx="150" cy="180" r="4" fill="#FFD700" filter="url(#glow)" className="animate-network-point" style={{ animationDelay: '2s' }} />
              <circle cx="150" cy="100" r="4" fill="#FFD700" filter="url(#glow)" className="animate-network-point" style={{ animationDelay: '1s' }} />
              <circle cx="300" cy="150" r="4" fill="#FFD700" filter="url(#glow)" className="animate-network-point" style={{ animationDelay: '2.5s' }} />
              <circle cx="200" cy="150" r="4" fill="#FFD700" filter="url(#glow)" className="animate-network-point" style={{ animationDelay: '3s' }} />
              <circle cx="250" cy="220" r="4" fill="#FFD700" filter="url(#glow)" className="animate-network-point" style={{ animationDelay: '3.5s' }} />
            </svg>

            {/* Card Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between text-white select-none" style={{ userSelect: 'none' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p 
                    className="text-xs opacity-80 font-mono tracking-wider font-bold italic select-none"
                    style={{ 
                      textShadow: '0 0 8px rgba(255, 215, 0, 0.8)',
                      color: '#FFD700',
                      userSelect: 'none'
                    }}
                  >
                    VIRTUAL CASH
                  </p>
                  {/* Chip with circuit lines */}
                  <div className="w-10 h-8 bg-gradient-to-r from-yellow-500 to-amber-600 rounded mt-2 shadow-lg overflow-hidden relative">
                    <div className="absolute inset-0 opacity-70">
                      <div className="absolute top-1/4 left-0 right-0 h-px bg-black/30"></div>
                      <div className="absolute top-2/4 left-0 right-0 h-px bg-black/30"></div>
                      <div className="absolute top-3/4 left-0 right-0 h-px bg-black/30"></div>
                      <div className="absolute left-1/4 top-0 bottom-0 w-px bg-black/30"></div>
                      <div className="absolute left-2/4 top-0 bottom-0 w-px bg-black/30"></div>
                      <div className="absolute left-3/4 top-0 bottom-0 w-px bg-black/30"></div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-80 select-none" style={{ color: '#F5F5FF', userSelect: 'none' }}>BALANCE</p>
                  <p 
                    className="text-lg font-bold select-none"
                    style={{ 
                      color: '#00FF88',
                      textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
                      background: 'linear-gradient(45deg, #00FF88, #00D4FF)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      userSelect: 'none'
                    }}
                  >
                    {formatCurrency(portfolio?.v_cash_balance || 0)}
                  </p>
                </div>
              </div>
              
              <div>
                <p 
                  className="text-lg font-mono tracking-wider mb-2 select-none"
                  style={{ 
                    color: '#F5F5FF',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    userSelect: 'none'
                  }}
                >
                  {formatEmail(profile?.email || '')}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-80 select-none" style={{ color: '#F5F5FF', userSelect: 'none' }}>CARD HOLDER</p>
                    <p 
                      className="font-semibold text-sm select-none"
                      style={{ 
                        color: '#F5F5FF',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        userSelect: 'none'
                      }}
                    >
                      {profile?.full_name?.toUpperCase() || 'USER NAME'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-80 select-none" style={{ color: '#F5F5FF', userSelect: 'none' }}>JOINED SINCE</p>
                    <p 
                      className="font-mono text-sm select-none"
                      style={{ 
                        color: '#F5F5FF',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        userSelect: 'none'
                      }}
                    >
                      {profile?.created_at ? formatDate(profile.created_at) : '01/25'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reduced Holographic Edge Glow */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: `
                  linear-gradient(45deg, transparent 40%, rgba(255, 215, 0, 0.05) 50%, transparent 60%),
                  linear-gradient(-45deg, transparent 40%, rgba(255, 215, 0, 0.05) 50%, transparent 60%)
                `,
                animation: 'holographic-sweep 4s ease-in-out infinite',
              }}
            />
          </div>

          {/* Card Back - Dark Theme */}
          <div 
            className="absolute inset-0 w-full h-full rounded-xl overflow-hidden backface-hidden rotate-y-180 select-none"
            style={{
              background: `
                linear-gradient(135deg, #12121D 0%, #1a1a2e 50%, #16213e 100%),
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 2px,
                  rgba(91, 33, 182, 0.1) 2px,
                  rgba(91, 33, 182, 0.1) 4px
                )
              `,
              boxShadow: `
                0 0 20px rgba(167, 139, 250, 0.3),
                0 0 40px rgba(91, 33, 182, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              border: '1px solid rgba(167, 139, 250,0.3)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            {/* Microprint Border */}
            <div 
              className="absolute inset-0 rounded-xl"
              style={{
                background: `
                  repeating-linear-gradient(
                    0deg,
                    transparent 0px,
                    rgba(91, 33, 182, 0.2) 1px,
                    transparent 2px
                  )
                `,
              }}
            />

            {/* Back Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-center text-white select-none" style={{ userSelect: 'none' }}>
              <div className="text-center space-y-4">
                <div className="space-y-3">
                  <div className="bg-black/30 rounded-lg p-3 border border-purple-500/30">
                    <p className="text-xs text-blue-300 mb-1 select-none" style={{ userSelect: 'none' }}>EXPERIENCE</p>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ 
                            width: profile?.investment_experience === 'expert' ? '100%' : 
                                   profile?.investment_experience === 'advanced' ? '75%' :
                                   profile?.investment_experience === 'intermediate' ? '50%' : '25%'
                          }}
                        />
                      </div>
                      <span className="text-xs text-blue-300 capitalize select-none" style={{ userSelect: 'none' }}>
                        {profile?.investment_experience || 'Beginner'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-lg p-3 border border-purple-500/30">
                    <p className="text-xs text-blue-300 mb-1 select-none" style={{ userSelect: 'none' }}>RISK TOLERANCE</p>
                    <div className="flex items-center">
                      <div className="flex space-x-1 mr-2">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`w-3 h-3 rounded ${
                              (profile?.risk_tolerance === 'aggressive' && level <= 3) ||
                              (profile?.risk_tolerance === 'moderate' && level <= 2) ||
                              (profile?.risk_tolerance === 'conservative' && level <= 1)
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                                : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-blue-300 capitalize select-none" style={{ userSelect: 'none' }}>
                        {profile?.risk_tolerance || 'Conservative'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-purple-500/30">
                  <p 
                    className="text-xs text-center opacity-70 select-none"
                    style={{ 
                      color: '#F5F5FF',
                      lineHeight: '1.4',
                      userSelect: 'none'
                    }}
                  >
                    This V-Card enables virtual stock trading.<br />
                    No real money involved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Instructions */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          Click to flip • Drag to rotate • Card returns to center
        </p>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes holographic-sweep {
          0%, 100% {
            background-position: 0% 0%;
            opacity: 0.2;
          }
          50% {
            background-position: 100% 100%;
            opacity: 0.4;
          }
        }

        @keyframes network-point {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
            filter: blur(0px);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
            filter: blur(1px);
          }
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        .backface-hidden {
          backface-visibility: hidden;
        }

        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        .animate-network-point {
          animation: network-point 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};