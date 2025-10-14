import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Share2, Sparkles, UtensilsCrossed, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { useMatches } from '@/hooks/useMatches';
import { toast } from '@/hooks/use-toast';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMatchesDialog, setShowMatchesDialog] = useState(false);
  const { sessionId, partnerSessionId, generateShareLink } = useSession();
  const { matches } = useMatches(sessionId, partnerSessionId);

  const copyShareLink = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied!",
      description: "Share this link with someone to match restaurants",
    });
  };

  const isOnRandomPage = location.pathname === '/random' || location.pathname === '/';

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-card">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <button 
            onClick={() => navigate('/random')}
            className="flex items-center justify-center transition-transform hover:scale-105"
          >
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
            </div>
          </button>
          <div className="flex-1 flex items-center justify-end gap-2">
            {isOnRandomPage ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/likes')}
              >
                <Heart className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/random')}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            )}
            {partnerSessionId && matches.length > 0 && (
              <Dialog open={showMatchesDialog} onOpenChange={setShowMatchesDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    {matches.length} Match{matches.length !== 1 && 'es'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Your Matches</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {matches.map((match) => (
                      <Card key={match.id}>
                        <CardContent className="p-4">
                          <h3 className="font-semibold">{match.restaurant_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            You both liked this restaurant!
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Your Link</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Share this link with someone. When they like the same restaurants as you, you'll both see matches!
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generateShareLink()}
                      className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
                    />
                    <Button onClick={copyShareLink}>
                      Copy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};
