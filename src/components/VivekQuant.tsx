import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Video, Sparkles, Zap, Star, Hexagon, Triangle, Circle, Square, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { NavBar } from './NavBar';
import { UserPortfolio } from '../lib/database';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useAuth } from '../auth/AuthProvider';

interface VivekQuantProps {
  onBack: () => void;
  portfolio?: UserPortfolio | null;
}

// API credentials
const API_KEY = "7de4a8623b2847a89ff87c2eb970831d";
const REPLICA_ID = "rcda3332ad7b";
const PERSONA_ID = "p742791b42e5";
const API_BASE_URL = "https://tavusapi.com/v2";

// 3D Floating Particles Component
const FloatingParticles = ({ count = 50, color = '#22C55E' }: { count?: number, color?: string }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array>(new Float32Array(count * 3));
  
  useEffect(() => {
    if (!particlesRef.current) return;
    
    const velocities = velocitiesRef.current;
    for (let i = 0; i < count * 3; i += 3) {
      velocities[i] = (Math.random() - 0.5) * 0.01;
      velocities[i + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i + 2] = (Math.random() - 0.5) * 0.01;
    }
  }, [count]);
  
  useFrame(() => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const velocities = velocitiesRef.current;
    
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] += velocities[i];
      positions[i + 1] += velocities[i + 1];
      positions[i + 2] += velocities[i + 2];
      
      // Boundary check and bounce
      if (Math.abs(positions[i]) > 5) velocities[i] *= -1;
      if (Math.abs(positions[i + 1]) > 5) velocities[i + 1] *= -1;
      if (Math.abs(positions[i + 2]) > 5) velocities[i + 2] *= -1;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(count * 3).map(() => (Math.random() - 0.5) * 10)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// 3D Holographic Grid Component
const HolographicGrid = ({ color = '#22C55E' }: { color?: string }) => {
  const gridRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (gridRef.current) {
      // Subtle floating animation
      gridRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      
      // Rotation
      gridRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });
  
  return (
    <group ref={gridRef}>
      {/* Horizontal grid lines */}
      {[...Array(10)].map((_, i) => (
        <line key={`h-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([-5, (i - 5) * 0.5, 0, 5, (i - 5) * 0.5, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={color} transparent opacity={0.2} />
        </line>
      ))}
      
      {/* Vertical grid lines */}
      {[...Array(20)].map((_, i) => (
        <line key={`v-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([(i - 10) * 0.5, -2.5, 0, (i - 10) * 0.5, 2.5, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={color} transparent opacity={0.2} />
        </line>
      ))}
    </group>
  );
};

// 3D Animated Logo Component
const AnimatedLogo = ({ isActive = false }: { isActive?: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (groupRef.current) {
      gsap.to(groupRef.current.rotation, {
        y: Math.PI * 2,
        duration: 20,
        repeat: -1,
        ease: "none"
      });
    }
    
    if (glowRef.current) {
      gsap.to(glowRef.current.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }, []);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Main sphere */}
      <Sphere args={[0.8, 32, 32]}>
        <meshPhongMaterial
          color="#22C55E"
          emissive="#22C55E"
          emissiveIntensity={0.5}
          shininess={100}
        />
      </Sphere>
      
      {/* Glow effect */}
      <Sphere ref={glowRef} args={[1, 32, 32]}>
        <meshBasicMaterial
          color="#22C55E"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
      
      {/* Orbiting particles */}
      {[...Array(3)].map((_, i) => (
        <group key={i} rotation={[0, (Math.PI * 2 / 3) * i, 0]}>
          <mesh position={[0, 0, 1.5]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#4ADE80" />
          </mesh>
        </group>
      ))}
      
      {/* Video icon in the center */}
      <Box args={[0.4, 0.3, 0.1]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#4ADE80" />
      </Box>
    </group>
  );
};

// 3D Scene Component
const Scene3D = ({ isActive = false }: { isActive?: boolean }) => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#22C55E" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#22C55E" />
      
      <AnimatedLogo isActive={isActive} />
      <HolographicGrid color="#22C55E" />
      <FloatingParticles count={30} color="#22C55E" />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.5}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
};

export const VivekQuant: React.FC<VivekQuantProps> = ({ onBack, portfolio }) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [replica, setReplica] = useState<any>(null);
  const [persona, setPersona] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'disconnected' | 'connecting' | 'active' | 'ended'>('disconnected');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [particles, setParticles] = useState<{ x: number, y: number, size: number, color: string }[]>([]);

  // Fetch replica and persona data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const replicaRes = await fetch(
          `${API_BASE_URL}/replicas/${REPLICA_ID}`,
          {
            method: "GET",
            headers: { "x-api-key": API_KEY },
          }
        );
        const replicaData = await replicaRes.json();
        setReplica(replicaData);

        const personaRes = await fetch(
          `${API_BASE_URL}/personas/${PERSONA_ID}`,
          {
            method: "GET",
            headers: { "x-api-key": API_KEY },
          }
        );
        const personaData = await personaRes.json();
        setPersona(personaData);
      } catch (err) {
        setError("Failed to fetch initial data");
        console.error(err);
      }
    };

    fetchData();
  }, []);

  // Start conversation with Tavus API
  const startConversation = async () => {
    setLoading(true);
    setError(null);
    setCallStatus('connecting');

    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          replica_id: REPLICA_ID,
          persona_id: PERSONA_ID,
          callback_url: `${window.location.origin}/webhook`,
conversation_name: "Live Conversation",
          conversational_context:
            "You are having a real-time video conversation about stock market analysis and investment advice.",
          custom_greeting: `Hello${user?.email ? ' ' + user.email.split('@')[0] : ''}! I'm VivekQuant, your AI stock analysis expert. How can I help with your investments today?`,
          properties: {
            max_call_duration: 300,
            participant_left_timeout: 10,
            participant_absent_timeout: 20,
            enable_recording: false,
            enable_closed_captions: true,
            apply_greenscreen: false,
            language: "english",
          },
        }),
      });

      const data = await response.json();
      setConversation(data);
      setCallStatus('active');
      setShowVideoCall(true);
      
      // Create success particles
      createSuccessParticles();
      
      console.log("Conversation URL:", data.conversation_url);
    } catch (err: any) {
      setError("Failed to start conversation: " + err.message);
      setCallStatus('disconnected');
      console.error("Conversation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // End conversation
  const endConversation = () => {
    setConversation(null);
    setCallStatus('ended');
    setTimeout(() => {
      setCallStatus('disconnected');
      setShowVideoCall(false);
    }, 1000);
  };

  // Create particles for success animation
  const createSuccessParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        x: 50 + (Math.random() - 0.5) * 30,
        y: 50 + (Math.random() - 0.5) * 30,
        size: 2 + Math.random() * 5,
        color: `rgba(${34 + Math.random() * 20}, ${197 + Math.random() * 20}, ${94 + Math.random() * 20}, ${0.6 + Math.random() * 0.4})`
      });
    }
    setParticles(newParticles);
    
    // Clear particles after animation
    setTimeout(() => {
      setParticles([]);
    }, 2000);
  };

  if (showVideoCall) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
        <div className="bg-black/80 backdrop-blur-md p-4 border-b border-green-500/30 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-3 border border-green-500/30">
              <Video className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">VivekQuant <span className="text-green-400">Live</span></h2>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <p className="text-xs text-green-400">AI Video Call in Progress</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={endConversation}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-300 flex items-center"
          >
            <X className="w-4 h-4 mr-2" />
            End Call
          </button>
        </div>
        
        <div className="flex-1 relative">
          {/* Success particles */}
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-success-particle"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
              }}
            ></div>
          ))}
          
          {/* Video iframe */}
          <iframe
            src={conversation?.conversation_url}
            title="Tavus Video Call"
            allow="camera; microphone"
            className="w-full h-full border-none"
          />
          
          {/* Holographic overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-green-500/30"></div>
            <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-green-500/30"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-green-500/30"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-green-500/30"></div>
            
            {/* Scan lines */}
            <div className="absolute inset-0 bg-scan-lines opacity-10"></div>
          </div>
        </div>
        
        <div className="bg-black/80 backdrop-blur-md p-4 border-t border-green-500/30">
          <div className="flex justify-center space-x-4">
            <div className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/30 text-green-400 text-xs">
              {replica?.name || 'VivekQuant'} AI
            </div>
            <div className="px-3 py-1 bg-black/30 rounded-full border border-white/10 text-gray-400 text-xs">
              {persona?.name || 'Financial Advisor'} Persona
            </div>
            <div className="px-3 py-1 bg-black/30 rounded-full border border-white/10 text-gray-400 text-xs">
              HD Quality
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, #0F172A 0%, #0D1117 50%, #0F172A 100%),
          radial-gradient(ellipse at center, rgba(34, 197, 94, 0.03) 0%, transparent 70%)
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
            className="fixed"
            style={{
              left: `${20 + i * 8}%`,
              top: `${15 + i * 7}%`
            }}
          >
            <div 
              className="glowing-orb"
              style={{
                width: `${8 + Math.random() * 16}px`,
                height: `${8 + Math.random() * 16}px`,
                background: `radial-gradient(circle, 
                  rgba(${i % 3 === 0 ? '34, 197, 94' : i % 3 === 1 ? '16, 185, 129' : '5, 150, 105'}, 0.8) 0%, 
                  rgba(${i % 3 === 0 ? '34, 197, 94' : i % 3 === 1 ? '16, 185, 129' : '5, 150, 105'}, 0.3) 50%,
                  transparent 100%)`,
                borderRadius: '50%',
                filter: `blur(${1 + Math.random() * 2}px)`,
                boxShadow: `
                  0 0 ${12 + Math.random() * 16}px rgba(${i % 3 === 0 ? '34, 197, 94' : i % 3 === 1 ? '16, 185, 129' : '5, 150, 105'}, 0.6),
                  0 0 ${20 + Math.random() * 24}px rgba(${i % 3 === 0 ? '34, 197, 94' : i % 3 === 1 ? '16, 185, 129' : '5, 150, 105'}, 0.3)
                `,
                animation: `orb-pulse ${3 + Math.random() * 4}s ease-in-out infinite`
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
              className="fixed"
              style={{
                left: `${10 + i * 7}%`,
                top: `${12 + i * 6}%`,
                opacity: 0.15,
                transform: `rotate(${i * 30}deg)`
              }}
            >
              <ShapeComponent 
                className={`w-${4 + (i % 4) * 2} h-${4 + (i % 4) * 2} text-${
                  i % 3 === 0 ? 'green' : i % 3 === 1 ? 'emerald' : 'teal'
                }-400`}
              />
            </div>
          );
        })}

        {/* Subtle Grid */}
        <div 
          className="fixed inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to AI Assistants
        </button>

        {/* 3D Header with Canvas */}
        <div className="backdrop-blur-xl bg-black/30 border border-green-500/30 rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center">
            {/* 3D Canvas */}
            <div className="w-40 h-40 relative mb-6 md:mb-0">
              <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <Scene3D isActive={loading} />
              </Canvas>
            </div>
            
            <div className="text-center md:text-left md:ml-8 flex-1">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"
                  style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: '0.05em' }}>
                VivekQuant
              </h1>
              
              <p className="text-md text-gray-300">
                Experience next-gen financial analysis through AI video calls. VivekQuant delivers institutional-grade market insights with the ease of face-to-face conversation. From technical chart patterns to earnings breakdowns, get actionable investment intelligence with a personal touch.
              </p>
              
              <button
                onClick={startConversation}
                disabled={loading || !replica || !persona}
                className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center md:inline-flex disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Initializing AI...
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2" />
                    Start Video Call
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </div>

        {/* Features Section - Horizontal Layout */}
        <div className="backdrop-blur-xl bg-black/20 border border-green-500/30 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Sparkles className="w-6 h-6 mr-3 text-green-400" />
            Video Assistant Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-green-500/20 transform transition-all duration-300 hover:scale-105 hover:border-green-400/40 hover:bg-black/40">
              <h3 className="text-lg font-medium text-white mb-2">Real-time Market Analysis</h3>
              <p className="text-gray-300">Get instant insights on stock performance, technical indicators, and market trends through face-to-face video conversations.</p>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-green-500/20 transform transition-all duration-300 hover:scale-105 hover:border-green-400/40 hover:bg-black/40">
              <h3 className="text-lg font-medium text-white mb-2">Portfolio Recommendations</h3>
              <p className="text-gray-300">Receive personalized investment suggestions based on your risk profile and current market conditions.</p>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-green-500/20 transform transition-all duration-300 hover:scale-105 hover:border-green-400/40 hover:bg-black/40">
              <h3 className="text-lg font-medium text-white mb-2">Visual Chart Analysis</h3>
              <p className="text-gray-300">Watch as VivekQuant explains complex chart patterns and technical indicators with visual demonstrations.</p>
            </div>
          </div>
        </div>
        {/* How to Activate Section - Horizontal Layout */}
