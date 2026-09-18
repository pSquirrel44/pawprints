export type Species = 'cat' | 'dog';

export interface User {
  id: number;
  clerk_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  species: Species;
  created_at: string;
  following_count?: number;
  follower_count?: number;
  post_count?: number;
  is_following?: boolean;
}

export interface Post {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  user_species: Species;
  content: string;
  image_url: string;
  species: Species;
  created_at: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  author_is_following?: boolean;
  location?: string;
  category?: string;
  video_url?: string;
  media_type?: 'image' | 'video';
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  content: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  sender_username: string;
  sender_name: string;
  sender_avatar: string;
  recipient_username: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  other_user_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  species: Species;
  last_msg: string;
  last_at: string;
  unread_count: number;
}

export interface Notification {
  id: number;
  type: 'like' | 'comment' | 'follow' | 'message';
  actor_username: string;
  actor_name: string;
  actor_avatar: string;
  post_preview?: string;
  read_at: string | null;
  created_at: string;
}
