export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          cover_image_url: string | null
          bio: string | null
          role: string
          last_access_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          cover_image_url?: string | null
          bio?: string | null
          role?: string
          last_access_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          cover_image_url?: string | null
          bio?: string | null
          role?: string
          last_access_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string | null
          type: string | null
          original_post_id: string | null
          original_group_post_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          type?: string | null
          original_post_id?: string | null
          original_group_post_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
          type?: string | null
          original_post_id?: string | null
          original_group_post_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      post_images: {
        Row: {
          id: string
          post_id: string
          image_url: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          image_url: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          image_url?: string
          order_index?: number
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          post_id: string | null
          comment_id: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          comment_id?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          comment_id?: string | null
          user_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      comment_images: {
        Row: {
          id: string
          comment_id: string
          image_url: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          image_url: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          image_url?: string
          order_index?: number
          created_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          post_id: string | null
          comment_id: string | null
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          comment_id?: string | null
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          comment_id?: string | null
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      reposts: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      custom_stamps: {
        Row: {
          id: string
          user_id: string
          image_url: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          related_user_id: string
          related_post_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          related_user_id: string
          related_post_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          related_user_id?: string
          related_post_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      hangouts: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          location: string | null
          date: string | null
          time: string | null
          image_url: string | null
          visibility_type: 'all' | 'selected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          location?: string | null
          date?: string | null
          time?: string | null
          visibility_type?: 'all' | 'selected'
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          location?: string | null
          date?: string | null
          time?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hangout_responses: {
        Row: {
          id: string
          hangout_id: string
          user_id: string
          response: 'yes' | 'no' | 'maybe'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hangout_id: string
          user_id: string
          response: 'yes' | 'no' | 'maybe'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hangout_id?: string
          user_id?: string
          response?: 'yes' | 'no' | 'maybe'
          created_at?: string
          updated_at?: string
        }
      }
      hangout_visibility: {
        Row: {
          id: string
          hangout_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          hangout_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          hangout_id?: string
          user_id?: string
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          cover_image_url: string | null
          owner_id: string
          join_type: 'free' | 'approval'
          visibility_type: 'public' | 'private'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          cover_image_url?: string | null
          owner_id: string
          join_type?: 'free' | 'approval'
          visibility_type?: 'public' | 'private'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          cover_image_url?: string | null
          owner_id?: string
          join_type?: 'free' | 'approval'
          visibility_type?: 'public' | 'private'
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          is_active: boolean
          joined_at: string
          left_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
        }
      }
      group_join_requests: {
        Row: {
          id: string
          group_id: string
          user_id: string
          status: 'pending' | 'approved' | 'rejected'
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
      group_posts: {
        Row: {
          id: string
          group_id: string
          user_id: string
          content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          content?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      group_post_images: {
        Row: {
          id: string
          group_post_id: string
          image_url: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          group_post_id: string
          image_url: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          group_post_id?: string
          image_url?: string
          order_index?: number
          created_at?: string
        }
      }
      group_post_comments: {
        Row: {
          id: string
          group_post_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_post_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_post_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_post_comment_images: {
        Row: {
          id: string
          group_post_comment_id: string
          image_url: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          group_post_comment_id: string
          image_url: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          group_post_comment_id?: string
          image_url?: string
          order_index?: number
          created_at?: string
        }
      }
      group_post_likes: {
        Row: {
          id: string
          group_post_id: string | null
          group_post_comment_id: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          group_post_id?: string | null
          group_post_comment_id?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          group_post_id?: string | null
          group_post_comment_id?: string | null
          user_id?: string
          created_at?: string
        }
      }
      group_post_reactions: {
        Row: {
          id: string
          group_post_id: string | null
          group_post_comment_id: string | null
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          group_post_id?: string | null
          group_post_comment_id?: string | null
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          group_post_id?: string | null
          group_post_comment_id?: string | null
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      feedbacks: {
        Row: {
          id: string
          user_id: string
          content: string
          status: 'pending' | 'in_progress' | 'completed' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          status?: 'pending' | 'in_progress' | 'completed' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'declined'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
