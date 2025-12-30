export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
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
      reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
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
    }
  }
}
