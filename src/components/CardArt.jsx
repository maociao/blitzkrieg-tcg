import React, { useState, useEffect } from 'react';
import { getCardImageUrl } from '../data/cards';
import { Loader2, WifiOff } from 'lucide-react';
import { storage } from '../firebase';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';

const CardArt = ({ type, id, artPrompt, customSeed, className = 'h-24' }) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Generate the pollination URL as a fallback/source
  const pollinationUrl = getCardImageUrl(id, artPrompt, type, customSeed);
  const storagePath = `card-art/${id}_${customSeed || 'default'}.jpg`;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    const loadArt = async () => {
      const storageRef = ref(storage, storagePath);
      
      try {
        // 1. Try to get from Firebase Storage Cache
        const cachedUrl = await getDownloadURL(storageRef);
        if (isMounted) {
            setCurrentImageUrl(cachedUrl);
            setIsLoading(false);
        }
      } catch (error) {
        // 2. If not found (or error), use Pollinations URL
        if (isMounted) {
            setCurrentImageUrl(pollinationUrl);
        }

        // 3. Attempt to Cache (Upload) in background
        // Only attempt if it's a standard card (no custom seed) to save storage space
        // and avoid caching every random variation.
        if (!customSeed) {
            try {
                const response = await fetch(pollinationUrl);
                if (response.ok) {
                    const blob = await response.blob();
                    await uploadBytes(storageRef, blob);
                    console.log(`[CardArt] Cached ${id} to Storage.`);
                }
            } catch (uploadErr) {
                console.warn("[CardArt] Failed to cache image:", uploadErr);
            }
        }
      }
    };

    loadArt();

    return () => { isMounted = false; };
  }, [id, artPrompt, type, customSeed, pollinationUrl, storagePath]);

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
      {currentImageUrl && (
        <img 
            key={currentImageUrl}
            src={currentImageUrl} 
            alt={type}
            className={`w-full h-full object-cover transition-all duration-500 ${isLoading || hasError ? 'opacity-0' : 'opacity-100 group-hover:scale-110'}`}
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => { 
                // If the cached URL failed (rare), maybe fallback to pollination? 
                // For now just show error.
                setIsLoading(false); 
                setHasError(true); 
            }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default CardArt;
