import React from 'react';
import { 
  Shield, 
  Swords, 
  ZoomIn, 
  ArrowUpCircle, 
  Flame, 
  Heart, 
  Target 
} from 'lucide-react';
import { CARD_DATABASE, RARITY_COLORS, getCardImageUrl } from '../data/cards';
import CardArt from './CardArt';

const Card = ({ cardId, onClick, disabled, size = 'normal', price = null, showStats = true, canAttack = true, isDeployed = false, isSelected = false, isAbilityUsed = false, currentAtk = null, currentDef = null, activeEffect = null, className = '', customSeed = null, allowFlip = false, showHoverOverlay = true, showInspectHint = true }) => {
  const data = CARD_DATABASE[cardId] || CARD_DATABASE['inf_rifle'];
  const selectionClass = isSelected ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] scale-105 z-30' : '';
  const baseClass = `relative rounded-lg transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-[1px] hover:shadow-lg cursor-pointer'} bg-transparent ${selectionClass} ${className} group [perspective:1000px]`;
  
  const displayAtk = currentAtk !== null ? currentAtk : data.atk;
  const displayDef = currentDef !== null ? currentDef : data.def;

  let sizeClass = '';
  if (size === 'small') sizeClass = 'w-20 h-32 text-[10px]';
  else if (size === 'medium') sizeClass = 'w-32 h-48 text-xs';
  else if (size === 'large') sizeClass = 'w-72 h-[28rem] text-base'; 
  else sizeClass = 'w-48 h-72 text-sm';

  const imageUrl = getCardImageUrl(cardId, data.artPrompt, data.type, customSeed);

  return (
    <div className={`${baseClass} ${sizeClass}`} onClick={!disabled ? onClick : undefined}>
      
      {/* TOOLTIP OVERLAY - Appears ON TOP of card (only if showHoverOverlay is true) */}
      {showHoverOverlay && !allowFlip && (
        <div className="absolute inset-0 bg-black/90 text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[60] flex flex-col justify-center items-center text-center rounded-lg backdrop-blur-sm">
            <div className="font-bold text-yellow-500 border-b border-gray-700 pb-2 mb-2 w-full text-sm">{data.name}</div>
            <div className="text-xs text-gray-300 leading-relaxed mb-2">{data.desc}</div>
            {data.supportEffect && (
            <div className="text-[10px] text-blue-300 pt-2 border-t border-gray-700 w-full">
                <span className="font-bold uppercase block mb-1">Support Action:</span> 
                {data.supportEffect.type === 'buff_def' ? 'Fortify' : data.supportEffect.type === 'heal' ? 'Heal' : 'Buff'} (+{data.supportEffect.val})
            </div>
            )}
            {!isDeployed && size === 'medium' && showInspectHint && (
                <div className="mt-auto text-[10px] text-gray-500 flex items-center justify-center gap-1">
                    <ZoomIn size={10} /> Click to Inspect
                </div>
            )}
        </div>
      )}

      {/* 3D Card Inner Container */}
      <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${!isDeployed && allowFlip ? 'group-hover:[transform:rotateY(180deg)]' : ''}`}>
        
        {/* === FRONT FACE === */}
        <div className={`absolute inset-0 flex flex-col rounded-lg border-2 p-2 bg-gray-900 [backface-visibility:hidden] ${RARITY_COLORS[data.rarity]}`}>
            <div className="flex justify-between items-center mb-1 z-10">
              <span className="font-bold truncate flex-1 mr-1 text-gray-100 drop-shadow-md">{data.name}</span>
              {showStats && <div className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow shrink-0 border border-blue-400">{data.cost}</div>}
            </div>
            
            {size === 'large' ? (
              <div className="w-full h-64 rounded-md overflow-hidden relative mb-4 bg-gray-700 shrink-0">
                  <img 
                    src={imageUrl}
                    alt={data.name}
                    className="w-full h-full object-cover"
                  />
              </div>
            ) : (
              <CardArt type={data.type} id={cardId} artPrompt={data.artPrompt} customSeed={customSeed} />
            )}

            <div className={`${size === 'large' ? 'text-sm' : 'text-[10px]'} text-gray-300 leading-tight overflow-hidden mb-1 px-1 z-10 flex-1`}>
              {data.desc}
            </div>

            {showStats && data.type !== 'tactic' && (
              <div className="flex justify-between mt-auto border-t border-white/10 pt-1 px-1 z-10">
                {data.type === 'support' ? (
                  <div className="flex w-full justify-center items-center text-yellow-400 font-bold bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                    <ArrowUpCircle size={12} className="mr-1"/> Support
                  </div>
                ) : (
                  <div className={`flex items-center font-bold bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm ${currentAtk > data.atk ? 'text-green-400' : 'text-red-400'}`}>
                    <Swords size={12} className="mr-1" /> {displayAtk}
                  </div>
                )}
                
                <div className={`flex items-center font-bold bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm ml-auto ${currentDef > data.def ? 'text-green-400' : 'text-green-400'}`}>
                  {data.invulnerable ? <Shield size={12} className="mr-1 text-yellow-400" /> : <Shield size={12} className="mr-1" />} 
                  {data.invulnerable ? "∞" : displayDef}
                </div>
              </div>
            )}
            
             {data.type === 'tactic' && (
                <div className="absolute top-10 right-0 bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-l-md border-l border-y border-orange-400 shadow-lg z-20">
                  INSTANT
                </div>
             )}
        </div>

        {/* === BACK FACE === */}
        <div className={`absolute inset-0 h-full w-full bg-[#f3f0e6] rounded-lg p-4 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col border-4 border-gray-400 shadow-inner`}>
             <div className="absolute top-2 right-2 opacity-50 pointer-events-none">
                <div className="border-4 border-red-800 rounded-full w-16 h-16 flex items-center justify-center -rotate-12">
                   <span className="text-[10px] font-black text-red-800 uppercase">Confidential</span>
                </div>
             </div>
             
             <div className="text-black font-mono text-xs border-b-2 border-black pb-1 mb-2 font-bold uppercase tracking-widest flex items-center">
                <ZoomIn size={12} className="mr-2"/> Intel Report
             </div>
             
             <div className="flex-1 font-serif text-gray-900 text-[10px] leading-relaxed overflow-y-auto pr-1">
               {data.history || "No intelligence data available for this unit."}
             </div>
             
             <div className="mt-auto pt-2 border-t border-black/20 text-[8px] text-gray-600 font-mono text-center">
                Property of Allied Command
             </div>
        </div>

      </div>

      {/* OVERLAYS (Outside 3D container to stay flat) */}
      {price && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-0.5 rounded shadow-md border border-green-400 z-20 font-mono font-bold">
          ${price}
        </div>
      )}

      {isDeployed && !canAttack && !isAbilityUsed && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 pointer-events-none rounded-lg backdrop-blur-[1px]">
          <span className="text-2xl font-bold text-gray-300 animate-pulse">Zzz</span>
        </div>
      )}

      {isAbilityUsed && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 pointer-events-none rounded-lg backdrop-blur-[2px]">
          <span className="text-xs font-black text-red-500 border-2 border-red-500 px-2 py-1 -rotate-12 uppercase tracking-widest">Depleted</span>
        </div>
      )}
      
      {data.invulnerable && isDeployed && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-600 text-black text-[10px] font-black px-2 py-0.5 rounded-full border border-yellow-400 shadow-lg z-30">
          INVULN
        </div>
      )}

      {/* ANIMATED SPRITES OVERLAY */}
      {activeEffect?.type === 'damage' && (
        <div key={activeEffect.id} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
           <Flame size={48} className="text-yellow-500 relative z-10 animate-bounce drop-shadow-2xl" fill="red" />
        </div>
      )}
      {activeEffect?.type === 'heal' && (
        <div key={activeEffect.id} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
           <Heart size={48} className="text-green-500 relative z-10 animate-bounce drop-shadow-2xl" fill="lightgreen" />
        </div>
      )}
      {activeEffect?.type === 'buff_def' && (
        <div key={activeEffect.id} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
           <Shield size={48} className="text-blue-300 relative z-10 animate-pulse drop-shadow-2xl" fill="blue" />
        </div>
      )}
      {activeEffect?.type === 'buff_atk' && (
        <div key={activeEffect.id} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
           <Swords size={48} className="text-orange-300 relative z-10 animate-bounce drop-shadow-2xl" fill="orange" />
        </div>
      )}
      {activeEffect?.type === 'action_attack' && (
        <div key={activeEffect.id} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
           <Target size={48} className="text-red-500 relative z-10 animate-ping" />
        </div>
      )}
      {activeEffect?.type === 'action_buff' && (
        <div key={activeEffect.id} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
           <ArrowUpCircle size={48} className="text-yellow-400 relative z-10 animate-bounce" />
        </div>
      )}
    </div>
  );
};

export default Card;