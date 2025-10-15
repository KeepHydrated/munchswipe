import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, Share2, UtensilsCrossed, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { toast } from '@/hooks/use-toast';

export const Header = () => {
  const navigate = useNavigate();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { sessionId, partnerSessionId, generateShareLink } = useSession();

  const copyShareLink = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link);
    setShowShareDialog(false);
    toast({
      title: "Link Copied!",
      description: "Share this link with someone to match restaurants",
      duration: 2000,
    });
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-card">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/likes')}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hidden')}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center transition-transform hover:scale-105"
          >
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
            </div>
          </button>
          <div className="flex-1 flex items-center justify-end gap-2">
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
