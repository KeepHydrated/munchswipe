import { useEffect } from 'react';

interface AdCardProps {
  className?: string;
}

export const AdCard = ({ className = '' }: AdCardProps) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`w-full h-full bg-background rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      <div className="w-full h-full flex items-center justify-center p-4">
        <ins
          className="adsbygoogle"
          style={{ 
            display: 'block',
            minWidth: '300px',
            minHeight: '250px',
            width: '100%',
            height: '100%'
          }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="1234567890"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
