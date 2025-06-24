import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Github, Linkedin, Instagram, Code, Brain, Server, Sparkles, Zap, Star } from 'lucide-react';
import { NavBar } from './NavBar';
import VivekImg from '/src/assets/Vivek.jpeg';
import AnushkaImg from '/src/assets/anushka.jpg';
import RishikaImg from '/src/assets/rishika.jpg';

interface AboutUsProps {
  onBack: () => void;
  portfolio?: any;
}

interface TeamMember {
  id: string;
  name: string;
  age: number;
  role: string;
  education: string;
  description: string;
  accentColor: string;
  avatar: string;
  social: {
    github?: string;
    linkedin?: string;
    instagram?: string;
  };
  icon: React.ComponentType<any>;
  isLead?: boolean;
}

const teamMembers: TeamMember[] = [
  {
    id: 'vivek',
    name: 'Vivek',
    age: 20,
    role: 'Full-Stack Developer',
    education: '3rd Year BTech - MUJ',
    description: 'Builds the vision',
    accentColor: '#A78BFA',
    avatar: VivekImg,
    social: {
      github: 'https://github.com/viv2005ek',
      linkedin: 'https://www.linkedin.com/in/vivek-kumar-garg-097677280/',
      instagram: 'https://www.instagram.com/viv2005ek?igsh=MWhmbThkM3c0bG4xdw=='
    },
    icon: Code,
    isLead: true
  },
  {
    id: 'anushka',
    name: 'Anushka',
    age: 19,
    role: 'ML Developer',
    education: '3rd Year BTech - MUJ',
    description: 'Trains the AI brain',
    accentColor: '#5EEAD4',
    avatar: AnushkaImg,
    social: {
      github: 'https://github.com/anushka2456',
      linkedin: 'https://www.linkedin.com/in/anushka-agarwal-689b462a3',
      instagram: 'https://www.instagram.com/anushka_agarwal2456?igsh=MWg5NDh4czFub2Fqag=='
    },
    icon: Brain
  },
  {
    id: 'rishika',
    name: 'Rishika',
    age: 20,
    role: 'Backend Developer',
    education: '3rd Year BTech - MUJ',
    description: 'Powers the engine',
    accentColor: '#FCA5A5',
    avatar: RishikaImg,
    social: {
      linkedin: 'https://www.linkedin.com/in/rishika-agrawal-7b49a2293',
      instagram: 'https://www.instagram.com/rishika_0601?igsh=MTN2aHhlbG82cGJi'
    },
    icon: Server
  }
];

