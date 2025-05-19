
import React, { useState } from 'react';
import { useGameSocket } from '@/contexts/GameSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import InitialChoiceView from '@/components/game/InitialChoiceView';
import PlayerView from '@/components/game/PlayerView';
import AdminView from '@/components/game/AdminView';

const GamePage: React.FC = () => {
  const { isConnected } = useGameSocket();
  const { user, profile } = useAuth();
  const [view, setView] = useState<'initial_choice' | 'player_view' | 'admin_view'>('initial_choice');

  const isAdmin = profile?.roles?.site_admin === true;
  console.log('[GamePage] User object:', user);
  console.log('[GamePage] Profile object:', profile);
  console.log('[GamePage] Is admin?', isAdmin);

  if (!isConnected) {
    return <div className="text-center p-8">Conectando...</div>;
  }

  if (view === 'initial_choice') {
    return <InitialChoiceView onViewChange={setView} isAdmin={isAdmin} />;
  }

  if (view === 'player_view') {
    return <PlayerView />;
  }

  if (view === 'admin_view') {
    if (!isAdmin) {
      console.log('[GamePage] Unauthorized admin access attempt, redirecting to player view');
      setView('player_view');
      return <PlayerView />;
    }
    return <AdminView />;
  }

  return (
    <div className="section-container">
      <h1>Vista no implementada</h1>
    </div>
  );
};

export default GamePage;
