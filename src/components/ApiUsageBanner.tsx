import React from 'react';
import { AlertTriangle, X, TrendingUp } from 'lucide-react';
import { useApiUsageTracker } from '@/hooks/useApiUsageTracker';
import { Button } from '@/components/ui/button';

interface ApiUsageBannerProps {
  onDismiss?: () => void;
}

const ApiUsageBanner: React.FC<ApiUsageBannerProps> = ({ onDismiss }) => {
  const { usage, getUsagePercentage, isApproachingLimit, isOverLimit, getEstimatedCost, limits } = useApiUsageTracker();

  const percentage = Math.round(getUsagePercentage());
  const estimatedCost = getEstimatedCost();

  if (!isApproachingLimit() && !isOverLimit()) {
    return null;
  }

  const isOver = isOverLimit();

  return (
    <div className={`fixed top-16 left-0 right-0 z-50 mx-4 md:mx-auto md:max-w-2xl ${
      isOver ? 'bg-destructive/95' : 'bg-amber-500/95'
    } text-white rounded-lg shadow-lg p-4 backdrop-blur-sm`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm">
            {isOver ? 'API Free Tier Exceeded!' : 'Approaching API Free Tier Limit'}
          </h4>
          <p className="text-xs mt-1 opacity-90">
            You've used {percentage}% of your monthly Google Maps free tier.
          </p>
          <div className="mt-2 text-xs space-y-1 opacity-80">
            <div className="flex justify-between">
              <span>Nearby Search:</span>
              <span>{usage.nearbySearchCalls.toLocaleString()} / {limits.nearbySearch.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Place Details:</span>
              <span>{usage.placeDetailsCalls.toLocaleString()} / {limits.placeDetails.toLocaleString()}</span>
            </div>
            {estimatedCost > 0 && (
              <div className="flex justify-between font-semibold pt-1 border-t border-white/20">
                <span>Est. Monthly Cost:</span>
                <span>${estimatedCost.toFixed(2)}</span>
              </div>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${isOver ? 'bg-white' : 'bg-white/80'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-white hover:bg-white/20"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ApiUsageBanner;
