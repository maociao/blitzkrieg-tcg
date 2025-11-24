import React from 'react';
import { getCardImageUrl } from '../data/cards';

const CardArt = ({ type, id, artPrompt }) => {
  const imageUrl = getCardImageUrl(id, artPrompt, type);

  return (
    <div className="w-full h-24 rounded-md overflow-hidden relative mb-2 bg-gray-700">
      <img 
        src={imageUrl} 
        alt={type}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default CardArt;
