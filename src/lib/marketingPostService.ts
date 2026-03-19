import { supabase } from './supabase';

export type Platform = 'instagram' | 'twitter' | 'facebook' | 'youtube' | 'tiktok';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface MarketingPost {
  id: string;
  artist_id?: string;
  title: string;
  content: string;
  platform: Platform;
  scheduled_date: string;
  scheduled_time: string;
  status: PostStatus;
  media_url: string;
  tags: string[];
  author_id?: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  platform: Platform;
  scheduled_date: string;
  scheduled_time: string;
  status?: PostStatus;
  media_url?: string;
  tags?: string[];
  artist_id?: string;
  done?: boolean;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  platform?: Platform;
  scheduled_date?: string;
  scheduled_time?: string;
  status?: PostStatus;
  media_url?: string;
  tags?: string[];
  done?: boolean;
}

export async function getPosts(): Promise<MarketingPost[]> {
  const { data, error } = await supabase
    .from('marketing_posts')
    .select('*')
    .order('scheduled_date', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }

  return (data || []).map(post => ({
    ...post,
    tags: post.tags || [],
  }));
}

export async function getPost(id: string): Promise<MarketingPost | null> {
  const { data, error } = await supabase
    .from('marketing_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching post:', error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    tags: data.tags || [],
  };
}

export async function createPost(postData: CreatePostData): Promise<MarketingPost> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('marketing_posts')
    .insert({
      ...postData,
      status: postData.status || 'draft',
      media_url: postData.media_url || '',
      tags: postData.tags || [],
      done: postData.done || false,
      author_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw error;
  }

  return {
    ...data,
    tags: data.tags || [],
  };
}

export async function updatePost(id: string, updates: UpdatePostData): Promise<MarketingPost> {
  const { data, error } = await supabase
    .from('marketing_posts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating post:', error);
    throw error;
  }

  return {
    ...data,
    tags: data.tags || [],
  };
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase
    .from('marketing_posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

export async function togglePostDone(id: string, done: boolean): Promise<MarketingPost> {
  return updatePost(id, { done });
}

export async function getPostsByDateRange(startDate: string, endDate: string): Promise<MarketingPost[]> {
  const { data, error } = await supabase
    .from('marketing_posts')
    .select('*')
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching posts by date range:', error);
    throw error;
  }

  return (data || []).map(post => ({
    ...post,
    tags: post.tags || [],
  }));
}

export async function getPostsByPlatform(platform: Platform): Promise<MarketingPost[]> {
  const { data, error } = await supabase
    .from('marketing_posts')
    .select('*')
    .eq('platform', platform)
    .order('scheduled_date', { ascending: false });

  if (error) {
    console.error('Error fetching posts by platform:', error);
    throw error;
  }

  return (data || []).map(post => ({
    ...post,
    tags: post.tags || [],
  }));
}
