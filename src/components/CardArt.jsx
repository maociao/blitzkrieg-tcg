import React, { useState, useEffect } from 'react';
import { getCardImageUrl } from '../data/cards';
import { Loader2, WifiOff } from 'lucide-react';

const CardArt = ({ type, id, artPrompt, customSeed, className = 'h-24' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageUrl = getCardImageUrl(id, artPrompt, type, customSeed);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [imageUrl]);

  return (
    <div className={`w-full rounded-md overflow-hidden relative bg-gray-700 group-hover:shadow-inner transition-all ${className}`}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
           <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-transparent via-green-500/20 to-transparent animate-scan"></div>
           <Loader2 className="animate-spin text-green-500" size={24} />
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-20 text-red-500">
           <WifiOff size={20} />
        </div>
      )}
      <img 
        key={imageUrl}
        src={imageUrl} 
        alt={type}
        className={`w-full h-full object-cover transition-all duration-500 ${isLoading || hasError ? 'opacity-0' : 'opacity-100 group-hover:scale-110'}`}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => { setIsLoading(false); setHasError(true); }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default CardArt;
