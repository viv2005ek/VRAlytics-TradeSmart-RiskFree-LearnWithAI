import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  User, 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Edit3,
  Mail,
  Lock,
  Camera,
  Upload,
  Eye,
  EyeOff,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Star,
  Zap,
  Activity,
  Phone,
  MapPin,
  CreditCard,
  LogOut
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { UserPortfolio, databaseService } from '../lib/database';
import { supabase, profileService, Profile } from '../lib/supabase';
import { NavBar } from './NavBar';
import { VCard3D } from './VCard3D';
import { LoadingScreen } from './LoadingScreen';

interface ProfilePageProps {
  onBack: () => void;
  portfolio: UserPortfolio | null;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack, portfolio }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState<Partial<Profile>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailData, setEmailData] = useState({
    newEmail: '',
    password: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState<any>({});
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profileData = await profileService.getProfile(user.id);
      setProfile(profileData);
      if (profileData) {
        setEditData(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setErrors({ avatar: 'Please select a valid image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ avatar: 'Image size must be less than 5MB' });
      return;
    }

    setUploadingImage(true);
    setErrors({ ...errors, avatar: undefined });

    try {
      const avatarUrl = await profileService.uploadAvatar(user.id, file);
      if (avatarUrl) {
        setEditData({ ...editData, avatar_url: avatarUrl });
        await profileService.updateProfile(user.id, { avatar_url: avatarUrl });
        setProfile({ ...profile!, avatar_url: avatarUrl });
        setSuccess('Profile picture updated successfully!');
      }
    } catch (error) {
      setErrors({ avatar: 'Failed to upload image. Please try again.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      const success = await profileService.updateProfile(user.id, editData);
      if (success) {
        setProfile({ ...profile, ...editData });
        setShowEditForm(false);
        setSuccess('Profile updated successfully!');
      } else {
        setErrors({ general: 'Failed to update profile' });
      }
    } catch (error) {
      setErrors({ general: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setErrors({ password: 'All fields are required' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ password: 'Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        setErrors({ password: error.message });
      } else {
        setSuccess('Password updated successfully!');
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setErrors({ password: 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!emailData.newEmail || !emailData.password) {
      setErrors({ email: 'All fields are required' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        email: emailData.newEmail
      });

      if (error) {
        setErrors({ email: error.message });
      } else {
        setOtpSent(true);
        setSuccess('Verification email sent to your new email address!');
      }
    } catch (error) {
      setErrors({ email: 'Failed to update email' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return 'Too Short';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading && !profile) {
    return <LoadingScreen message="Loading profile data..." subMessage="Preparing your personal dashboard" />;
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
        currentPage="profile"
        onNavigate={(page) => {
          if (page === 'dashboard') {
            onBack();
          } else{
            onBack();
          }
        }}
        portfolio={portfolio}
      />

      {/* Fixed Background Objects - Same as Dashboard */}
      <div 
        className="fixed inset-0 overflow-hidden"
        style={{
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Shining Stars */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          >
            <div 
              className="shining-star"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                background: `rgba(${Math.random() > 0.5 ? '255, 255, 255' : '59, 130, 246'}, ${0.6 + Math.random() * 0.4})`,
                borderRadius: '50%',
                boxShadow: `
                  0 0 ${4 + Math.random() * 8}px rgba(${Math.random() > 0.5 ? '255, 255, 255' : '59, 130, 246'}, 0.8),
                  0 0 ${8 + Math.random() * 12}px rgba(${Math.random() > 0.5 ? '255, 255, 255' : '59, 130, 246'}, 0.4)
                `,
              }}
            />
          </div>
        ))}

        {/* Floating Glowing Orbs */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute animate-float-gentle"
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

        {/* Shining Diamonds */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`diamond-${i}`}
            className="absolute animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          >
            <div 
              className="shining-diamond"
              style={{
                width: `${5 + Math.random() * 8}px`,
                height: `${5 + Math.random() * 8}px`,
                background: `linear-gradient(45deg, 
                  rgba(255, 255, 255, 0.9) 0%, 
                  rgba(59, 130, 246, 0.7) 50%, 
                  rgba(255, 255, 255, 0.9) 100%)`,
                clipPath: 'polygon(50% 0%, 0% 50%, 50% 100%, 100% 50%)',
                filter: `blur(0.5px)`,
                boxShadow: `
                  0 0 ${8 + Math.random() * 12}px rgba(255, 255, 255, 0.8),
                  0 0 ${16 + Math.random() * 20}px rgba(59, 130, 246, 0.5)
                `,
                animation: `diamond-shine ${2 + Math.random() * 3}s ease-in-out infinite`,
              }}
            />
          </div>
        ))}

        {/* Floating Particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute animate-drift"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          >
            <div 
              className="floating-particle"
              style={{
                width: `${1 + Math.random() * 3}px`,
                height: `${1 + Math.random() * 3}px`,
                background: `rgba(${Math.random() > 0.7 ? '255, 255, 255' : '59, 130, 246'}, ${0.4 + Math.random() * 0.4})`,
                borderRadius: '50%',
                boxShadow: `0 0 ${2 + Math.random() * 4}px rgba(${Math.random() > 0.7 ? '255, 255, 255' : '59, 130, 246'}, 0.6)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Profile</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowEditForm(true)}
              className="flex items-center px-6 py-3 border border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-400 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              <Edit3 className="w-5 h-5 mr-2" />
              Edit
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center px-6 py-3 border border-red-500/50 hover:border-red-400 hover:bg-red-500/10 text-red-400 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Profile Info (3/5 width) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Profile Picture and Name */}
            <div className="backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-400/30 shadow-lg shadow-cyan-500/20">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <User className="w-16 h-16 text-cyan-400" />
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {profile?.full_name || 'User Name'}
              </h2>
              <p className="text-gray-300 text-lg">
                {profile?.email}
              </p>
            </div>

            {/* Info Cards Grid - Fixed Layout: 2 rows with 2 cards each */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details */}
              <div className="group backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 min-h-[200px] flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mr-4 border border-cyan-400/30">
                    <User className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Personal Details</h3>
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <p className="text-gray-400 text-sm">Age</p>
                    <p className="text-white font-medium">{profile?.age || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Gender</p>
                    <p className="text-white font-medium">{profile?.gender || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Professional Role */}
              <div className="group backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/20 min-h-[200px] flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center mr-4 border border-green-400/30">
                    <Briefcase className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Professional Role</h3>
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">Occupation</p>
                  <p className="text-white font-medium">{profile?.occupation || 'Not specified'}</p>
                </div>
              </div>

              {/* Membership */}
              <div className="group backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 min-h-[200px] flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center mr-4 border border-purple-400/30">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Membership</h3>
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">Member since</p>
                  <p className="text-white font-medium">
                    {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Investment Profile */}
              <div className="group backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-500/20 min-h-[200px] flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center mr-4 border border-yellow-400/30">
                    <TrendingUp className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Investment Profile</h3>
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <p className="text-gray-400 text-sm">Experience</p>
                    <p className="text-white font-medium">{profile?.investment_experience || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Risk Tolerance</p>
                    <p className="text-white font-medium">{profile?.risk_tolerance || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Net Worth Card (2/5 width - wider than before) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Net Worth Box */}
            <div className="backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-none md:max-w-md lg:max-w-none mx-auto">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mr-4 border border-green-400/30">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Net Worth</h3>
              </div>
              
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Total Net Worth</p>
                  <p className="text-3xl font-bold text-green-400">
                    {formatCurrency((portfolio?.v_cash_balance || 0) + (portfolio?.total_portfolio_value || 0))}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DollarSign className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="text-gray-400 text-sm">V-Cash</span>
                      </div>
                      <span className="text-blue-400 font-bold">
                        {formatCurrency(portfolio?.v_cash_balance || 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BarChart3 className="w-5 h-5 text-purple-400 mr-2" />
                        <span className="text-gray-400 text-sm">Portfolio</span>
                      </div>
                      <span className="text-purple-400 font-bold">
                        {formatCurrency(portfolio?.total_portfolio_value || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Cyberpunk V-Card Component */}
            <VCard3D 
              portfolio={portfolio} 
              profile={profile} 
              className="w-full max-w-none md:max-w-md lg:max-w-none mx-auto"
            />
          </div>
        </div>
      </main>

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Edit Profile</h3>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              {/* Profile Picture */}
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-cyan-400/30 shadow-lg shadow-cyan-500/20">
                    {editData.avatar_url ? (
                      <img 
                        src={editData.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <User className="w-12 h-12 text-cyan-400" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-600 hover:bg-cyan-700 rounded-full flex items-center justify-center transition-colors"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editData.full_name || ''}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="120"
                    value={editData.age || ''}
                    onChange={(e) => setEditData({ ...editData, age: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                    placeholder="Enter your age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    value={editData.gender || ''}
                    onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                  >
                    <option value="" className="bg-gray-800">Select gender</option>
                    <option value="male" className="bg-gray-800">Male</option>
                    <option value="female" className="bg-gray-800">Female</option>
                    <option value="non-binary" className="bg-gray-800">Non-binary</option>
                    <option value="prefer-not-to-say" className="bg-gray-800">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={editData.occupation || ''}
                    onChange={(e) => setEditData({ ...editData, occupation: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                    placeholder="Enter your occupation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Investment Experience
                  </label>
                  <select
                    value={editData.investment_experience || ''}
                    onChange={(e) => setEditData({ ...editData, investment_experience: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                  >
                    <option value="" className="bg-gray-800">Select experience level</option>
                    <option value="beginner" className="bg-gray-800">Beginner</option>
                    <option value="intermediate" className="bg-gray-800">Intermediate</option>
                    <option value="advanced" className="bg-gray-800">Advanced</option>
                    <option value="expert" className="bg-gray-800">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Risk Tolerance
                  </label>
                  <select
                    value={editData.risk_tolerance || ''}
                    onChange={(e) => setEditData({ ...editData, risk_tolerance: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                  >
                    <option value="" className="bg-gray-800">Select risk tolerance</option>
                    <option value="conservative" className="bg-gray-800">Conservative</option>
                    <option value="moderate" className="bg-gray-800">Moderate</option>
                    <option value="aggressive" className="bg-gray-800">Aggressive</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-6 border-t border-white/10">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex items-center px-6 py-3 border border-green-500/50 hover:border-green-400 hover:bg-green-500/10 text-green-400 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  )}
                  Save Profile
                </button>

                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center px-6 py-3 border border-yellow-500/50 hover:border-yellow-400 hover:bg-yellow-500/10 text-yellow-400 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Change Password
                </button>

                <button
                  onClick={() => setShowEmailForm(true)}
                  className="flex items-center px-6 py-3 border border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10 text-blue-400 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Change Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[70]">
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-white/20">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Change Password</h3>
              <button
                onClick={() => setShowPasswordForm(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Meter */}
                {passwordData.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Password Strength</span>
                      <span className={`font-medium ${
                        getPasswordStrength(passwordData.newPassword) >= 3 ? 'text-green-400' : 
                        getPasswordStrength(passwordData.newPassword) >= 2 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {getPasswordStrengthText(getPasswordStrength(passwordData.newPassword))}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(getPasswordStrength(passwordData.newPassword))}`}
                        style={{ width: `${(getPasswordStrength(passwordData.newPassword) / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {errors.password && (
                <div className="flex items-center p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-400 text-sm">{errors.password}</span>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center px-6 py-3 border border-green-500/50 hover:border-green-400 hover:bg-green-500/10 text-green-400 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[70]">
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-white/20">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Change Email</h3>
              <button
                onClick={() => setShowEmailForm(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Email Address</label>
                <input
                  type="email"
                  value={emailData.newEmail}
                  onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="Enter new email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <input
                  type="password"
                  value={emailData.password}
                  onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="Enter current password"
                />
              </div>

              {errors.email && (
                <div className="flex items-center p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-400 text-sm">{errors.email}</span>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleEmailChange}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center px-6 py-3 border border-green-500/50 hover:border-green-400 hover:bg-green-500/10 text-green-400 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Update Email'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-500/20 border border-green-500/50 rounded-lg p-4 z-[80]">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-green-400">{success}</span>
          </div>
        </div>
      )}

      {/* Background Animation Styles */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(1);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.5);
          }
        }

        @keyframes sparkle {
          0%, 100% { 
            opacity: 0.4; 
            transform: scale(1) rotate(0deg);
          }
          25% { 
            opacity: 0.8; 
            transform: scale(1.3) rotate(90deg);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.6) rotate(180deg);
          }
          75% { 
            opacity: 0.8; 
            transform: scale(1.3) rotate(270deg);
          }
        }

        @keyframes float-gentle {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
          }
          25% { 
            transform: translateY(-15px) translateX(10px); 
          }
          50% { 
            transform: translateY(-25px) translateX(-5px); 
          }
          75% { 
            transform: translateY(-10px) translateX(-15px); 
          }
        }

        @keyframes drift {
          0% { 
            transform: translateY(100vh) translateX(0px) rotate(0deg); 
            opacity: 0; 
          }
          10% { 
            opacity: 1; 
          }
          90% { 
            opacity: 1; 
          }
          100% { 
            transform: translateY(-100vh) translateX(50px) rotate(360deg); 
            opacity: 0; 
          }
        }

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

        @keyframes diamond-shine {
          0%, 100% { 
            opacity: 0.5; 
            transform: scale(1) rotate(0deg);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2) rotate(45deg);
          }
        }

        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 4s ease-in-out infinite;
        }

        .animate-float-gentle {
          animation: float-gentle 8s ease-in-out infinite;
        }

        .animate-drift {
          animation: drift 20s linear infinite;
        }

        .shining-star,
        .glowing-orb,
        .shining-diamond,
        .floating-particle {
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        /* Ensure fixed background attachment works properly */
        body {
          background-attachment: fixed;
        }
      `}</style>
    </div>
  );
};