<div className="backdrop-blur-xl bg-black/20 border border-green-500/30 rounded-2xl p-6 mb-8">
  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
    <Zap className="w-6 h-6 mr-3 text-green-400" />
    How to Activate VivekQuant
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Step 1 */}
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center mr-3">
          <span className="text-green-400 font-bold">1</span>
        </div>
        <h3 className="text-lg font-medium text-white">Click on Start Video Call</h3>
      </div>
      <p className="text-gray-300 pl-11">
        Begin by clicking the "Start Video Call" button to initiate the session with VivekQuant.
      </p>
    </div>

    {/* Step 2 */}
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center mr-3">
          <span className="text-green-400 font-bold">2</span>
        </div>
        <h3 className="text-lg font-medium text-white">Allow Camera & Mic Access</h3>
      </div>
      <p className="text-gray-300 pl-11">
        Once connected, grant your browser permission to access your camera and microphone.
      </p>
    </div>

    {/* Step 3 */}
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center mr-3">
          <span className="text-green-400 font-bold">3</span>
        </div>
        <h3 className="text-lg font-medium text-white">Ask Your Question</h3>
      </div>
      <p className="text-gray-300 pl-11">
        Speak naturally or type your questions related to stocks, trends, or portfolio strategies.
      </p>
    </div>
  </div>
</div>


        {/* Sample Questions */}
        <div className="backdrop-blur-xl bg-black/20 border border-green-500/30 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Star className="w-6 h-6 mr-3 text-green-400" />
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
              <div 
                key={i} 
                className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-green-500/20 transform transition-all duration-300 hover:scale-105 hover:border-green-400/40 hover:bg-black/40"
              >
                <p className="text-gray-300">"{question}"</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-6 backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}
      </main>

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

        @keyframes success-particle {
          0% {
            transform: scale(0) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: scale(1) translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px);
            opacity: 0;
          }
        }

        .glowing-orb {
          will-change: transform, opacity;
          backface-visibility: hidden;
          animation: orb-pulse 4s ease-in-out infinite;
        }

        .animate-success-particle {
          animation: success-particle 2s ease-out forwards;
        }

        .bg-scan-lines {
          background-image: repeating-linear-gradient(
            0deg,
            rgba(34, 197, 94, 0.1),
            rgba(34, 197, 94, 0.1) 1px,
            transparent 1px,
            transparent 2px
          );
          background-size: 100% 2px;
        }

        /* Ensure fixed background attachment works properly */
        body {
          background-attachment: fixed;
        }
      `}</style>
    </div>
  );
};