export const AboutUs: React.FC<AboutUsProps> = ({ onBack, portfolio }) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [cardMousePosition, setCardMousePosition] = useState<{ [key: string]: { x: number; y: number } }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCardMouseMove = (e: React.MouseEvent, cardId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);
    
    setCardMousePosition(prev => ({
      ...prev,
      [cardId]: { x: deltaX, y: deltaY }
    }));
  };

  const handleCardMouseLeave = (cardId: string) => {
    setHoveredCard(null);
    setCardMousePosition(prev => ({
      ...prev,
      [cardId]: { x: 0, y: 0 }
    }));
  };

  const handleSocialClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getCardTransform = (cardId: string, isLead: boolean = false) => {
    const pos = cardMousePosition[cardId] || { x: 0, y: 0 };
    const intensity = isLead ? 20 : 15; // More intense tilt for lead card
    const rotateX = -pos.y * intensity;
    const rotateY = pos.x * intensity;
    const scale = hoveredCard === cardId ? (isLead ? 1.08 : 1.05) : 1;
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
  };

  const getElementTransform = (cardId: string, type: 'social') => {
    const pos = cardMousePosition[cardId] || { x: 0, y: 0 };
    const translateX = pos.x * 4;
    const translateY = pos.y * 4;
    const scale = hoveredCard === cardId ? 1.15 : 1;
    
    return `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  };

  const leadMember = teamMembers.find(member => member.isLead);
  const otherMembers = teamMembers.filter(member => !member.isLead);

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
        currentPage="about"
        onNavigate={(page) => {
          if (page === 'dashboard') {
            onBack();
          }else{
            onBack();
          }
        }}
        portfolio={portfolio}
      />

      {/* Reduced Glowing Background Objects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Glowing Orbs with Enhanced Animation - Reduced number */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute"
            style={{
              left: `${20 + i * 15}%`,
              top: `${15 + i * 12}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${8 + Math.random() * 6}s`,
            }}
          >
            <div 
              className="glowing-orb"
              style={{
                width: `${12 + Math.random() * 20}px`,
                height: `${12 + Math.random() * 20}px`,
                background: `radial-gradient(circle, 
                  rgba(${i % 3 === 0 ? '167, 139, 250' : i % 3 === 1 ? '94, 234, 212' : '252, 165, 165'}, 0.8) 0%, 
                  rgba(${i % 3 === 0 ? '167, 139, 250' : i % 3 === 1 ? '94, 234, 212' : '252, 165, 165'}, 0.3) 50%,
                  transparent 100%)`,
                borderRadius: '50%',
                filter: `blur(${1 + Math.random() * 2}px)`,
                boxShadow: `
                  0 0 ${16 + Math.random() * 20}px rgba(${i % 3 === 0 ? '167, 139, 250' : i % 3 === 1 ? '94, 234, 212' : '252, 165, 165'}, 0.6),
                  0 0 ${24 + Math.random() * 30}px rgba(${i % 3 === 0 ? '167, 139, 250' : i % 3 === 1 ? '94, 234, 212' : '252, 165, 165'}, 0.3)
                `,
                animation: `glow-pulse ${3 + Math.random() * 4}s ease-in-out infinite`,
              }}
            />
          </div>
        ))}

        {/* Floating Icons - Reduced number */}
        {[...Array(5)].map((_, i) => {
          const icons = [Sparkles, Zap, Star];
          const IconComponent = icons[i % icons.length];
          return (
            <div
              key={`icon-${i}`}
              className="absolute"
              style={{
                left: `${25 + (i * 15)}%`,
                top: `${20 + (i * 15)}%`,
              }}
            >
              <IconComponent 
                className="w-6 h-6 text-purple-400/20"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(167, 139, 250, 0.3))'
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 
            className="text-6xl font-bold mb-6"
            style={{
              fontFamily: 'Orbitron, monospace',
              color: '#E9D5FF',
              textShadow: '0 0 20px rgba(233, 213, 255, 0.5), 0 0 40px rgba(167, 139, 250, 0.3)',
              fontWeight: '600'
            }}
          >
            VRAlytics
          </h1>
          <p 
            className="text-2xl mb-8"
            style={{
              color: '#C4B5FD',
              fontWeight: '300'
            }}
          >
            AI-Powered Stock Insights
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-teal-400 mx-auto rounded-full"></div>
        </div>

        {/* Team Cards Layout */}
        <div className="space-y-12">
          {/* Project Lead Card - Centered */}
          <div className="flex justify-center mb-16">
            {leadMember && (
              <div
                className="group relative max-w-lg w-full"
                style={{
                  animation: `fadeInUp 0.8s ease-out both`
                }}
                onMouseMove={(e) => handleCardMouseMove(e, leadMember.id)}
                onMouseEnter={() => setHoveredCard(leadMember.id)}
                onMouseLeave={() => handleCardMouseLeave(leadMember.id)}
              >
                {/* Enhanced Card for Project Lead */}
                <div
                  className="relative backdrop-blur-xl rounded-3xl p-8 transition-all duration-500 transform-gpu w-full"
                  style={{
                    background: 'rgba(30, 30, 45, 0.8)',
                    border: `2px solid ${leadMember.accentColor}`,
                    boxShadow: hoveredCard === leadMember.id 
                      ? `0 0 40px ${leadMember.accentColor}40, 0 25px 50px rgba(0, 0, 0, 0.4)`
                      : `0 0 25px ${leadMember.accentColor}30, 0 15px 30px rgba(0, 0, 0, 0.3)`,
                    transform: getCardTransform(leadMember.id, true),
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Lead Badge */}
                  <div 
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-xs font-bold"
                    style={{
                      background: `linear-gradient(45deg, ${leadMember.accentColor}, ${leadMember.accentColor}dd)`,
                      color: '#000',
                      boxShadow: `0 0 15px ${leadMember.accentColor}60`
                    }}
                  >
                    PROJECT LEAD
                  </div>

                  <div className="flex flex-col md:flex-row items-center">
                    {/* Avatar */}
                    <div className="relative mb-6 md:mb-0 md:mr-8 flex justify-center">
                      <div 
                        className="relative w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-300"
                        style={{
                          borderColor: leadMember.accentColor,
                          boxShadow: `0 0 25px ${leadMember.accentColor}50`
                        }}
                      >
                        <img 
                          src={leadMember.avatar} 
                          alt={leadMember.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Floating Animation Elements */}
                        <div className="absolute -top-3 -right-3 animate-bounce">
                          <leadMember.icon className="w-6 h-6" style={{ color: leadMember.accentColor }} />
                        </div>
                      </div>
                    </div>

                    {/* Member Info */}
                    <div className="text-center md:text-left flex-1">
                      <h3 
                        className="text-3xl font-bold mb-2"
                        style={{ color: '#E9D5FF' }}
                      >
                        {leadMember.name} ({leadMember.age})
                      </h3>
                      <div 
                        className="text-xl font-semibold mb-3 bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300"
                        style={{
                          backgroundImage: `linear-gradient(90deg, ${leadMember.accentColor}, ${leadMember.accentColor}dd)`,
                          transform: hoveredCard === leadMember.id ? 'translateX(5px)' : 'translateX(0px)'
                        }}
                      >
                        {leadMember.role}
                      </div>
                      <p 
                        className="text-sm mb-3"
                        style={{ color: '#C4B5FD' }}
                      >
                        {leadMember.education}
                      </p>
                      <p 
                        className="text-lg italic font-medium"
                        style={{ color: leadMember.accentColor }}
                      >
                        "{leadMember.description}"
                      </p>

                      {/* Social Icons */}
                      <div className="flex justify-center md:justify-start space-x-6 mt-4">
                        {leadMember.social.github && (
                          <button
                            onClick={() => handleSocialClick(leadMember.social.github!)}
                            className="p-4 rounded-full transition-all duration-300 transform hover:scale-125 hover:rotate-12"
                            style={{
                              backgroundColor: `${leadMember.accentColor}20`,
                              border: `1px solid ${leadMember.accentColor}40`,
                              boxShadow: hoveredCard === leadMember.id ? `0 0 20px ${leadMember.accentColor}50` : 'none',
                              transform: getElementTransform(leadMember.id, 'social')
                            }}
                          >
                            <Github 
                              className="w-6 h-6" 
                              style={{ color: leadMember.accentColor }}
                            />
                          </button>
                        )}
                        {leadMember.social.linkedin && (
                          <button
                            onClick={() => handleSocialClick(leadMember.social.linkedin!)}
                            className="p-4 rounded-full transition-all duration-300 transform hover:scale-125 hover:rotate-12"
                            style={{
                              backgroundColor: `${leadMember.accentColor}20`,
                              border: `1px solid ${leadMember.accentColor}40`,
                              boxShadow: hoveredCard === leadMember.id ? `0 0 20px ${leadMember.accentColor}50` : 'none',
                              transform: getElementTransform(leadMember.id, 'social')
                            }}
                          >
                            <Linkedin 
                              className="w-6 h-6" 
                              style={{ color: leadMember.accentColor }}
                            />
                          </button>
                        )}
                        {leadMember.social.instagram && (
                          <button
                            onClick={() => handleSocialClick(leadMember.social.instagram!)}
                            className="p-4 rounded-full transition-all duration-300 transform hover:scale-125 hover:rotate-12"
                            style={{
                              backgroundColor: `${leadMember.accentColor}20`,
                              border: `1px solid ${leadMember.accentColor}40`,
                              boxShadow: hoveredCard === leadMember.id ? `0 0 20px ${leadMember.accentColor}50` : 'none',
                              transform: getElementTransform(leadMember.id, 'social')
                            }}
                          >
                            <Instagram 
                              className="w-6 h-6" 
                              style={{ color: leadMember.accentColor }}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Other Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {otherMembers.map((member, index) => (
              <div
                key={member.id}
                className="group relative"
                style={{
                  animation: `fadeInUp 0.8s ease-out ${(index + 1) * 0.3}s both`
                }}
                onMouseMove={(e) => handleCardMouseMove(e, member.id)}
                onMouseEnter={() => setHoveredCard(member.id)}
                onMouseLeave={() => handleCardMouseLeave(member.id)}
              >
                {/* Card */}
                <div
                  className="relative backdrop-blur-xl rounded-2xl p-6 transition-all duration-500 transform-gpu"
                  style={{
                    background: 'rgba(30, 30, 45, 0.7)',
                    border: `1px solid ${member.accentColor}`,
                    boxShadow: hoveredCard === member.id 
                      ? `0 0 30px ${member.accentColor}30, 0 20px 40px rgba(0, 0, 0, 0.3)`
                      : `0 0 20px ${member.accentColor}20, 0 10px 20px rgba(0, 0, 0, 0.2)`,
                    transform: getCardTransform(member.id),
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Avatar */}
                  <div className="relative mb-6 flex justify-center">
                    <div 
                      className="relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all duration-300"
                      style={{
                        borderColor: member.accentColor,
                        boxShadow: `0 0 20px ${member.accentColor}40`
                      }}
                    >
                      <img 
                        src={member.avatar} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Floating Animation Elements */}
                      <div className="absolute -top-2 -right-2 animate-pulse">
                        <member.icon className="w-4 h-4" style={{ color: member.accentColor }} />
                      </div>
                    </div>
                  </div>

                  {/* Member Info */}
                  <div className="text-center mb-6">
                    <h3 
                      className="text-2xl font-bold mb-2"
                      style={{ color: '#E9D5FF' }}
                    >
                      {member.name} ({member.age})
                    </h3>
                    <div 
                      className="text-lg font-semibold mb-2 bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300"
                      style={{
                        backgroundImage: `linear-gradient(90deg, ${member.accentColor}, ${member.accentColor}dd)`,
                        transform: hoveredCard === member.id ? 'translateX(5px)' : 'translateX(0px)'
                      }}
                    >
                      {member.role}
                    </div>
                    <p 
                      className="text-sm mb-2"
                      style={{ color: '#C4B5FD' }}
                    >
                      {member.education}
                    </p>
                    <p 
                      className="text-sm italic"
                      style={{ color: member.accentColor }}
                    >
                      "{member.description}"
                    </p>
                  </div>

                  {/* Social Icons */}
                  <div className="flex justify-center space-x-4">
                    {member.social.github && (
                      <button
                        onClick={() => handleSocialClick(member.social.github!)}
                        className="p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:rotate-12"
                        style={{
                          backgroundColor: `${member.accentColor}20`,
                          border: `1px solid ${member.accentColor}40`,
                          boxShadow: hoveredCard === member.id ? `0 0 15px ${member.accentColor}40` : 'none',
                          transform: getElementTransform(member.id, 'social')
                        }}
                      >
                        <Github 
                          className="w-5 h-5" 
                          style={{ color: member.accentColor }}
                        />
                      </button>
                    )}
                    {member.social.linkedin && (
                      <button
                        onClick={() => handleSocialClick(member.social.linkedin!)}
                        className="p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:rotate-12"
                        style={{
                          backgroundColor: `${member.accentColor}20`,
                          border: `1px solid ${member.accentColor}40`,
                          boxShadow: hoveredCard === member.id ? `0 0 15px ${member.accentColor}40` : 'none',
                          transform: getElementTransform(member.id, 'social')
                        }}
                      >
                        <Linkedin 
                          className="w-5 h-5" 
                          style={{ color: member.accentColor }}
                        />
                      </button>
                    )}
                    {member.social.instagram && (
                      <button
                        onClick={() => handleSocialClick(member.social.instagram!)}
                        className="p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:rotate-12"
                        style={{
                          backgroundColor: `${member.accentColor}20`,
                          border: `1px solid ${member.accentColor}40`,
                          boxShadow: hoveredCard === member.id ? `0 0 15px ${member.accentColor}40` : 'none',
                          transform: getElementTransform(member.id, 'social')
                        }}
                      >
                        <Instagram 
                          className="w-5 h-5" 
                          style={{ color: member.accentColor }}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-20">
          <div 
            className="text-3xl font-bold mb-4"
            style={{
              fontFamily: 'Orbitron, monospace',
              color: '#E9D5FF',
              textShadow: '0 0 15px rgba(233, 213, 255, 0.4)'
            }}
          >
            Trade Smarter, Not Harder
          </div>
          <p 
            className="text-lg"
            style={{ color: '#C4B5FD' }}
          >
            Empowering traders with AI-driven insights and virtual trading experiences
          </p>
        </div>
      </main>

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap');
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow-pulse {
          0%, 100% { 
            opacity: 0.6;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .glowing-orb {
          will-change: transform, opacity;
          backface-visibility: hidden;
          animation: glow-pulse 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};