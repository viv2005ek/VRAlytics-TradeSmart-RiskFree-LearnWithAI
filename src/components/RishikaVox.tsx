import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Headphones, Sparkles, Zap, Star, Mic, Volume2, Loader } from 'lucide-react';
import { NavBar } from './NavBar';
import { UserPortfolio } from '../lib/database';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

interface RishikaVoxProps {
  onBack: () => void;
  portfolio?: UserPortfolio | null;
}

// Animated Particles Component
const Particles = ({ count = 50, color = '#EC4899' }) => {
  const points = useRef<THREE.Points>(null);
  
  useEffect(() => {
    if (!points.current) return;
    
    const positions = points.current.geometry.attributes.position.array as Float32Array;
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      velocities[i3] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    points.current.userData.velocities = velocities;
  }, [count]);
  
  useFrame(() => {
    if (!points.current) return;
    
    const positions = points.current.geometry.attributes.position.array as Float32Array;
    const velocities = points.current.userData.velocities;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];
      
      // Boundary check
      if (Math.abs(positions[i3]) > 3) velocities[i3] *= -1;
      if (Math.abs(positions[i3 + 1]) > 3) velocities[i3 + 1] *= -1;
      if (Math.abs(positions[i3 + 2]) > 3) velocities[i3 + 2] *= -1;
    }
    
    points.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(count * 3).map(() => (Math.random() - 0.5) * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Animated Orb Component
const AnimatedOrb = ({ isActive = false, scale = 1 }) => {
  const orbRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (isActive && glowRef.current) {
      gsap.to(glowRef.current.scale, {
        x: 1.5,
        y: 1.5,
        z: 1.5,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });
    }
    
    return () => {
      if (glowRef.current) {
        gsap.killTweensOf(glowRef.current.scale);
      }
    };
  }, [isActive]);
  
  useFrame((state) => {
    if (orbRef.current) {
      orbRef.current.rotation.y += 0.005;
      
      // Gentle floating motion
      orbRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });
  
  return (
    <group ref={orbRef} scale={scale}>
      {/* Main Orb */}
      <Sphere args={[1, 64, 64]}>
        <meshPhongMaterial
          color="#EC4899"
          emissive="#EC4899"
          emissiveIntensity={0.3}
          shininess={100}
        />
      </Sphere>
      
      {/* Glow Effect */}
      <Sphere ref={glowRef} args={[1.2, 32, 32]}>
        <meshBasicMaterial
          color="#EC4899"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
      
      {/* Voice Activity Indicator */}
      {isActive && (
        <group>
          {[...Array(8)].map((_, i) => (
            <Sphere key={i} args={[0.1, 16, 16]} position={[
              Math.cos(i / 8 * Math.PI * 2) * 1.5,
              Math.sin(i / 8 * Math.PI * 2) * 1.5,
              0
            ]}>
              <meshBasicMaterial
                color="#FBCFE8"
                transparent
                opacity={0.8}
              />
            </Sphere>
          ))}
        </group>
      )}
    </group>
  );
};

// Voice Waveform Component
const VoiceWaveform = ({ isActive = false }) => {
  const waveformRef = useRef<THREE.Group>(null);
  const bars = useRef<THREE.Mesh[]>([]);
  
  useEffect(() => {
    if (!isActive || !bars.current.length) return;
    
    // Animate bars when voice is active
    bars.current.forEach((bar, i) => {
      gsap.to(bar.scale, {
        y: 0.5 + Math.random() * 2,
        duration: 0.2 + Math.random() * 0.3,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: i * 0.05
      });
    });
    
    return () => {
      bars.current.forEach(bar => {
        gsap.killTweensOf(bar.scale);
        if (bar.scale) {
          bar.scale.y = 0.2;
        }
      });
    };
  }, [isActive]);
  
  return (
    <group ref={waveformRef} position={[0, -2, 0]}>
      {[...Array(16)].map((_, i) => (
        <mesh
          key={i}
          position={[(i - 7.5) * 0.2, 0, 0]}
          ref={el => {
            if (el) bars.current[i] = el;
          }}
        >
          <boxGeometry args={[0.1, isActive ? 0.5 : 0.2, 0.1]} />
          <meshBasicMaterial color="#EC4899" />
        </mesh>
      ))}
    </group>
  );
};

// Header Scene Component
const HeaderScene = ({ isVoiceActive }: { isVoiceActive: boolean }) => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#EC4899" />
      
      <AnimatedOrb isActive={isVoiceActive} scale={0.6} />
      <Particles count={50} />
      
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.5}
        autoRotate
        autoRotateSpeed={1}
      />
    </>
  );
};

