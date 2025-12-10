'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from '@/components/ui/file-upload';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { 
  uploadSubmissionMedia, 
  validateFile, 
  getMediaType 
} from '@/lib/supabase/storage';

interface SubmissionFormProps {
  challengeId: string;
  challengeTitle: string;
  userId: string;
  onSuccess?: (submissionId: string) => void;
  onCancel?: () => void;
  className?: string;
}

type SubmissionStep = 'upload' | 'caption' | 'submitting' | 'success' | 'error';

export function SubmissionForm({
  challengeId,
  challengeTitle,
  userId,
  onSuccess,
  onCancel,
  className,
}: SubmissionFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<SubmissionStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = useCallback((selectedFile: File) => {
    // Validate file
    const validation = validateFile(selectedFile, {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/quicktime',
      ],
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
    setStep('caption');
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setStep('upload');
  }, [preview]);

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setStep('submitting');
    setError(null);
    setUploadProgress(0);

    try {
      // Step 1: Upload media to Supabase Storage
      setUploadProgress(20);
      const uploadResult = await uploadSubmissionMedia(userId, challengeId, file);

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload media');
      }

      setUploadProgress(60);

      // Step 2: Create submission record via API
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          mediaUrl: uploadResult.url,
          mediaType: getMediaType(file),
          caption: caption.trim() || null,
        }),
      });

      setUploadProgress(80);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create submission');
      }

      setUploadProgress(100);
      setSubmissionId(data.submission.id);
      setStep('success');
      
      // Callback on success
      onSuccess?.(data.submission.id);

    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Submission failed');
      setStep('error');
    }
  }, [file, userId, challengeId, caption, onSuccess]);

  const handleRetry = useCallback(() => {
    setError(null);
    setStep('caption');
  }, []);

  const handleViewSubmission = useCallback(() => {
    if (submissionId) {
      router.push(`/feed`);
    }
  }, [submissionId, router]);

  // Render based on current step
  return (
    <div className={cn('w-full', className)}>
      <AnimatePresence mode="wait">
        {/* Upload Step */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-surface-800/50 border-surface-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-brand-400" />
                  Upload Your Proof
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  accept={{
                    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
                    'video/*': ['.mp4', '.webm', '.mov'],
                  }}
                  maxSize={50 * 1024 * 1024}
                  onFileSelect={handleFileSelect}
                  className="min-h-[200px]"
                >
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-surface-700 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-surface-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium">
                        Drop your proof here or click to browse
                      </p>
                      <p className="text-surface-500 text-sm mt-1">
                        Images or videos up to 50MB
                      </p>
                    </div>
                    <div className="flex gap-2 text-surface-500 text-xs">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        PNG, JPG, GIF, WebP
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        MP4, WebM, MOV
                      </span>
                    </div>
                  </div>
                </FileUpload>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {onCancel && (
                  <Button
                    variant="ghost"
                    onClick={onCancel}
                    className="mt-4 w-full"
                  >
                    Cancel
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Caption Step */}
        {step === 'caption' && (
          <motion.div
            key="caption"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-surface-800/50 border-surface-700">
              <CardHeader>
                <CardTitle className="text-lg">Add Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview */}
                {preview && (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-900">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-surface-900/80 hover:bg-surface-900"
                      onClick={handleRemoveFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* File info */}
                <div className="flex items-center gap-3 text-sm text-surface-400">
                  {file?.type.startsWith('video/') ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  <span className="truncate flex-1">{file?.name}</span>
                  <span className="text-surface-600">
                    {((file?.size || 0) / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                {/* Caption input */}
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Caption (optional)
                  </label>
                  <Textarea
                    placeholder="Describe your proof or add a message..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-surface-500 mt-1 text-right">
                    {caption.length}/500
                  </p>
                </div>

                {/* Challenge info */}
                <div className="p-3 rounded-lg bg-surface-900/50 border border-surface-700">
                  <p className="text-xs text-surface-500">Submitting to</p>
                  <p className="text-white font-medium">{challengeTitle}</p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRemoveFile}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-brand-500 hover:bg-brand-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Proof
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Submitting Step */}
        {step === 'submitting' && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-surface-800/50 border-surface-700">
              <CardContent className="py-12 text-center">
                <Loader2 className="w-12 h-12 mx-auto text-brand-400 animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Submitting Your Proof
                </h3>
                <p className="text-surface-400 text-sm mb-6">
                  Please wait while we upload your media...
                </p>
                
                {/* Progress bar */}
                <div className="w-full max-w-xs mx-auto">
                  <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-brand-500 to-accent-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-surface-500 mt-2">
                    {uploadProgress < 50 
                      ? 'Uploading media...'
                      : uploadProgress < 90
                      ? 'Creating submission...'
                      : 'Almost done...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="py-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, delay: 0.1 }}
                >
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Proof Submitted! 🎉
                </h3>
                <p className="text-surface-400 mb-6">
                  Your submission is being reviewed. You&apos;ll be notified when it&apos;s approved.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleViewSubmission}
                    className="bg-brand-500 hover:bg-brand-600"
                  >
                    View in Feed
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/challenges')}
                  >
                    More Challenges
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Submission Failed
                </h3>
                <p className="text-surface-400 mb-2">
                  {error || 'Something went wrong. Please try again.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Button
                    onClick={handleRetry}
                    className="bg-brand-500 hover:bg-brand-600"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
