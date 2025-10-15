import { Button } from '@/components/ui/button';
import { Heart, UtensilsCrossed, Sparkles, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-card">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/likes')}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center transition-transform hover:scale-105"
          >
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/matches')}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