export const RishikaVox: React.FC<RishikaVoxProps> = ({ onBack, portfolio }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Load ElevenLabs widget script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.onload = () => {
      setIsWidgetLoaded(true);
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // Create and configure widget once script is loaded
  useEffect(() => {
    if (!isWidgetLoaded) return;
    
    const widgetContainer = document.getElementById('elevenlabs-widget-container');
    if (!widgetContainer) return;
    
    // Clear any existing widgets
    widgetContainer.innerHTML = '';
    
    // Create the widget element
    const widget = document.createElement('elevenlabs-convai');
    widget.setAttribute('agent-id', 'agent_01jy3vk00zf86aaannka84g41p');
    widget.setAttribute('style', '--primary:#EC4899;--background:#111827;--text:#F9FAFB');
    
    // Add custom styles
    const style = document.createElement('style');
    style.textContent = `
      .elevenlabs-convai-container {
        --primary: #EC4899 !important;
        --background: #111827 !important;
        --text: #F9FAFB !important;
        --border-radius: 16px !important;
      }
      
      .elevenlabs-convai-button {
        background: linear-gradient(135deg, #EC4899, #DB2777) !important;
        box-shadow: 0 0 20px rgba(236, 72, 153, 0.4) !important;
      }
      
      .elevenlabs-convai-widget {
        border: 1px solid rgba(236, 72, 153, 0.3) !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
      }
    `;
    document.head.appendChild(style);
    
    // Add the widget to the container
    widgetContainer.appendChild(widget);
    
    // Set up event listeners for voice activity
    widget.addEventListener('voiceActivityStart', () => {
      setIsVoiceActive(true);
    });
    
    widget.addEventListener('voiceActivityEnd', () => {
      setIsVoiceActive(false);
    });
    
    widget.addEventListener('ready', () => {
      setIsWidgetReady(true);
    });
    
    return () => {
      widgetContainer.innerHTML = '';
      document.head.removeChild(style);
    };
  }, [isWidgetLoaded]);
  
const handleActivateVoice = async () => {
  try {
    // Request microphone permission
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // If we get the stream, we can start voice interaction
    console.log("Microphone access granted");
    
    // Start ElevenLabs conversation if widget is ready
    if (isWidgetReady) {
      const widgetButton = document.querySelector('.elevenlabs-convai-button') as HTMLElement;
      if (widgetButton) {
        widgetButton.click();
      }
    }
    
    // Important: Close the stream if you're not using it directly
    stream.getTracks().forEach(track => track.stop());
    
  } catch (error) {
    console.error("Microphone access denied:", error);
    // Fallback to text input or show message
    alert("Microphone access is required for voice conversations. Please enable microphone permissions.");
  }
};
  
  // Fixed background elements
  const backgroundElements = [
    { top: '10%', left: '5%', size: '100px', color: 'rgba(236, 72, 153, 0.05)', delay: '0s' },
    { top: '30%', left: '80%', size: '150px', color: 'rgba(236, 72, 153, 0.07)', delay: '0.5s' },
    { top: '70%', left: '15%', size: '120px', color: 'rgba(236, 72, 153, 0.06)', delay: '1s' },
    { top: '50%', left: '60%', size: '80px', color: 'rgba(236, 72, 153, 0.04)', delay: '1.5s' },
    { top: '85%', left: '75%', size: '110px', color: 'rgba(236, 72, 153, 0.05)', delay: '2s' },
  ];

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
        {/* Background Orbs - Fixed Positions */}
        {backgroundElements.map((el, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full"
            style={{
              top: el.top,
              left: el.left,
              width: el.size,
              height: el.size,
              background: `radial-gradient(circle, ${el.color} 0%, transparent 70%)`,
              animation: `pulse 4s ease-in-out infinite`,
              animationDelay: el.delay
            }}
          />
        ))}

        {/* Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(236, 72, 153, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(236, 72, 153, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        ></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-7">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to AI Assistants
        </button>

        {/* Enhanced Glassmorphic Header with 3D Elements */}
        <div className="backdrop-blur-xl bg-black/30 border border-pink-500/30 rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* 3D Canvas for Header */}
            <div className="w-32 h-32 relative mb-6 md:mb-0">
              <Canvas camera={{ position: [0, 0, 3], fov: 60 }}>
                <HeaderScene isVoiceActive={isVoiceActive} />
              </Canvas>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Headphones className="w-12 h-12 text-pink-400" />
              </div>
            </div>
            
            <div className="text-center md:text-left md:ml-8 flex-1">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent"
                  style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: '0.05em' }}>
                RishikaVox
              </h1>
              
              <p className="text-md text-gray-300">
                Experience next-gen financial analysis through voice-first AI. RishikaVox delivers institutional-grade market insights with the ease of natural conversation. From technical chart patterns to earnings breakdowns, get actionable investment intelligence spoken in real-time.
              </p>
              
              <button
                onClick={handleActivateVoice}
                className="mt-6 bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 px-6 rounded-xl font-medium hover:from-pink-700 hover:to-rose-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-pink-500/25 flex items-center justify-center md:inline-flex"
              >
                {isWidgetReady ? (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Activate Mic
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Activate Mic
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-pink-500/5 to-rose-500/5 rounded-2xl"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </div>

        {/* Features Section - Horizontal Layout */}
        <div className="backdrop-blur-xl bg-black/20 border border-pink-500/30 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Sparkles className="w-6 h-6 mr-3 text-pink-400" />
            Voice Assistant Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-pink-500/20">
              <h3 className="text-lg font-medium text-white mb-2">Real-time Market Analysis</h3>
              <p className="text-gray-300">Get instant insights on stock performance, technical indicators, and market trends through natural voice conversations.</p>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-pink-500/20">
              <h3 className="text-lg font-medium text-white mb-2">Portfolio Recommendations</h3>
              <p className="text-gray-300">Receive personalized investment suggestions based on your risk profile and market conditions.</p>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-pink-500/20">
              <h3 className="text-lg font-medium text-white mb-2">News Summaries</h3>
              <p className="text-gray-300">Stay updated with the latest market news and events that could impact your investments.</p>
            </div>
          </div>
        </div>

        {/* How to Activate Section - Horizontal Layout */}
<div className="backdrop-blur-xl bg-black/20 border border-pink-500/30 rounded-2xl p-6 mb-8">
  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
    <Zap className="w-6 h-6 mr-3 text-pink-400" />
    How to Activate RishikaVox
  </h2>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Step 1 */}
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-pink-500/20">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 bg-pink-500/30 rounded-full flex items-center justify-center mr-3">
          <span className="text-pink-400 font-bold">1</span>
        </div>
        <h3 className="text-lg font-medium text-white">Activate Microphone</h3>
      </div>
      <p className="text-gray-300 pl-11">
        Click the microphone icon and allow browser permissions when prompted to enable voice interactions.
      </p>
    </div>
    
    {/* Step 2 */}
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-pink-500/20">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 bg-pink-500/30 rounded-full flex items-center justify-center mr-3">
          <span className="text-pink-400 font-bold">2</span>
        </div>
        <h3 className="text-lg font-medium text-white">Start Conversation</h3>
      </div>
      <p className="text-gray-300 pl-11">
        Click "Start Conversation" in the widget and select your preferred language from the settings menu.
      </p>
    </div>
    
    {/* Step 3 */}
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-pink-500/20">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 bg-pink-500/30 rounded-full flex items-center justify-center mr-3">
          <span className="text-pink-400 font-bold">3</span>
        </div>
        <h3 className="text-lg font-medium text-white">Ask Your Questions</h3>
      </div>
      <p className="text-gray-300 pl-11">
        Speak naturally or type your questions about stocks, trends, or portfolio strategies.
      </p>
    </div>
  </div>
</div>
        
        {/* Sample Questions */}
        <div className="backdrop-blur-xl bg-black/20 border border-pink-500/30 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Star className="w-6 h-6 mr-3 text-pink-400" />
            Sample Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "What's your analysis of Tesla stock?",
              "How is the tech sector performing today?",
              "Explain RSI indicator for beginners",
              "Compare Apple and Microsoft stocks",
              "What are the best dividend stocks to watch?",
              "How should I diversify my portfolio?"
            ].map((question, i) => (
              <div key={i} className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-pink-500/20">
                <p className="text-gray-300">"{question}"</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ElevenLabs Widget Container */}
      <div id="elevenlabs-widget-container" className="fixed bottom-4 right-4 z-50"></div>

      {/* Translation Loading Indicator */}
      {isTranslating && (
        <div className="fixed bottom-20 right-4 bg-black/80 backdrop-blur-md rounded-xl p-4 border border-pink-500/30 z-50 flex items-center">
          <div className="w-5 h-5 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-pink-400">Translating...</span>
        </div>
      )}

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.6;
          }
          50% { 
            transform: scale(1.1); 
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0px); 
          }
          50% { 
            transform: translateY(-20px); 
          }
        }

        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
          }
          50% { 
            box-shadow: 0 0 40px rgba(236, 72, 153, 0.6);
          }
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(236, 72, 153, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(236, 72, 153, 0.5);
        }
      `}</style>
    </div>
  );
};