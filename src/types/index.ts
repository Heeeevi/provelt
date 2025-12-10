/**
 * PROVELT Application Types
 * Re-exports from database types and adds additional application-specific types
 */

// Re-export all database types
export type {
  Database,
  Json,
  DifficultyLevel,
  MediaType,
  SubmissionStatus,
  ChallengeCategory,
  ReactionType,
  Tables,
  Insertable,
  Updatable,
  Profile,
  Challenge,
  Submission,
  BadgeNft,
  Reaction,
  Follow,
  Notification,
  ProfileInsert,
  ChallengeInsert,
  SubmissionInsert,
  BadgeNftInsert,
  ReactionInsert,
  FollowInsert,
  NotificationInsert,
  ProfileUpdate,
  ChallengeUpdate,
  SubmissionUpdate,
  SubmissionWithRelations,
  ChallengeWithStats,
  ProfileWithStats,
  FeedItem,
  PaginatedResponse,
  ApiResponse,
} from '@/lib/database.types';

// Re-export validation schemas
export type {
  LoginForm,
  SignupForm,
  ProfileEditForm,
  SubmissionForm,
  Pagination,
  ApiError,
} from '@/lib/validations/schemas';

// ============================================
// FORM DATA TYPES
// ============================================

export interface SubmissionFormData {
  challengeId: string;
  mediaType: 'image' | 'video' | 'text';
  file?: File;
  textContent?: string;
  caption?: string;
}

export interface ProfileFormData {
  username: string;
  displayName: string;
  bio?: string;
  avatarFile?: File;
}

// ============================================
// WALLET TYPES
// ============================================

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  connecting: boolean;
  disconnecting: boolean;
}

// ============================================
// UI STATE TYPES
// ============================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: unknown;
}

// ============================================
// NFT METADATA TYPES
// ============================================

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: NFTAttribute[];
  properties: {
    category: string;
    creators: {
      address: string;
      share: number;
    }[];
  };
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface WithLoadingProps {
  isLoading?: boolean;
  loadingText?: string;
}

export interface WithErrorProps {
  error?: string | null;
}

// ============================================
// UTILITY TYPES
// ============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T> = () => Promise<T>;
export type ErrorCallback = (error: Error) => void;
export type SuccessCallback<T> = (data: T) => void;
