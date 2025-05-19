import { supabase } from '@/lib/supabase';

export interface TacticsPuzzle {
  id: string;
  fen: string;
  solution: string;
  difficulty: string;
  tags: string[];
  title: string;
  description: string;
  created_at: string;
  created_by: string;
  timer?: number;
  points?: number;
}

export const fetchAvailableTags = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('tactics_puzzles')
    .select('tags');

  if (error) throw error;

  const allTags = data?.flatMap(p => p.tags) || [];
  return [...new Set(allTags)];
};

export const fetchPuzzlesByTags = async (tags: string[]): Promise<TacticsPuzzle[]> => {
  const { data, error } = await supabase
    .from('tactics_puzzles')
    .select('*')
    .contains('tags', tags);

  if (error) throw error;
  return data || [];
};

export const saveUserPuzzle = async (puzzle: Omit<TacticsPuzzle, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('user_saved_tactics')
    .insert([puzzle])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchUserSavedPuzzles = async (userId: string): Promise<TacticsPuzzle[]> => {
  const { data, error } = await supabase
    .from('user_saved_tactics')
    .select('*')
    .eq('created_by', userId);

  if (error) throw error;
  return data || [];
};