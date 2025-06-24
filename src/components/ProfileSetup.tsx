import React, { useState, useEffect, useRef } from 'react';
import { User, Camera, Upload, Sparkles, Zap, Star, CheckCircle, AlertCircle, Loader2, ArrowRight, Hexagon, Triangle, Circle, Square } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';

interface ProfileData {
  full_name: string;
  age: string;
  gender: string;
  occupation: string;
  investment_experience: string;
  risk_tolerance: string;
  avatar_url?: string;
}

interface ProfileSetupProps {
  onComplete: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    age: '',
    gender: '',
    occupation: '',
    investment_experience: '',
    risk_tolerance: '',
    avatar_url: ''
  });
  const [errors, setErrors] = useState<Partial<ProfileData>>({});
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [shakeForm, setShakeForm] = useState(false);
  const [liquidFields, setLiquidFields] = useState<Partial<ProfileData>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 3;

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

  const triggerValidationEffects = (fieldErrors: Partial<ProfileData>) => {
    setShakeForm(true);
    setLiquidFields(fieldErrors);

    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }

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
      // Audio context not available
    }

    setTimeout(() => setShakeForm(false), 600);
    setTimeout(() => setLiquidFields({}), 2000);
  };

  const validateStep = (step: number) => {
    const newErrors: Partial<ProfileData> = {};

    if (step === 1) {
      if (!profileData.full_name.trim()) {
        newErrors.full_name = 'Name is required';
      } else if (profileData.full_name.trim().length < 2) {
        newErrors.full_name = 'Name must be at least 2 characters';
      }

      if (!profileData.age) {
        newErrors.age = 'Age is required';
      } else if (parseInt(profileData.age) < 18) {
        newErrors.age = 'You must be at least 18 years old';
      } else if (parseInt(profileData.age) > 120) {
        newErrors.age = 'Please enter a valid age';
      }

      if (!profileData.gender) {
        newErrors.gender = 'Please select your gender';
      }
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      triggerValidationEffects(newErrors);
      return false;
    }
    
    return true;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ avatar_url: 'Please select a valid image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ avatar_url: 'Image size must be less than 5MB' });
      return;
    }

    setUploadingImage(true);
    setErrors({ ...errors, avatar_url: undefined });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileData({ ...profileData, avatar_url: data.publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors({ avatar_url: 'Failed to upload image. Please try again.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          email: user?.email,
          full_name: profileData.full_name,
          age: parseInt(profileData.age),
          gender: profileData.gender,
          occupation: profileData.occupation || null,
          investment_experience: profileData.investment_experience || null,
          risk_tolerance: profileData.risk_tolerance || null,
          avatar_url: profileData.avatar_url || null,
          profile_completed: true
        });

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ full_name: 'Failed to save profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          Basic Information
        </h2>
        <p className="text-gray-300">Tell us a bit about yourself</p>
      </div>

      {/* Profile Picture */}
      <div className="group text-center">
        <label className="block text-sm font-medium text-gray-300 mb-4">
          Profile Picture (Optional)
        </label>
        <div className="relative inline-block">
          <div 
            className={`w-28 h-28 rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-2 border-cyan-400/40 flex items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden transform hover:scale-110 hover:rotate-6 ${
              focusedField === 'avatar' ? 'scale-110 rotate-3 shadow-2xl shadow-cyan-500/30' : ''
            }`}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setFocusedField('avatar')}
            onMouseLeave={() => setFocusedField(null)}
          >
            {uploadingImage ? (
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            ) : profileData.avatar_url ? (
              <img 
                src={profileData.avatar_url} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-10 h-10 text-cyan-400" />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-125 transition-all duration-300 shadow-lg">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        {errors.avatar_url && (
          <p className="text-red-400 text-sm mt-2 animate-pulse">{errors.avatar_url}</p>
        )}
      </div>

      {/* Name Field */}
      <div className="group">
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-2">
          Full Name *
        </label>
        <div className="relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <User className={`h-5 w-5 transition-all duration-300 ${
              focusedField === 'full_name' ? 'text-cyan-400 scale-110' : 'text-gray-500'
            }`} />
          </div>
          <input
            id="full_name"
            type="text"
            value={profileData.full_name}
            onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
            onFocus={() => setFocusedField('full_name')}
            onBlur={() => setFocusedField(null)}
            className={`block w-full pl-12 pr-4 py-4 bg-black/40 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 transition-all duration-300 relative z-10 ${
              errors.full_name 
                ? 'border-red-500/60 bg-red-500/10 shadow-lg shadow-red-500/20' 
                : focusedField === 'full_name'
                ? 'border-cyan-400/60 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/30'
                : 'border-cyan-400/30 hover:border-cyan-400/50'
            }`}
            placeholder="Enter your full name"
          />
          {liquidFields.full_name && (
            <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
              <svg className="liquid-wave-svg\" viewBox="0 0 400 100\" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="liquidGradient1\" x1="0%\" y1="0%\" x2="0%\" y2="100%">
                    <stop offset="0%\" stopColor="rgba(239, 68, 68, 0.8)" />
                    <stop offset="50%\" stopColor="rgba(220, 38, 38, 0.6)" />
                    <stop offset="100%\" stopColor="rgba(185, 28, 28, 0.4)" />
                  </linearGradient>
                </defs>
                <path 
                  className="liquid-wave-path"
                  d="M0,100 C150,80 250,120 400,100 L400,100 L0,100 Z" 
                  fill="url(#liquidGradient1)"
                />
              </svg>
            </div>
          )}
        </div>
        {errors.full_name && (
          <p className="text-red-400 text-sm mt-2 flex items-center animate-bounce">
            <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
            {errors.full_name}
          </p>
        )}
      </div>

      {/* Age Field */}
      <div className="group">
        <label htmlFor="age" className="block text-sm font-medium text-gray-300 mb-2">
          Age *
        </label>
        <input
          id="age"
          type="number"
          min="18"
          max="120"
          value={profileData.age}
          onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
          onFocus={() => setFocusedField('age')}
          onBlur={() => setFocusedField(null)}
          className={`block w-full px-4 py-4 bg-black/40 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 transition-all duration-300 ${
            errors.age 
              ? 'border-red-500/60 bg-red-500/10 shadow-lg shadow-red-500/20' 
              : focusedField === 'age'
              ? 'border-blue-400/60 bg-blue-500/10 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/30'
              : 'border-blue-400/30 hover:border-blue-400/50'
          }`}
          placeholder="Enter your age"
        />
        {errors.age && (
          <p className="text-red-400 text-sm mt-2 flex items-center animate-bounce">
            <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
            {errors.age}
          </p>
        )}
      </div>

      {/* Gender Field */}
      <div className="group">
        <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-2">
          Gender *
        </label>
        <select
          id="gender"
          value={profileData.gender}
          onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
          onFocus={() => setFocusedField('gender')}
          onBlur={() => setFocusedField(null)}
          className={`block w-full px-4 py-4 bg-black/40 backdrop-blur-sm border rounded-xl text-white transition-all duration-300 ${
            errors.gender 
              ? 'border-red-500/60 bg-red-500/10 shadow-lg shadow-red-500/20' 
              : focusedField === 'gender'
              ? 'border-purple-400/60 bg-purple-500/10 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/30'
              : 'border-purple-400/30 hover:border-purple-400/50'
          }`}
        >
          <option value="" className="bg-gray-800">Select your gender</option>
          <option value="male" className="bg-gray-800">Male</option>
          <option value="female" className="bg-gray-800">Female</option>
          <option value="non-binary" className="bg-gray-800">Non-binary</option>
          <option value="prefer-not-to-say" className="bg-gray-800">Prefer not to say</option>
        </select>
        {errors.gender && (
          <p className="text-red-400 text-sm mt-2 flex items-center animate-bounce">
            <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
            {errors.gender}
          </p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
          Professional Details
        </h2>
        <p className="text-gray-300">Help us understand your background</p>
      </div>

      {/* Occupation Field */}
      <div className="group">
        <label htmlFor="occupation" className="block text-sm font-medium text-gray-300 mb-2">
          Occupation (Optional)
        </label>
        <input
          id="occupation"
          type="text"
          value={profileData.occupation}
          onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
          onFocus={() => setFocusedField('occupation')}
          onBlur={() => setFocusedField(null)}
          className={`block w-full px-4 py-4 bg-black/40 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 transition-all duration-300 ${
            focusedField === 'occupation'
            ? 'border-purple-400/60 bg-purple-500/10 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/30'
            : 'border-purple-400/30 hover:border-purple-400/50'
          }`}
          placeholder="e.g., Software Engineer, Teacher, Student"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
          Investment Profile
        </h2>
        <p className="text-gray-300">Tell us about your investment experience</p>
      </div>

      {/* Investment Experience */}
      <div className="group">
        <label htmlFor="investment_experience" className="block text-sm font-medium text-gray-300 mb-2">
          Investment Experience (Optional)
        </label>
        <select
          id="investment_experience"
          value={profileData.investment_experience}
          onChange={(e) => setProfileData({ ...profileData, investment_experience: e.target.value })}
          onFocus={() => setFocusedField('investment_experience')}
          onBlur={() => setFocusedField(null)}
          className={`block w-full px-4 py-4 bg-black/40 backdrop-blur-sm border rounded-xl text-white transition-all duration-300 ${
            focusedField === 'investment_experience'
            ? 'border-emerald-400/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30'
            : 'border-emerald-400/30 hover:border-emerald-400/50'
          }`}
        >
          <option value="" className="bg-gray-800">Select your experience level</option>
          <option value="beginner" className="bg-gray-800">Beginner (0-1 years)</option>
          <option value="intermediate" className="bg-gray-800">Intermediate (1-5 years)</option>
          <option value="advanced" className="bg-gray-800">Advanced (5+ years)</option>
          <option value="expert" className="bg-gray-800">Expert (10+ years)</option>
        </select>
      </div>

      {/* Risk Tolerance */}
      <div className="group">
        <label htmlFor="risk_tolerance" className="block text-sm font-medium text-gray-300 mb-2">
          Risk Tolerance (Optional)
        </label>
        <select
          id="risk_tolerance"
          value={profileData.risk_tolerance}
          onChange={(e) => setProfileData({ ...profileData, risk_tolerance: e.target.value })}
          onFocus={() => setFocusedField('risk_tolerance')}
          onBlur={() => setFocusedField(null)}
          className={`block w-full px-4 py-4 bg-black/40 backdrop-blur-sm border rounded-xl text-white transition-all duration-300 ${
            focusedField === 'risk_tolerance'
            ? 'border-teal-400/60 bg-teal-500/10 shadow-lg shadow-teal-500/20 ring-2 ring-teal-500/30'
            : 'border-teal-400/30 hover:border-teal-400/50'
          }`}
        >
          <option value="" className="bg-gray-800">Select your risk tolerance</option>
          <option value="conservative" className="bg-gray-800">Conservative (Low risk, stable returns)</option>
          <option value="moderate" className="bg-gray-800">Moderate (Balanced risk and return)</option>
          <option value="aggressive" className="bg-gray-800">Aggressive (High risk, high potential return)</option>
        </select>
      </div>
    </div>
  );

  const getStepColors = () => {
    switch (currentStep) {
      case 1: return {
        primary: 'cyan',
        secondary: 'blue',
        accent: 'purple',
        gradient: 'from-cyan-500/15 via-blue-500/15 to-purple-500/15'
      };
      case 2: return {
        primary: 'purple',
        secondary: 'pink',
        accent: 'red',
        gradient: 'from-purple-500/15 via-pink-500/15 to-red-500/15'
      };
      case 3: return {
        primary: 'emerald',
        secondary: 'teal',
        accent: 'green',
        gradient: 'from-emerald-500/15 via-teal-500/15 to-green-500/15'
      };
      default: return {
        primary: 'cyan',
        secondary: 'blue',
        accent: 'purple',
        gradient: 'from-cyan-500/15 via-blue-500/15 to-purple-500/15'
      };
    }
  };

  const colors = getStepColors();

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden`}
    >
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Dynamic Floating Orbs */}
        <div className={`absolute top-20 left-20 w-80 h-80 bg-gradient-to-br ${colors.gradient} rounded-full blur-3xl animate-pulse opacity-60`}></div>
        <div className={`absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br ${colors.gradient} rounded-full blur-3xl animate-pulse delay-1000 opacity-50`}></div>
        <div className={`absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-br ${colors.gradient} rounded-full blur-3xl animate-pulse delay-2000 opacity-40`}></div>
        <div className={`absolute top-40 right-40 w-56 h-56 bg-gradient-to-br ${colors.gradient} rounded-full blur-3xl animate-pulse delay-500 opacity-30`}></div>
        
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            transform: `translate(${mousePosition.x * 0.15}px, ${mousePosition.y * 0.15}px) rotate(${mousePosition.x * 0.02}deg)`,
            transition: 'transform 0.2s ease-out'
          }}
        ></div>

        {/* Enhanced 3D Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => {
            const icons = [Sparkles, Zap, Star, Hexagon, Triangle, Circle, Square];
            const IconComponent = icons[i % icons.length];
            const delay = i * 0.3;
            const size = 6 + (i % 3) * 2;
            return (
              <div
                key={i}
                className="absolute animate-float-complex"
                style={{
                  left: `${15 + (i * 7)}%`,
                  top: `${8 + (i * 8)}%`,
                  animationDelay: `${delay}s`,
                  transform: `translateZ(${i * 15}px) rotateY(${mousePosition.x * 0.2}deg) rotateX(${mousePosition.y * 0.2}deg)`,
                  transition: 'transform 0.3s ease-out'
                }}
              >
                <IconComponent 
                  className={`w-${size} h-${size} text-${colors.primary}-400/30 transform rotate-${i * 30}`}
                  style={{
                    filter: `drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))`,
                    animation: `spin ${8 + i}s linear infinite`
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Enhanced Mouse Follower */}
        <div
          className={`absolute w-[500px] h-[500px] bg-gradient-radial from-${colors.primary}-500/8 via-${colors.secondary}-500/5 to-transparent rounded-full pointer-events-none transition-all duration-500 ease-out`}
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%) scale(1.2)',
          }}
        ></div>

        {/* Enhanced Particle System */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-${colors.primary}-400/20 rounded-full animate-particle-complex`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 15}s`,
                animationDuration: `${10 + Math.random() * 8}s`
              }}
            ></div>
          ))}
        </div>

        {/* Rotating Geometric Shapes */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-20 h-20 border border-${colors.accent}-400/20 animate-spin-slow`}
              style={{
                left: `${20 + i * 15}%`,
                top: `${20 + i * 12}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: `${20 + i * 5}s`,
                transform: `rotate(${i * 45}deg)`,
                borderRadius: i % 2 === 0 ? '50%' : '0%'
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div 
            className={`backdrop-blur-xl bg-black/30 border border-${colors.primary}-400/30 rounded-3xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-105 hover:bg-black/40 ${
              shakeForm ? 'animate-shake-intense' : ''
            }`}
            style={{
              boxShadow: `
                0 12px 40px 0 rgba(0, 0, 0, 0.7),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                0 0 50px rgba(59, 130, 246, 0.1)
              `,
              transform: `perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.15}deg) rotateX(${(mousePosition.y - 50) * -0.15}deg)`,
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-${colors.primary}-500/20 via-${colors.secondary}-500/20 to-${colors.accent}-500/20 backdrop-blur-sm rounded-3xl mb-6 transform transition-all duration-500 hover:scale-110 hover:rotate-12 border border-${colors.primary}-400/30 shadow-lg`}>
                <User className={`w-12 h-12 text-${colors.primary}-400`} />
              </div>
              <h1 className={`text-4xl font-bold text-white mb-3 bg-gradient-to-r from-${colors.primary}-400 via-${colors.secondary}-400 to-${colors.accent}-400 bg-clip-text text-transparent`}>
                Complete Your Profile
              </h1>
              <p className="text-gray-300 text-lg">Help us personalize your experience</p>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-300 font-medium">Step {currentStep} of {totalSteps}</span>
                <span className="text-sm text-gray-300 font-medium">{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                <div 
                  className={`bg-gradient-to-r from-${colors.primary}-500 via-${colors.secondary}-500 to-${colors.accent}-500 h-3 rounded-full transition-all duration-700 ease-out shadow-lg`}
                  style={{ 
                    width: `${(currentStep / totalSteps) * 100}%`,
                    boxShadow: `0 0 20px rgba(59, 130, 246, 0.5)`
                  }}
                ></div>
              </div>
            </div>

            {/* Form Content */}
            <div className="mb-8">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <div>
                {currentStep > 1 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 bg-gray-600/80 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all duration-300 transform hover:scale-105 border border-gray-500/30"
                  >
                    Back
                  </button>
                )}
              </div>

              <div>
                {currentStep < totalSteps ? (
                  <button
                    onClick={handleNext}
                    className={`flex items-center px-8 py-3 bg-gradient-to-r from-${colors.primary}-600 via-${colors.secondary}-600 to-${colors.accent}-600 text-white rounded-xl font-medium hover:from-${colors.primary}-700 hover:via-${colors.secondary}-700 hover:to-${colors.accent}-700 focus:outline-none focus:ring-2 focus:ring-${colors.primary}-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg`}
                  >
                    Next
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`flex items-center px-8 py-3 bg-gradient-to-r from-${colors.primary}-600 via-${colors.secondary}-600 to-${colors.accent}-600 text-white rounded-xl font-medium hover:from-${colors.primary}-700 hover:via-${colors.secondary}-700 hover:to-${colors.accent}-700 focus:outline-none focus:ring-2 focus:ring-${colors.primary}-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Complete Profile
                        <CheckCircle className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @keyframes float-complex {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          25% { transform: translateY(-15px) rotate(90deg) scale(1.1); }
          50% { transform: translateY(-25px) rotate(180deg) scale(1); }
          75% { transform: translateY(-10px) rotate(270deg) scale(0.9); }
        }
        @keyframes particle-complex {
          0% { transform: translateY(100vh) rotate(0deg) scale(0); opacity: 0; }
          10% { opacity: 1; scale: 1; }
          50% { transform: translateY(50vh) rotate(180deg) scale(1.2); opacity: 0.8; }
          90% { opacity: 1; scale: 0.8; }
          100% { transform: translateY(-100vh) rotate(360deg) scale(0); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shake-intense {
          0%, 100% { transform: translateX(0) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.15}deg) rotateX(${(mousePosition.y - 50) * -0.15}deg); }
          10% { transform: translateX(-10px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.15}deg) rotateX(${(mousePosition.y - 50) * -0.15}deg); }
          20% { transform: translateX(10px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.15}deg) rotateX(${(mousePosition.y - 50) * -0.15}deg); }
          30% { transform: translateX(-8px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.15}deg) rotateX(${(mousePosition.y - 50) * -0.15}deg); }
          40% { transform: translateX(8px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.15}deg) rotateX(${(mousePosition.y - 50) * -0.15}deg); }
          50% { transform: translateX(-6px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.15}deg) rotateX(${(mousePosition.y - 50) * -0.15}deg); }
          60% { transform: translateX(6px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.15}deg) rotateX(${(mousePosition.y - 50) * -0.15}deg); }
          70% { transform: translateX(-4px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.15}deg) rotateX(${(mousePosition.y - 50) * -0.15}deg); }
          80% { transform: translateX(4px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.15}deg) rotateX(${(mousePosition.y - 50) * -0.15}deg); }
          90% { transform: translateX(-2px) perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.15}deg) rotateX(${(mousePosition.y - 50) * -0.15}deg); }
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
        .animate-float-complex {
          animation: float-complex 6s ease-in-out infinite;
        }
        .animate-particle-complex {
          animation: particle-complex 15s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-shake-intense {
          animation: shake-intense 0.6s ease-in-out;
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