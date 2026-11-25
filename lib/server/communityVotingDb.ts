import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';

type CommunityPostRow = Database['public']['Tables']['community_posts']['Row'];
type VotingTopicRow = Database['public']['Tables']['voting_topics']['Row'];

export async function listCommunityPostsDb(): Promise<CommunityPostRow[]> {
  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Supabase community_posts select error: ${error.message}`);
  return data ?? [];
}

export async function listVotingTopicsDb(): Promise<VotingTopicRow[]> {
  const { data, error } = await supabaseAdmin
    .from('voting_topics')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Supabase voting_topics select error: ${error.message}`);
  return data ?? [];
}
