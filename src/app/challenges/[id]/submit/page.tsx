'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Upload, 
  Image, 
  Video, 
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogIn,
} from 'lucide-react';
import { PageContainer, Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useChallenge, useSubmitChallenge } from '@/hooks/use-challenges';
import { useAuth } from '@/components/providers/auth-provider';

/**
 * Submit Proof Page
 * Upload proof for a specific challenge
 */
export default function SubmitPage({ params }: { params: { id: string } }) {
  const challengeId = params.id;
  const router = useRouter();
  const { isAuthenticated, userId, isLoading: userLoading, walletAddress } = useAuth();
  const { challenge, isLoading } = useChallenge(challengeId);
  const { submit, isSubmitting, error: submitError, isSuccess } = useSubmitChallenge();

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload an image (JPG, PNG, GIF, WebP) or video (MP4, WebM)');
      return;
    }

    // Validate file size (50MB max)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!isAuthenticated || !userId) {
      setError('Please login to submit proof');
      return;
    }
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      await submit({
        challengeId,
        userId: userId,
        file,
        caption: caption.trim() || undefined,
      });
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  // Loading state
  if (isLoading || userLoading) {
    return (
      <PageContainer>
        <Header 
          title="Submit Proof"
          leftAction={
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          }
        />
        <SkeletonCard />
      </PageContainer>
    );
  }

  // Not logged in state
  if (!isAuthenticated) {
    return (
      <PageContainer>
        <Header 
          title="Submit Proof"
          leftAction={
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          }
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
        >
          <div className="w-20 h-20 rounded-full bg-surface-800 flex items-center justify-center mb-6">
            <LogIn className="w-10 h-10 text-surface-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-surface-400 mb-8 max-w-xs">
            You need to login to submit proof for this challenge.
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <Link href="/auth/login" className="block">
              <Button className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Login to Continue
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </div>
        </motion.div>
      </PageContainer>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <PageContainer>
        <Header 
          title="Submitted!"
          leftAction={
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          }
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Proof Submitted!</h2>
          <p className="text-surface-400 mb-8 max-w-xs">
            Your submission is being reviewed. You'll receive your badge soon!
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <Button 
              className="w-full" 
              onClick={() => router.push(`/challenges/${challengeId}`)}
            >
              View Challenge
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/feed')}
            >
              Go to Feed
            </Button>
          </div>
        </motion.div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header 
        title="Submit Proof"
        leftAction={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Challenge Info */}
        {challenge && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-white mb-1">{challenge.title}</h3>
              <p className="text-sm text-surface-400 line-clamp-2">
                {challenge.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        <AnimatePresence>
          {(error || submitError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error || submitError?.message || 'Something went wrong'}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Proof</CardTitle>
          </CardHeader>
          <CardContent>
            {preview ? (
              <div className="relative">
                <div className="aspect-video rounded-lg overflow-hidden bg-surface-800">
                  {file?.type.startsWith('video/') ? (
                    <video 
                      src={preview} 
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveFile}
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="mt-3 flex items-center gap-2 text-sm text-surface-400">
                  {file?.type.startsWith('video/') ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Image className="w-4 h-4" />
                  )}
                  <span className="truncate">{file?.name}</span>
                  <span className="text-surface-600">
                    ({(file?.size ? file.size / 1024 / 1024 : 0).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            ) : (
              <FileUpload
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
                  'video/*': ['.mp4', '.webm', '.mov'],
                }}
                maxSize={50 * 1024 * 1024}
                onFileSelect={handleFileSelect}
                className="h-48"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-surface-800 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-surface-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Upload your proof</p>
                    <p className="text-surface-500 text-sm mt-1">
                      Image or video, max 50MB
                    </p>
                  </div>
                </div>
              </FileUpload>
            )}
          </CardContent>
        </Card>

        {/* Caption */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Caption (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Tell us about your accomplishment..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-surface-500 mt-2 text-right">
              {caption.length}/500
            </p>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="pt-4 pb-24">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!file || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Submit Proof
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </PageContainer>
  );
}
