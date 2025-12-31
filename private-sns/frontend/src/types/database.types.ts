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
    }
  }
}
