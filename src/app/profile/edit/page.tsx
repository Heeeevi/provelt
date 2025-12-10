'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Camera,
  Save,
  Loader2,
  User,
  AtSign,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { PageContainer, Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';

/**
 * Edit Profile Page
 * Allows users to update their profile information
 */
export default function EditProfilePage() {
  const router = useRouter();
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, refetch } = useProfile(userId || '');
  const updateProfile = useUpdateProfile();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Populate form with existing profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    setIsUploading(true);

    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      setMessage({ type: 'success', text: 'Avatar uploaded!' });
    } catch (error) {
      console.error('Avatar upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload avatar' });
    } finally {
      setIsUploading(false);
    }
  };

  // Save profile
  const handleSave = async () => {
    if (!profile) return;

    // Validate
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name is required' });
      return;
    }

    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Username is required' });
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setMessage({ type: 'error', text: 'Username can only contain letters, numbers, and underscores' });
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile.mutateAsync({
        userId: profile.id,
        data: {
          display_name: displayName.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl || null,
        },
      });

      setMessage({ type: 'success', text: 'Profile updated!' });
      await refetch();
      setTimeout(() => router.back(), 500);
    } catch (error: any) {
      console.error('Save error:', error);
      if (error.message?.includes('duplicate') || error.code === '23505') {
        setMessage({ type: 'error', text: 'Username is already taken' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save profile' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <PageContainer>
        <Header 
          title="Edit Profile"
          leftAction={
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          }
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header 
        title="Edit Profile"
        leftAction={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        }
        rightAction={
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Message Banner */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'error' 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </motion.div>
        )}

        {/* Avatar Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar size="lg">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {displayName?.[0] || username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              
              <p className="mt-3 text-sm text-surface-400">
                Tap to change avatar
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Fields */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="displayName" className="flex items-center gap-2 text-sm font-medium text-white">
                <User className="w-4 h-4" />
                Display Name
              </label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                maxLength={50}
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="flex items-center gap-2 text-sm font-medium text-white">
                <AtSign className="w-4 h-4" />
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="your_username"
                maxLength={30}
              />
              <p className="text-xs text-surface-500">
                Letters, numbers, and underscores only
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label htmlFor="bio" className="flex items-center gap-2 text-sm font-medium text-white">
                <FileText className="w-4 h-4" />
                Bio
              </label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-surface-500">
                {bio.length}/160 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          className="w-full" 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </motion.div>
    </PageContainer>
  );
}
