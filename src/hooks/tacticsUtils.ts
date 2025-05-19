
import { useState } from 'react';
import { TacticsPuzzle, fetchAvailableTags, fetchPuzzlesByTags, fetchUserSavedPuzzles, saveUserPuzzle } from '@/lib/utils/tacticsUtils';
import { PuzzleState } from '@/lib/types/game';
import { Dispatch, SetStateAction } from 'react';

type SetPuzzlesConfigFunction = Dispatch<SetStateAction<PuzzleState[]>>;

export const useLoadSiteTactics = (setPuzzlesConfig: SetPuzzlesConfigFunction, currentPuzzleIndexForSetup: number) => {
  const [siteTags, setSiteTags] = useState<string[]>([]);
  const [siteTacticsForSelectedTag, setSiteTacticsForSelectedTag] = useState<TacticsPuzzle[]>([]);
  const [selectedSiteTag, setSelectedSiteTag] = useState<string | null>(null);
  const [isLoadingTactics, setIsLoadingTactics] = useState(false);

  const loadSiteTags = async () => {
    setIsLoadingTactics(true);
    try {
      const tags = await fetchAvailableTags();
      setSiteTags(tags);
    } catch (error) {
      console.error('Error loading site tags:', error);
    } finally {
      setIsLoadingTactics(false);
    }
  };

  const handleSiteTagChange = async (tag: string) => {
    setSelectedSiteTag(tag);
    setIsLoadingTactics(true);
    try {
      const tactics = await fetchPuzzlesByTags([tag]);
      setSiteTacticsForSelectedTag(tactics);
    } catch (error) {
      console.error('Error loading tactics for tag:', error);
    } finally {
      setIsLoadingTactics(false);
    }
  };

  const applySiteTacticToSetup = (tactic: TacticsPuzzle) => {
    setPuzzlesConfig(prev => {
      const newConfig = [...prev];
      newConfig[currentPuzzleIndexForSetup] = {
        position: tactic.fen,
        mainLine: tactic.solution,
        timer: tactic.timer || 60,
        points: tactic.points || 3
      };
      return newConfig;
    });
  };

  return {
    siteTags,
    siteTacticsForSelectedTag,
    selectedSiteTag,
    isLoadingTactics,
    loadSiteTags,
    handleSiteTagChange,
    applySiteTacticToSetup
  };
};

export const useLoadUserSavedTactics = (setPuzzlesConfig: SetPuzzlesConfigFunction, currentPuzzleIndexForSetup: number, userId: string) => {
  const [userSavedTacticsList, setUserSavedTacticsList] = useState<TacticsPuzzle[]>([]);
  const [isLoadingTactics, setIsLoadingTactics] = useState(false);

  const loadUserSavedTactics = async () => {
    setIsLoadingTactics(true);
    try {
      const tactics = await fetchUserSavedPuzzles(userId);
      setUserSavedTacticsList(tactics);
    } catch (error) {
      console.error('Error loading user tactics:', error);
    } finally {
      setIsLoadingTactics(false);
    }
  };

  const applyUserTacticToSetup = (tactic: TacticsPuzzle) => {
    setPuzzlesConfig(prev => {
      const newConfig = [...prev];
      newConfig[currentPuzzleIndexForSetup] = {
        position: tactic.fen,
        mainLine: tactic.solution,
        timer: tactic.timer || 60,
        points: tactic.points || 3
      };
      return newConfig;
    });
  };

  return {
    userSavedTacticsList,
    isLoadingTactics,
    loadUserSavedTactics,
    applyUserTacticToSetup
  };
};

export const useSaveCurrentSetupAsUserTactic = (
  puzzlesConfig: PuzzleState[],
  currentPuzzleIndexForSetup: number,
  puzzleName: string,
  userId: string,
  description: string,
  difficulty: string,
  tags: string
) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCurrentSetupAsUserTactic = async () => {
    if (!puzzleName.trim()) return;

    setIsSaving(true);
    try {
      const currentSetup = puzzlesConfig[currentPuzzleIndexForSetup];
      const puzzleDataForSupabase = {
        title: puzzleName.trim(),
        fen: currentSetup.position,
        solution: currentSetup.mainLine || '',
        timer: currentSetup.timer,
        points: currentSetup.points,
        description: description.trim(),
        difficulty: difficulty,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        created_by: userId
      };

      await saveUserPuzzle(puzzleDataForSupabase);
    } catch (error) {
      console.error('Error saving user tactic:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    handleSaveCurrentSetupAsUserTactic,
    isSaving
  };
};
