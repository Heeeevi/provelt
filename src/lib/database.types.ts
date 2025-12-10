/**
 * PROVELT Database Types
 * Auto-generated types for Supabase tables
 * Run `npm run db:generate` to regenerate after schema changes
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types matching PostgreSQL enums
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';
export type MediaType = 'image' | 'video' | 'text';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type ChallengeCategory = 
  | 'coding'
  | 'design'
  | 'fitness'
  | 'music'
  | 'art'
  | 'cooking'
  | 'language'
  | 'productivity'
  | 'mindfulness'
  | 'other';
export type ReactionType = 'like' | 'fire' | 'clap' | 'mindblown' | 'heart';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          wallet_address: string | null;
          total_points: number;
          badges_count: number;
          submissions_count: number;
          streak_days: number;
          longest_streak: number;
          is_public: boolean;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
          last_active_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          wallet_address?: string | null;
          total_points?: number;
          badges_count?: number;
          submissions_count?: number;
          streak_days?: number;
          longest_streak?: number;
          is_public?: boolean;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          wallet_address?: string | null;
          total_points?: number;
          badges_count?: number;
          submissions_count?: number;
          streak_days?: number;
          longest_streak?: number;
          is_public?: boolean;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          title: string;
          description: string;
          instructions: string | null;
          difficulty: DifficultyLevel;
          category: ChallengeCategory;
          tags: string[];
          points: number;
          badge_image_url: string | null;
          badge_name: string | null;
          starts_at: string;
          ends_at: string;
          is_active: boolean;
          is_featured: boolean;
          submissions_count: number;
          completions_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          instructions?: string | null;
          difficulty?: DifficultyLevel;
          category?: ChallengeCategory;
          tags?: string[];
          points?: number;
          badge_image_url?: string | null;
          badge_name?: string | null;
          starts_at: string;
          ends_at: string;
          is_active?: boolean;
          is_featured?: boolean;
          submissions_count?: number;
          completions_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          instructions?: string | null;
          difficulty?: DifficultyLevel;
          category?: ChallengeCategory;
          tags?: string[];
          points?: number;
          badge_image_url?: string | null;
          badge_name?: string | null;
          starts_at?: string;
          ends_at?: string;
          is_active?: boolean;
          is_featured?: boolean;
          submissions_count?: number;
          completions_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'challenges_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          media_url: string | null;
          media_type: MediaType;
          text_content: string | null;
          caption: string | null;
          status: SubmissionStatus;
          rejection_reason: string | null;
          nft_mint_address: string | null;
          nft_metadata_uri: string | null;
          nft_tx_signature: string | null;
          minted_at: string | null;
          reactions_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          media_url?: string | null;
          media_type: MediaType;
          text_content?: string | null;
          caption?: string | null;
          status?: SubmissionStatus;
          rejection_reason?: string | null;
          nft_mint_address?: string | null;
          nft_metadata_uri?: string | null;
          nft_tx_signature?: string | null;
          minted_at?: string | null;
          reactions_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          challenge_id?: string;
          media_url?: string | null;
          media_type?: MediaType;
          text_content?: string | null;
          caption?: string | null;
          status?: SubmissionStatus;
          rejection_reason?: string | null;
          nft_mint_address?: string | null;
          nft_metadata_uri?: string | null;
          nft_tx_signature?: string | null;
          minted_at?: string | null;
          reactions_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'submissions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'submissions_challenge_id_fkey';
            columns: ['challenge_id'];
            referencedRelation: 'challenges';
            referencedColumns: ['id'];
          }
        ];
      };
      badge_nfts: {
        Row: {
          id: string;
          user_id: string;
          submission_id: string;
          challenge_id: string;
          mint_address: string;
          metadata_uri: string;
          tx_signature: string;
          name: string;
          description: string | null;
          image_url: string;
          attributes: Json;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          submission_id: string;
          challenge_id: string;
          mint_address: string;
          metadata_uri: string;
          tx_signature: string;
          name: string;
          description?: string | null;
          image_url: string;
          attributes?: Json;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          submission_id?: string;
          challenge_id?: string;
          mint_address?: string;
          metadata_uri?: string;
          tx_signature?: string;
          name?: string;
          description?: string | null;
          image_url?: string;
          attributes?: Json;
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'badge_nfts_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'badge_nfts_submission_id_fkey';
            columns: ['submission_id'];
            referencedRelation: 'submissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'badge_nfts_challenge_id_fkey';
            columns: ['challenge_id'];
            referencedRelation: 'challenges';
            referencedColumns: ['id'];
          }
        ];
      };
      reactions: {
        Row: {
          id: string;
          user_id: string;
          submission_id: string;
          reaction_type: ReactionType;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          submission_id: string;
          reaction_type?: ReactionType;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          submission_id?: string;
          reaction_type?: ReactionType;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reactions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reactions_submission_id_fkey';
            columns: ['submission_id'];
            referencedRelation: 'submissions';
            referencedColumns: ['id'];
          }
        ];
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'follows_follower_id_fkey';
            columns: ['follower_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follows_following_id_fkey';
            columns: ['following_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          data: Json;
          is_read: boolean;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      difficulty_level: DifficultyLevel;
      media_type: MediaType;
      submission_status: SubmissionStatus;
      challenge_category: ChallengeCategory;
      reaction_type: ReactionType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================
// HELPER TYPES
// ============================================

// Extract row types from tables
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type Insertable<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type Updatable<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type Profile = Tables<'profiles'>;
export type Challenge = Tables<'challenges'>;
export type Submission = Tables<'submissions'>;
export type BadgeNft = Tables<'badge_nfts'>;
export type BadgeNFT = BadgeNft; // Alias for consistency
export type Reaction = Tables<'reactions'>;
export type Follow = Tables<'follows'>;
export type Notification = Tables<'notifications'>;

// Insert types
export type ProfileInsert = Insertable<'profiles'>;
export type ChallengeInsert = Insertable<'challenges'>;
export type SubmissionInsert = Insertable<'submissions'>;
export type BadgeNftInsert = Insertable<'badge_nfts'>;
export type ReactionInsert = Insertable<'reactions'>;
export type FollowInsert = Insertable<'follows'>;
export type NotificationInsert = Insertable<'notifications'>;

// Update types
export type ProfileUpdate = Updatable<'profiles'>;
export type ChallengeUpdate = Updatable<'challenges'>;
export type SubmissionUpdate = Updatable<'submissions'>;

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export interface SubmissionWithRelations extends Submission {
  profile?: Profile;
  challenge?: Challenge;
  user_reaction?: ReactionType | null;
}

export interface ChallengeWithStats extends Challenge {
  user_submitted?: boolean;
  user_completed?: boolean;
}

// Extended Challenge type with UI-friendly aliases
export interface ChallengeUI extends Challenge {
  // Aliases for UI compatibility
  start_time: string;
  end_time: string;
  xp_reward: number;
  submission_count: number;
  rules?: string[];
  status: 'active' | 'upcoming' | 'ended';
}

export interface ProfileWithStats extends Profile {
  followers_count?: number;
  following_count?: number;
  recent_badges?: BadgeNft[];
}

export interface FeedItem {
  submission: SubmissionWithRelations;
  profile: Profile;
  challenge: Challenge;
}

// ============================================
// API TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
