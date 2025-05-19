
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface InitialChoiceViewProps {
  onViewChange: (view: 'player_view' | 'admin_view') => void;
  isAdmin: boolean;
}

const InitialChoiceView: React.FC<InitialChoiceViewProps> = ({ onViewChange }) => {
  const { profile } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Bienvenido al Juego de Tácticas
      </h1>
      <div className="max-w-md mx-auto space-y-4">
        <Button
          className="w-full py-8 text-lg"
          onClick={() => onViewChange('player_view')}
        >
          Resolver problemas
        </Button>

        {profile?.roles?.socio === true && (
          <Button
            className="w-full py-8 text-lg"
            variant="outline"
            onClick={() => onViewChange('admin_view')}
          >
            Crear sala de problemas como anfitrión
          </Button>
        )}
      </div>
    </div>
  );
};

export default InitialChoiceView;
