import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { 
  Shield, 
  Swords, 
  Zap, 
  Crosshair, 
  Plane, 
  User, 
  ShoppingCart, 
  Trophy, 
  Play, 
  RefreshCw,
  Package,
  Menu,
  X,
  HelpCircle,
  Wifi,
  WifiOff,
  Flag,
  Tent,
  Heart,
  ArrowUpCircle,
  Flame,
  Plus,
  Target,
  Info,
  ZoomIn // Added Zoom Icon
} from 'lucide-react';

// --- Configuration & Constants ---

const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'blitzkrieg-tcg';

// Card Definitions
const CARD_DATABASE = {
  // --- Combat Units ---
  'inf_rifle': { id: 'inf_rifle', name: 'Rifle Squad', type: 'infantry', cost: 1, atk: 1, def: 2, rarity: 'common', desc: 'Basic infantry unit.', artPrompt: 'ww2 us infantry soldier running combat ink watercolor sketch' },
  'inf_sniper': { id: 'inf_sniper', name: 'Sniper Elite', type: 'infantry', cost: 2, atk: 3, def: 1, rarity: 'uncommon', desc: 'High damage, low defense.', artPrompt: 'ww2 sniper ghillie suit aiming rifle forest ink watercolor sketch' },
  'tank_sherman': { id: 'tank_sherman', name: 'M4 Sherman', type: 'tank', cost: 4, atk: 3, def: 4, rarity: 'common', desc: 'Reliable medium tank.', artPrompt: 'ww2 sherman tank dusty road combat ink watercolor sketch' },
  'tank_panzer': { id: 'tank_panzer', name: 'Panzer IV', type: 'tank', cost: 4, atk: 4, def: 3, rarity: 'uncommon', desc: 'Balanced german armor.', artPrompt: 'ww2 german panzer tank desert camouflage ink watercolor sketch' },
  'tank_tiger': { id: 'tank_tiger', name: 'Tiger I', type: 'tank', cost: 6, atk: 6, def: 6, rarity: 'rare', desc: 'Heavy armor beast.', artPrompt: 'ww2 tiger tank heavy armor imposing ink watercolor sketch' },
  'air_spitfire': { id: 'air_spitfire', name: 'Spitfire', type: 'air', cost: 3, atk: 4, def: 2, rarity: 'common', desc: 'Fast interceptor.', artPrompt: 'ww2 spitfire fighter plane flying clouds ink watercolor sketch' },
  'air_mustang': { id: 'air_mustang', name: 'P-51 Mustang', type: 'air', cost: 5, atk: 5, def: 3, rarity: 'rare', desc: 'Long range escort.', artPrompt: 'ww2 p51 mustang silver fighter plane blue sky ink watercolor sketch' },
  'event_airstrike': { id: 'event_airstrike', name: 'Air Strike', type: 'tactic', cost: 3, atk: 0, def: 0, rarity: 'uncommon', desc: 'Deal 2 dmg to all enemy units.', effect: 'aoe_2', artPrompt: 'explosions battlefield airstrike bombs dropping ink watercolor sketch' },
  'legend_patton': { id: 'legend_patton', name: 'Gen. Patton', type: 'commander', cost: 7, atk: 5, def: 8, rarity: 'limited', desc: 'LIMITED EDITION. Legendary commander.', artPrompt: 'general patton portrait ww2 uniform rugged ink watercolor sketch' },
  'legend_rommel': { id: 'legend_rommel', name: 'Desert Fox', type: 'commander', cost: 7, atk: 6, def: 7, rarity: 'limited', desc: 'LIMITED EDITION. Master tactician.', artPrompt: 'erwin rommel german general desert uniform portrait ink watercolor sketch' },
  
  // --- Support Cards (New) ---
  'supp_bunker': { id: 'supp_bunker', name: 'Concrete Bunker', type: 'support', cost: 3, atk: 0, def: 8, rarity: 'common', desc: 'Fortifies a unit (+3 Max HP & Heal).', supportEffect: {type: 'buff_def', val: 3}, artPrompt: 'ww2 concrete bunker defensive normandy ink watercolor sketch' },
  'supp_medic': { id: 'supp_medic', name: 'Field Hospital', type: 'support', cost: 2, atk: 0, def: 4, rarity: 'common', desc: 'Heals a unit (+4 HP up to Max).', supportEffect: {type: 'heal', val: 4}, artPrompt: 'ww2 red cross medical tent field hospital ink watercolor sketch' },
  'supp_supply': { id: 'supp_supply', name: 'Supply Truck', type: 'support', cost: 2, atk: 0, def: 3, rarity: 'uncommon', desc: 'Resupplies ammo (+2 ATK).', supportEffect: {type: 'buff_atk', val: 2}, artPrompt: 'ww2 army truck cargo supplies mud ink watercolor sketch' },
  'supp_radar': { id: 'supp_radar', name: 'Radar Station', type: 'support', cost: 4, atk: 0, def: 5, rarity: 'rare', desc: 'Precision targeting (+1 ATK).', supportEffect: {type: 'buff_atk', val: 1}, artPrompt: 'ww2 radar antenna dish radio tower ink watercolor sketch' },
  'supp_hq': { id: 'supp_hq', name: 'Forward HQ', type: 'support', cost: 6, atk: 0, def: 10, rarity: 'limited', desc: 'Invulnerable. Commands (+1/+1).', supportEffect: {type: 'buff_all', val: 1}, invulnerable: true, artPrompt: 'ww2 generals map table command tent strategy ink watercolor sketch' },
};

const RARITY_COLORS = {
  common: 'border-gray-500 bg-gray-800',
  uncommon: 'border-green-500 bg-gray-800',
  rare: 'border-blue-500 bg-blue-900',
  limited: 'border-yellow-400 bg-yellow-900 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
};

// --- Helper Functions ---

const getCardImageUrl = (cardId, artPrompt, type) => {
  const prompt = artPrompt || `ww2 ${type} combat unit ink watercolor sketch`;
  const encodedPrompt = encodeURIComponent(prompt + " white background");
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=400&height=600&nologo=true&seed=${cardId}`;
};

// --- Helper Components ---

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

const Card = ({ cardId, onClick, disabled, size = 'normal', price = null, showStats = true, canAttack = true, isDeployed = false, isSelected = false, isAbilityUsed = false, currentAtk = null, currentDef = null, activeEffect = null, className = '', showHoverOverlay = true }) => {
  const data = CARD_DATABASE[cardId] || CARD_DATABASE['inf_rifle'];
  const selectionClass = isSelected ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] scale-105 z-30' : '';
  const baseClass = `relative flex flex-col rounded-lg border-2 p-2 transition-all duration-200 ${RARITY_COLORS[data.rarity]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-lg cursor-pointer'} bg-gray-900 ${selectionClass} ${className} group`;
  
  const displayAtk = currentAtk !== null ? currentAtk : data.atk;
  const displayDef = currentDef !== null ? currentDef : data.def;

  let sizeClass = '';
  if (size === 'small') sizeClass = 'w-20 h-32 text-[10px]';
  else if (size === 'medium') sizeClass = 'w-32 h-48 text-xs';
  else if (size === 'large') sizeClass = 'w-72 h-[28rem] text-base'; 
  else sizeClass = 'w-48 h-72 text-sm';

  const imageUrl = getCardImageUrl(cardId, data.artPrompt, data.type);

  return (
    <div className={`${baseClass} ${sizeClass}`} onClick={!disabled ? onClick : undefined}>
      
      {/* TOOLTIP OVERLAY - Appears ON TOP of card (only if showHoverOverlay is true) */}
      {showHoverOverlay && (
        <div className="absolute inset-0 bg-black/90 text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[60] flex flex-col justify-center items-center text-center rounded-lg backdrop-blur-sm">
            <div className="font-bold text-yellow-500 border-b border-gray-700 pb-2 mb-2 w-full text-sm">{data.name}</div>
            <div className="text-xs text-gray-300 leading-relaxed mb-2">{data.desc}</div>
            {data.supportEffect && (
            <div className="text-[10px] text-blue-300 pt-2 border-t border-gray-700 w-full">
                <span className="font-bold uppercase block mb-1">Support Action:</span> 
                {data.supportEffect.type === 'buff_def' ? 'Fortify' : data.supportEffect.type === 'heal' ? 'Heal' : 'Buff'} (+{data.supportEffect.val})
            </div>
            )}
            {!isDeployed && size === 'medium' && (
                <div className="mt-auto text-[10px] text-gray-500 flex items-center justify-center gap-1">
                    <ZoomIn size={10} /> Click to Inspect
                </div>
            )}
        </div>
      )}

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
         <CardArt type={data.type} id={cardId} artPrompt={data.artPrompt} />
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
      
      {price && (
        <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full shadow border border-green-400 z-20">
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

      {data.type === 'tactic' && (
        <div className="absolute top-10 right-0 bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-l-md border-l border-y border-orange-400 shadow-lg z-20">
          INSTANT
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

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-gray-900 border border-gray-600 rounded-xl p-6 max-w-md w-full relative shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X /></button>
      {children}
    </div>
  </div>
);

// --- Standalone View Components ---

const RenderTutorial = ({ onClose }) => (
  <Modal onClose={onClose}>
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <h2 className="text-2xl font-bold text-yellow-500 border-b border-gray-600 pb-2">Field Manual</h2>
      <div className="space-y-2">
        <h3 className="font-bold text-white flex items-center"><Zap size={16} className="mr-2 text-blue-400"/> Deployment</h3>
        <p className="text-sm text-gray-300">Use Supplies to deploy units. Supply cap increases by 1 each round.</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-white flex items-center"><Swords size={16} className="mr-2 text-red-400"/> Combat</h3>
        <p className="text-sm text-gray-300">1. SELECT a unit. 2. Click ENEMY to attack. Units have Summoning Sickness.</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-white flex items-center"><Tent size={16} className="mr-2 text-green-400"/> Support Units</h3>
        <p className="text-sm text-gray-300">Support units cannot attack. Select them, then click friendly unit to buff.</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-white flex items-center"><Info size={16} className="mr-2 text-blue-400"/> Tooltips</h3>
        <p className="text-sm text-gray-300">Hover over any card to see full details and effects. Click cards in Barracks/Supply to ZOOM.</p>
      </div>
      <button onClick={onClose} className="w-full py-3 bg-yellow-600 text-black font-bold rounded mt-4">UNDERSTOOD!</button>
    </div>
  </Modal>
);

const RenderHome = ({ setView, setShowTutorial, showTutorial, activateTestMode }) => (
  <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in relative bg-cover bg-center"
    style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('https://image.pollinations.ai/prompt/dramatic%20monochromatic%20ww2%20battle%20scene%20charcoal%20sketch%20style?width=1920&height=1080&nologo=true')` }}>
    {showTutorial && <RenderTutorial onClose={() => setShowTutorial(false)} />}
    <div className="text-6xl font-black text-gray-100 tracking-tighter uppercase border-b-4 border-yellow-600 pb-4 text-center drop-shadow-2xl">Blitzkrieg TCG</div>
    <div className="text-yellow-500 font-mono tracking-[0.5em] text-xl drop-shadow-md">WORLD AT WAR</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md z-10 mt-8">
      <button onClick={() => setView('lobby')} className="p-6 bg-gray-900/80 border-2 border-gray-600 hover:border-yellow-500 hover:bg-gray-800 rounded-xl flex flex-col items-center transition-all group backdrop-blur-sm shadow-xl"><Swords size={48} className="mb-2 text-red-500" /><span className="text-xl font-bold">Battle</span></button>
      <button onClick={() => setView('collection')} className="p-6 bg-gray-900/80 border-2 border-gray-600 hover:border-blue-500 hover:bg-gray-800 rounded-xl flex flex-col items-center transition-all group backdrop-blur-sm shadow-xl"><Package size={48} className="mb-2 text-blue-400" /><span className="text-xl font-bold">Barracks</span></button>
      <button onClick={() => setView('market')} className="p-6 bg-gray-900/80 border-2 border-gray-600 hover:border-green-500 hover:bg-gray-800 rounded-xl flex flex-col items-center transition-all group backdrop-blur-sm shadow-xl"><ShoppingCart size={48} className="mb-2 text-green-400" /><span className="text-xl font-bold">Supply Lines</span></button>
      <button onClick={() => setShowTutorial(true)} className="p-6 bg-gray-900/80 border-2 border-gray-600 hover:border-white hover:bg-gray-800 rounded-xl flex flex-col items-center transition-all group backdrop-blur-sm shadow-xl"><HelpCircle size={48} className="mb-2 text-gray-200" /><span className="text-xl font-bold">Briefing</span></button>
    </div>
    {/* Hidden Test Mode Trigger */}
    <div onClick={activateTestMode} className="absolute bottom-4 text-gray-700 text-xs cursor-pointer hover:text-gray-500 select-none">v1.0.0 Alpha • React TCG Engine</div>
  </div>
);

const RenderCollection = ({ setView, userData, listCardForSale, setInspectCard }) => {
  const [sellMode, setSellMode] = useState(null);
  const [priceInput, setPriceInput] = useState('50');
  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold flex items-center text-blue-500"><Package className="mr-3" /> My Barracks</h2>
        <button onClick={() => setView('home')} className="text-gray-400 hover:text-white">Back</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {userData?.collection.map((cardId, i) => (
          <div key={i} className="relative group flex flex-col items-center">
            <Card cardId={cardId} size="medium" onClick={() => setInspectCard(CARD_DATABASE[cardId])} />
            <button onClick={() => setSellMode({id: cardId, idx: i})} className="mt-2 w-32 py-1 bg-gray-800 border border-gray-600 hover:bg-green-900 hover:border-green-500 rounded text-xs font-bold text-gray-300 hover:text-white transition-all">Sell Unit</button>
          </div>
        ))}
      </div>
      {sellMode && (
        <Modal onClose={() => setSellMode(null)}>
          <h3 className="text-xl font-bold mb-4 text-white">Sell {CARD_DATABASE[sellMode.id].name}</h3>
          <div className="mb-4"><Card cardId={sellMode.id} size="medium" disabled /></div>
          <input type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-3 mb-4 text-white focus:border-green-500 outline-none" placeholder="Price" />
          <div className="flex space-x-4"><button onClick={() => { listCardForSale(sellMode.id, priceInput); setSellMode(null); }} className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded font-bold text-white shadow-lg">Confirm Listing</button></div>
        </Modal>
      )}
    </div>
  );
};

const RenderMarket = ({ setView, userData, marketListings, loading, buyCard, user, setInspectCard }) => (
  <div className="p-6 h-full overflow-y-auto bg-gray-900">
     <div className="flex justify-between items-center mb-6">
       <h2 className="text-3xl font-bold flex items-center text-green-500"><ShoppingCart className="mr-3" /> Supply Depot</h2>
       <div className="flex items-center space-x-4">
          <div className="bg-gray-800 px-4 py-2 rounded-full border border-green-600 text-green-400 font-mono shadow-glow">Credits: ${userData?.credits || 0}</div>
          <button onClick={() => setView('home')} className="text-gray-400 hover:text-white">Back</button>
       </div>
     </div>
     {loading && <div className="text-center py-4 animate-pulse text-green-400">Processing Transaction...</div>}
     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12 pb-12">
       {marketListings.map(listing => (
         <div key={listing.id} className="flex flex-col items-center group p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-green-500 transition-all">
            <Card cardId={listing.cardId} price={listing.price} size="medium" onClick={() => setInspectCard(CARD_DATABASE[listing.cardId])} />
            <div className="w-full mt-4 flex flex-col gap-2">
              <button onClick={() => buyCard(listing)} className={`w-full py-2 rounded-lg font-bold text-sm shadow-lg transition-all transform hover:scale-105 flex items-center justify-center ${listing.sellerId === user?.uid ? 'bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700' : 'bg-green-700 hover:bg-green-600 text-white border border-green-500'}`}>
                {listing.sellerId === user?.uid ? 'Cancel Listing' : 'Buy Now'}
              </button>
              <div className="text-[10px] text-center text-gray-500 truncate font-mono">Seller: {listing.sellerName}</div>
            </div>
         </div>
       ))}
       {marketListings.length === 0 && <div className="col-span-full text-center text-gray-500 py-20 italic">No supplies currently listed. Check back later.</div>}
     </div>
  </div>
);

const RenderLobby = ({ setView, matchesList, createMatch, joinMatch }) => (
  <div className="p-6 max-w-4xl mx-auto h-full flex flex-col">
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-3xl font-bold">Mission Control</h2>
      <button onClick={() => setView('home')} className="text-gray-400 hover:text-white">Back</button>
    </div>
    <div className="flex-1 bg-gray-800/50 rounded-xl border border-gray-700 p-4 overflow-y-auto">
      {matchesList.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60"><Crosshair size={64} className="mb-4" /><p>No active distress signals.</p></div>
      ) : (
        <div className="space-y-2">
          {matchesList.map(m => (
            <div key={m.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700 hover:border-yellow-500 transition-colors">
              <div><div className="font-bold text-lg">{m.hostName}'s Skirmish</div><div className="text-xs text-gray-400">Waiting for opponent...</div></div>
              <button onClick={() => joinMatch(m.id)} className="bg-yellow-600 hover:bg-yellow-500 text-black px-6 py-2 rounded font-bold flex items-center"><Play size={16} className="mr-2" /> Join</button>
            </div>
          ))}
        </div>
      )}
    </div>
    <div className="mt-6 flex justify-end">
      <button onClick={createMatch} className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-lg font-bold text-lg flex items-center shadow-lg shadow-blue-900/20"><Swords className="mr-2" /> Start New Operation</button>
    </div>
  </div>
);

const GameView = ({ 
  gameState, user, activeMatch, myMana, myHp, enemyHp, myHand, myBoard, enemyBoard, 
  selectedUnitId, visualEffects, isMyTurn,
  handleCancelMatch, handleSurrender, handleLeaveClean, handleAttack, handleBoardClick, 
  handlePlayCard, handleEndTurn, CARD_DATABASE, hqHitAnim,
  isProcessing 
}) => {
  
  if (!gameState) return <div className="flex items-center justify-center h-full text-2xl font-mono animate-pulse">Establishing Comms...</div>;

  if (gameState.status === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
        <div className="text-3xl font-bold text-yellow-500">WAITING FOR OPPONENT</div>
        <div className="text-gray-400">Scanning radio frequencies...</div>
        <button onClick={handleCancelMatch} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600">Cancel Operation</button>
      </div>
    );
  }

  const getHealthBarClass = (hp) => {
      if (hp <= 5) return 'bg-red-600/80 border-red-500 animate-pulse';
      if (hp <= 9) return 'bg-red-600/50 border-red-500';
      if (hp <= 14) return 'bg-yellow-600/50 border-yellow-500';
      return 'bg-green-900/30 border-green-600/50'; 
  };

  if (gameState.status === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-6xl font-black uppercase">{gameState.winner === user.uid ? <span className="text-yellow-400">Victory</span> : <span className="text-red-600">Defeat</span>}</div>
        <button onClick={handleLeaveClean} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold">Return to Base</button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-950 overflow-hidden relative select-none ${isProcessing ? 'cursor-wait pointer-events-none grayscale-[0.3]' : ''}`}>
      <div className="h-12 bg-gray-900 flex items-center justify-between px-4 border-b border-gray-700 shadow-lg z-20">
        <div className="flex items-center space-x-4">
          <div className="bg-red-900/80 px-3 py-1 rounded border border-red-800 text-red-100 font-bold shadow-md">Enemy HP: {enemyHp}</div>
          <div className="text-sm text-gray-400 hidden md:block">{gameState.lastAction}</div>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={handleSurrender} className="px-3 py-1 bg-red-900/50 text-red-300 text-xs rounded border border-red-800 hover:bg-red-800 transition-colors flex items-center" title="Surrender"><Flag size={12} className="mr-1"/> Surrender</button>
            <div className={`font-bold px-4 py-1 rounded shadow-md ${isMyTurn ? 'bg-green-600 text-white animate-pulse' : 'bg-gray-700 text-gray-400'}`}>{isMyTurn ? "YOUR TURN" : "ENEMY TURN"}</div>
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-b from-gray-800 to-gray-900 p-4 flex justify-center items-center relative">
          <div className={`absolute left-4 top-4 flex flex-col items-center cursor-crosshair transition-all ${isMyTurn ? 'hover:scale-110 opacity-100' : 'opacity-50'}`} onClick={() => {
              if (!isMyTurn) return;
              handleAttack(-1);
          }}>
            <div className="w-20 h-20 rounded-lg bg-red-900/90 border-4 border-red-600 flex items-center justify-center shadow-2xl ring-4 ring-black/50"><Flag size={40} className="text-red-100 drop-shadow-lg" /></div>
            <div className="mt-1 bg-black/80 text-red-400 text-[10px] font-black px-2 py-0.5 rounded border border-red-800 tracking-widest">ENEMY HQ</div>
          </div>

          <div className="flex space-x-2 items-end h-full pb-4 pl-24">
            {enemyBoard.map((u, i) => (
              <div key={i} className={`relative group cursor-crosshair hover:scale-105 transition-transform`} onClick={() => handleBoardClick(u, i, true)}>
                <Card cardId={u.id} size="medium" className="pointer-events-none" isAbilityUsed={u.isAbilityUsed} isDeployed={true} canAttack={u.canAttack} currentAtk={u.atk} currentDef={u.def} activeEffect={visualEffects[u.instanceId]} />
                <div className="absolute bottom-0 w-full bg-black/80 text-white text-xs text-center font-mono border-t border-red-900">HP: {u.currentHp}</div>
              </div>
            ))}
          </div>
      </div>

      <div className="h-1 bg-black shadow-[0_0_20px_rgba(0,0,0,1)] z-20"></div>

      <div className="flex-1 bg-gradient-to-t from-gray-800 to-gray-900 p-4 flex justify-center items-center relative">
        <div className="absolute left-4 bottom-4 w-20 h-20 pointer-events-none opacity-0"></div>
        <div className="flex space-x-2 items-start h-full pt-4 pl-24">
            {myBoard.map((u, i) => (
              <div key={i} className="relative group cursor-pointer hover:-translate-y-3 transition-all duration-200" onClick={() => handleBoardClick(u, i, false)}>
                <Card cardId={u.id} size="medium" canAttack={u.canAttack} isDeployed={true} isSelected={selectedUnitId === u.instanceId} isAbilityUsed={u.isAbilityUsed} currentAtk={u.atk} currentDef={u.def} activeEffect={visualEffects[u.instanceId]} />
                <div className="absolute bottom-0 w-full bg-green-900/80 text-white text-xs text-center font-mono border-t border-green-500">HP: {u.currentHp}</div>
              </div>
            ))}
            {myBoard.length === 0 && <div className="text-gray-600 font-mono text-sm italic">No units deployed</div>}
        </div>
      </div>

      <div className="h-52 bg-gray-950 border-t-4 border-gray-800 p-4 flex items-end space-x-4 overflow-x-auto z-30 shadow-2xl">
        <div className="flex flex-col justify-between h-full min-w-[100px] mr-4 py-2">
            <div className="bg-blue-900/30 border border-blue-600/50 p-2 rounded text-center shadow-[0_0_15px_rgba(37,99,235,0.2)] backdrop-blur-md">
              <div className="text-[10px] text-blue-300 uppercase tracking-widest">Supplies</div>
              <div className="text-3xl font-black text-white">{myMana} <span className="text-sm text-gray-400 font-normal">/ {gameState.maxMana}</span></div>
            </div>
            <div className={`border p-2 rounded text-center backdrop-blur-md transition-colors duration-300 ${getHealthBarClass(myHp)}`}>
              <div className={`text-[10px] uppercase tracking-widest ${myHp <= 9 ? 'text-white' : 'text-green-300'}`}>Health</div>
              <div className="text-3xl font-black text-white">{myHp}</div>
            </div>
            <button onClick={handleEndTurn} disabled={!isMyTurn} className={`py-3 rounded font-bold uppercase text-sm transition-all shadow-lg ${isMyTurn ? 'bg-yellow-600 hover:bg-yellow-500 text-black hover:shadow-yellow-500/50' : 'bg-gray-800 text-gray-500'}`}>End Turn</button>
        </div>
        {myHand.map((cardId, i) => (
          <div key={i} className="hover:-translate-y-10 transition-transform duration-300 z-10">
            <Card cardId={cardId} size="medium" onClick={() => handlePlayCard(cardId, i)} disabled={!isMyTurn || CARD_DATABASE[cardId].cost > myMana} />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Application ---

export default function BlitzkriegTCG() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null);
  const [matchesList, setMatchesList] = useState([]);
  const [marketListings, setMarketListings] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  
  const [selectedUnitId, setSelectedUnitId] = useState(null); 
  const [visualEffects, setVisualEffects] = useState({}); 
  const prevEffectsRef = useRef(""); 
  
  const [hqDamage, setHqDamage] = useState(null); 
  const prevMyHp = useRef(null);
  
  const [splashCard, setSplashCard] = useState(null);
  const prevLastAction = useRef("");
  
  // Zoom / Inspect Card State
  const [inspectCard, setInspectCard] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const [gameState, setGameState] = useState(null);

  // --- Authentication & Init ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- User Data Sync & Test Mode ---
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
    const unsub = onSnapshot(userRef, async (docSnap) => {
      setConnectionError(null); 
      
      const urlParams = new URLSearchParams(window.location.search);
      const isTestMode = urlParams.get('test') === 'true';
      
      const starterDeck = [
        'inf_rifle', 'inf_rifle', 'inf_rifle', 
        'inf_sniper', 'tank_sherman', 'air_spitfire',
        'supp_bunker', 'supp_medic' 
      ];

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        
        // URL Test Mode (Runs on every sync if flag persists)
        if (isTestMode) {
            const allCards = Object.keys(CARD_DATABASE);
            if (data.collection.length < allCards.length) {
                 await updateDoc(userRef, { collection: allCards, credits: 1000 });
                 showNotif("TEST MODE ACTIVATED: Collection Unlocked!");
            }
        } else {
             // Normal Supply Drop
             const hasSupportCards = data.collection.some(id => CARD_DATABASE[id] && CARD_DATABASE[id].type === 'support');
             if (!hasSupportCards) {
               const supportPackage = ['supp_bunker', 'supp_medic', 'supp_supply', 'supp_radar'];
               const newCollection = [...data.collection, ...supportPackage];
               await updateDoc(userRef, { collection: newCollection });
               showNotif("HQ Airdropped Support Units!");
             }
        }
      } else {
        // NEW USER
        const initialData = {
            credits: 100,
            collection: starterDeck,
            wins: 0,
            losses: 0,
            username: `Commander-${user.uid.substring(0, 5)}`
        };
        
        if (isTestMode) {
           initialData.collection = Object.keys(CARD_DATABASE);
           initialData.credits = 1000;
           setTimeout(() => showNotif("TEST MODE: Account Created with Full Collection!"), 1000);
        }

        setDoc(userRef, initialData).catch(err => {
          console.error("Init error", err);
          setConnectionError("DB Init Failed: Permission Denied?");
        });
      }

    }, (err) => {
      console.error("Auth sync error", err);
      setConnectionError("Connection Error: Multiplayer sync failed. You may need to refresh.");
    });
    return () => unsub();
  }, [user]);

  // Manual Test Mode Trigger
  const activateTestMode = async () => {
     if (!user || !userData) return;
     const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
     const allCards = Object.keys(CARD_DATABASE);
     try {
         await updateDoc(userRef, { collection: allCards, credits: userData.credits + 1000 });
         showNotif("TEST MODE ACTIVATED: Cards Unlocked + 1000 Credits!");
     } catch (e) {
         console.error(e);
         showNotif("Error activating test mode.");
     }
  };

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'transfers');
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(async (d) => {
        const data = d.data();
        if (data.to === user.uid) {
          try {
            await deleteDoc(d.ref);
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
            await updateDoc(userRef, { credits: increment(data.amount) });
            showNotif(`Received ${data.amount} credits from a sale!`);
          } catch (e) {
            console.error("Error processing transfer", e);
          }
        }
      });
    });
    return () => unsub();
  }, [user]);

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (view !== 'market' || !user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'market');
    const unsub = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ ...doc.data(), id: doc.id }));
      setMarketListings(items);
    }, (err) => console.error("Market sync error", err));
    return () => unsub();
  }, [view, user]);

  const listCardForSale = async (cardId, price) => {
    if (!user || !price) return;
    try {
      const newCollection = [...userData.collection];
      const idx = newCollection.indexOf(cardId);
      if (idx === -1) return;
      newCollection.splice(idx, 1);
      
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
      await updateDoc(userRef, { collection: newCollection });

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'market'), {
        sellerId: user.uid,
        cardId,
        price: parseInt(price),
        sellerName: userData.username,
        createdAt: serverTimestamp()
      });
      showNotif("Card listed on market!");
    } catch (e) {
      console.error("List error", e);
      showNotif("Error listing card");
    }
  };

  const buyCard = async (listing) => {
    if (userData.credits < listing.price) {
      showNotif("Insufficient credits!");
      return;
    }
    if (listing.sellerId === user.uid) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'market', listing.id));
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
      const newCollection = [...userData.collection, listing.cardId];
      await updateDoc(userRef, { collection: newCollection });
      showNotif("Listing cancelled, card returned.");
      return;
    }

    try {
      setLoading(true);
      const buyerRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
      const buyerSnap = await getDoc(buyerRef);
      const buyerData = buyerSnap.data();
      
      if (buyerData.credits < listing.price) throw new Error("Funds too low");

      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'market', listing.id));

      await updateDoc(buyerRef, {
        credits: increment(-listing.price),
        collection: [...buyerData.collection, listing.cardId]
      });

      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transfers'), {
          to: listing.sellerId,
          amount: listing.price,
          from: user.uid,
          listingId: listing.id,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error("Error creating transfer record", err);
      }

      showNotif(`Bought ${CARD_DATABASE[listing.cardId].name}!`);
    } catch (e) {
      console.error(e);
      showNotif("Transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view !== 'lobby' || !user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'matches');
    const unsub = onSnapshot(q, (snapshot) => {
      const m = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        if (d.status === 'waiting') m.push({ id: doc.id, ...d });
      });
      setMatchesList(m);
    });
    return () => unsub();
  }, [view, user]);

  const createMatch = async () => {
    setLoading(true);
    try {
      const matchRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), {
        hostId: user.uid,
        hostName: userData.username,
        status: 'waiting',
        createdAt: serverTimestamp(),
        hostBoard: [],
        guestBoard: [],
        hostHand: [],
        guestHand: [],
        lastEffects: [] 
      });
      joinMatch(matchRef.id, true);
    } catch (e) {
      console.error(e);
    }
  };

  const joinMatch = (matchId, isHost = false) => {
    setActiveMatch({ id: matchId, isHost });
    setRewardClaimed(false); 
    setView('game');
  };

  const grantWinReward = async () => {
    if (!userData || !user) return;
    const keys = Object.keys(CARD_DATABASE);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    
    const roll = Math.random();
    let rewardCard = randomKey;
    if (roll < 0.05) rewardCard = 'legend_patton'; 
    
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
    await updateDoc(userRef, {
      credits: increment(50),
      wins: increment(1),
      collection: [...userData.collection, rewardCard]
    });
    showNotif(`VICTORY! Earned 50cr & ${CARD_DATABASE[rewardCard].name}`);
  };

  // --- Game Logic ---
  
  useEffect(() => {
    if (view !== 'game' || !activeMatch) return;
    
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
    
    const unsub = onSnapshot(matchRef, async (snap) => {
      if (!snap.exists()) {
        handleLeaveClean();
        showNotif("Match ended or invalid.");
        return;
      }
      const data = snap.data();
      
      if (!activeMatch.isHost && data.status === 'waiting') {
         if (!data.guestId) {
            await updateDoc(matchRef, {
              guestId: user.uid,
              guestName: userData.username,
              status: 'active',
              turn: 'host', 
              hostHP: 20,
              guestHP: 20,
              hostMana: 1,
              guestMana: 1,
              maxMana: 1,
              hostBoard: [], 
              guestBoard: [],
              hostHand: [],
              guestHand: [],
              lastEffects: [],
              lastAction: 'Game Start'
            });
         } else if (data.guestId !== user.uid) {
            showNotif("Match is full!");
            handleLeaveClean();
         }
      } else {
        setGameState(data);
      }
    });
    return () => unsub();
  }, [view, activeMatch]);

  // --- VISUAL EFFECTS ENGINE ---
  useEffect(() => {
    if (gameState && gameState.lastEffects) {
      const effectsStr = JSON.stringify(gameState.lastEffects);
      if (effectsStr !== prevEffectsRef.current) {
        // New effects detected!
        const newEffects = {};
        gameState.lastEffects.forEach(fx => {
          newEffects[fx.unitId] = { type: fx.type, id: fx.id || Date.now() }; // Add random ID for re-render
        });
        
        setVisualEffects(newEffects);
        
        // Clear effects after 1.5s
        setTimeout(() => {
          setVisualEffects({});
        }, 1500);

        prevEffectsRef.current = effectsStr;
      }
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState && gameState.status === 'finished' && gameState.winner === user?.uid && !rewardClaimed) {
      setRewardClaimed(true);
      grantWinReward();
    }
  }, [gameState, user, rewardClaimed]);

  useEffect(() => {
    if (!gameState || !userData || gameState.status !== 'active') return;
    
    const isHost = activeMatch.isHost;
    const myHandKey = isHost ? 'hostHand' : 'guestHand';
    
    if (!gameState[myHandKey] || gameState[myHandKey].length === 0) {
      const fullCollection = [...userData.collection];
      const combatCards = [];
      const supportCards = [];

      fullCollection.forEach(id => {
        const card = CARD_DATABASE[id];
        if (card) {
          if (card.type === 'support') supportCards.push(id);
          else combatCards.push(id);
        }
      });

      combatCards.sort(() => 0.5 - Math.random());
      supportCards.sort(() => 0.5 - Math.random());

      let hand = [];
      const supportsNeeded = 2;
      const combatNeeded = 4;

      hand = [...hand, ...supportCards.slice(0, supportsNeeded)];
      hand = [...hand, ...combatCards.slice(0, combatNeeded)];
      
      if (hand.length < 6) {
         const remaining = fullCollection.filter(c => !hand.includes(c)).sort(() => 0.5 - Math.random());
         hand = [...hand, ...remaining.slice(0, 6 - hand.length)];
      }

      const update = {};
      update[myHandKey] = hand;
      
      const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
      updateDoc(matchRef, update);
    }
  }, [gameState && gameState.status]);

  // --- HQ Damage Calculation (LIFTED) ---
  const myHp = gameState ? (activeMatch?.isHost ? gameState.hostHP : gameState.guestHP) : null;
  const enemyHp = gameState ? (activeMatch?.isHost ? gameState.guestHP : gameState.hostHP) : 0;
  const isMyTurn = gameState ? gameState.turn === (activeMatch?.isHost ? 'host' : 'guest') : false;
  const myBoard = gameState ? (activeMatch?.isHost ? gameState.hostBoard : gameState.guestBoard) || [] : [];
  const enemyBoard = gameState ? (activeMatch?.isHost ? gameState.guestBoard : gameState.hostBoard) || [] : [];
  const myHand = gameState ? (activeMatch?.isHost ? gameState.hostHand : gameState.guestHand) || [] : [];
  const myMana = gameState ? (activeMatch?.isHost ? gameState.hostMana : gameState.guestMana) : 0;

  useEffect(() => {
    if (myHp === null) return;
    if (prevMyHp.current === null) {
        prevMyHp.current = myHp;
        return;
    }
    if (myHp < prevMyHp.current) {
        const diff = prevMyHp.current - myHp;
        setHqDamage({ amount: diff, id: Date.now() });
        setTimeout(() => setHqDamage(null), 2000);
    }
    prevMyHp.current = myHp;
  }, [myHp]);

  // --- CARD SPLASH EFFECT ---
  useEffect(() => {
    if (gameState && gameState.lastAction) {
      if (prevLastAction.current !== gameState.lastAction) {
        // Find if action mentions a tactic card
        const tactic = Object.values(CARD_DATABASE).find(c => 
          c.type === 'tactic' && gameState.lastAction.includes(c.name)
        );
        if (tactic) {
          setSplashCard(tactic);
          setTimeout(() => setSplashCard(null), 6000);
        }
        prevLastAction.current = gameState.lastAction;
      }
    }
  }, [gameState]);

  const handleEndTurn = async () => {
    if (isProcessing) return;
    if (!gameState) return;
    const isHost = activeMatch.isHost;
    if (gameState.turn !== (isHost ? 'host' : 'guest')) return;

    setIsProcessing(true);
    setSelectedUnitId(null);
    const nextTurn = isHost ? 'guest' : 'host';
    const nextMaxMana = Math.min(gameState.maxMana + (isHost ? 0 : 1), 10);
    const nextPlayerBoardKey = isHost ? 'guestBoard' : 'hostBoard';
    const nextPlayerBoard = [...gameState[nextPlayerBoardKey]].map(u => ({
      ...u,
      canAttack: true
    }));
    const update = {
      turn: nextTurn,
      maxMana: nextMaxMana,
      hostMana: nextMaxMana,
      guestMana: nextMaxMana,
      [nextPlayerBoardKey]: nextPlayerBoard, 
      lastAction: `Turn pass to ${nextTurn}`,
      lastEffects: [] 
    };
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
    await updateDoc(matchRef, update);
    setTimeout(() => setIsProcessing(false), 1200); // Reduced from 2000
  };

  const handlePlayCard = async (cardId, index) => {
    if (isProcessing) return;
    const isHost = activeMatch.isHost;
    const myTurn = isHost ? 'host' : 'guest';
    if (gameState.turn !== myTurn) { showNotif("Not your turn!"); return; }
    
    const manaKey = isHost ? 'hostMana' : 'guestMana';
    const handKey = isHost ? 'hostHand' : 'guestHand';
    const boardKey = isHost ? 'hostBoard' : 'guestBoard';
    
    const cardData = CARD_DATABASE[cardId];
    if (gameState[manaKey] < cardData.cost) { showNotif("Not enough supplies!"); return; }

    setIsProcessing(true);
    const lockTime = cardData.type === 'tactic' ? 6000 : 1200;

    const newHand = [...gameState[handKey]];
    newHand.splice(index, 1);
    
    const newBoard = [...gameState[boardKey]];
    
    const unitId = `${cardId}_${Date.now()}`;
    const unit = {
      ...cardData,
      instanceId: unitId,
      currentHp: cardData.def,
      canAttack: false,
      isAbilityUsed: false
    };
    
    if (cardData.type === 'tactic') {
      if (cardData.effect === 'aoe_2') {
        const enemyBoardKey = isHost ? 'guestBoard' : 'hostBoard';
        // Calc damage
        const enemyBoard = [...gameState[enemyBoardKey]];
        const fxList = [];
        const uniqueFxId = Date.now();
        
        const updatedEnemyBoard = enemyBoard.map(u => {
          fxList.push({ unitId: u.instanceId, type: 'damage', id: uniqueFxId + Math.random() }); // Queue visual effect
          return { ...u, currentHp: u.currentHp - 2 };
        });

        // NOTE: We KEEP dead units (HP<=0) for animation purposes, cleaned up in delayed step.
        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
        await updateDoc(matchRef, {
           [enemyBoardKey]: updatedEnemyBoard,
           [handKey]: newHand,
           [manaKey]: gameState[manaKey] - cardData.cost,
           lastAction: `${isHost?'Host':'Guest'} launched Air Strike!`,
           lastEffects: fxList // Trigger explosions on ALL targets
        });
        
        // Delayed Cleanup for Tactic
        setTimeout(async () => {
             const finalCleanEnemy = updatedEnemyBoard.filter(u => u.currentHp > 0);
             if (finalCleanEnemy.length !== updatedEnemyBoard.length) {
               await updateDoc(matchRef, { [enemyBoardKey]: finalCleanEnemy });
             }
             setIsProcessing(false);
        }, 2500); // Longer wait for tactics
        return;
      }
    } else {
      newBoard.push(unit);
    }

    const update = {
      [handKey]: newHand,
      [boardKey]: newBoard,
      [manaKey]: gameState[manaKey] - cardData.cost,
      lastAction: `${isHost?'Host':'Guest'} deployed ${cardData.name}`,
      lastEffects: []
    };

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id), update);
    setTimeout(() => setIsProcessing(false), lockTime);
  };

  const handleSupportAction = async (supportUnit, targetUnit, targetIndex) => {
    if (isProcessing) return;
    const isHost = activeMatch.isHost;
    if (gameState.turn !== (isHost ? 'host' : 'guest')) {
        showNotif("Not your turn!");
        return;
    }
    if (supportUnit.isAbilityUsed) {
      showNotif("Support ability already used!");
      return;
    }
    if (supportUnit.canAttack === false) {
      showNotif("Support unit is busy!");
      return;
    }
    if (targetUnit.type === 'support') {
      showNotif("Cannot support another Support unit!");
      return;
    }

    setIsProcessing(true);

    const myBoardKey = isHost ? 'hostBoard' : 'guestBoard';
    const myBoard = [...gameState[myBoardKey]];

    // Apply Effect
    const effect = supportUnit.supportEffect;
    let fxType = 'heal'; // Default

    if (effect) {
      const target = myBoard[targetIndex];
      if (effect.type === 'heal') {
         const maxHp = target.def;
         target.currentHp = Math.min(target.currentHp + effect.val, maxHp);
         fxType = 'heal';
      }
      if (effect.type === 'buff_def') { 
         target.def += effect.val; 
         target.currentHp += effect.val; 
         fxType = 'buff_def';
      } 
      if (effect.type === 'buff_atk') {
        target.atk += effect.val;
        fxType = 'buff_atk';
      }
      if (effect.type === 'buff_all') { 
         target.atk += effect.val; 
         target.def += effect.val; 
         target.currentHp += effect.val;
         fxType = 'buff_def'; // Combined visual
      }
    }

    const supporterIdx = myBoard.findIndex(u => u.instanceId === supportUnit.instanceId);
    if (supporterIdx !== -1) {
      myBoard[supporterIdx].canAttack = false;
      myBoard[supporterIdx].isAbilityUsed = true; 
    }

    const uniqueFxId = Date.now();
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id), {
      [myBoardKey]: myBoard,
      lastAction: `${supportUnit.name} supported ${targetUnit.name}`,
      lastEffects: [
        { unitId: targetUnit.instanceId, type: fxType, id: uniqueFxId },
        { unitId: supportUnit.instanceId, type: 'action_buff', id: uniqueFxId + 1 }
      ] 
    });
    
    setSelectedUnitId(null); 
    setTimeout(() => setIsProcessing(false), 1200); // Reduced from 2000
  };

  const handleAttack = async (targetIndex = -1) => {
    if (isProcessing) return;
    const isHost = activeMatch.isHost;
    if (gameState.turn !== (isHost ? 'host' : 'guest')) return;
    
    const myBoardKey = isHost ? 'hostBoard' : 'guestBoard';
    const enemyBoardKey = isHost ? 'guestBoard' : 'hostBoard';
    const enemyHpKey = isHost ? 'guestHP' : 'hostHP';

    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
    
    const myBoard = [...gameState[myBoardKey]];
    let attacker;

    if (selectedUnitId) {
      attacker = myBoard.find(u => u.instanceId === selectedUnitId);
    } else {
      attacker = myBoard.find(u => u.canAttack && u.type !== 'support');
    }

    if (!attacker) {
      showNotif("No ready combat units available!");
      return;
    }
    if (attacker.type === 'support') {
      showNotif("Support units cannot attack!");
      return;
    }
    if (attacker.canAttack === false) {
      showNotif("Unit is recovering (Zzz)!");
      return;
    }

    setIsProcessing(true);

    const myUnitIndex = myBoard.findIndex(u => u.instanceId === attacker.instanceId);
    if (myUnitIndex !== -1) {
      myBoard[myUnitIndex].canAttack = false;
    }

    let update = { [myBoardKey]: myBoard };
    const fxList = []; 
    const uniqueFxId = Date.now();

    fxList.push({ unitId: attacker.instanceId, type: 'action_attack', id: uniqueFxId });

    if (targetIndex === -1) {
      const newEnemyHp = gameState[enemyHpKey] - attacker.atk;
      update[enemyHpKey] = newEnemyHp;
      update.lastAction = `${attacker.name} attacked Command Post!`;
      update.lastEffects = fxList; // Attacker effect only

      if (newEnemyHp <= 0) {
        update.status = 'finished';
        update.winner = user.uid;
      }
    } else {
      const enemyBoard = [...gameState[enemyBoardKey]];
      const target = enemyBoard[targetIndex];
      
      if (target.invulnerable) {
        showNotif("Target is INVULNERABLE!");
        fxList.push({ unitId: target.instanceId, type: 'buff_def', id: uniqueFxId + 1 }); 
        await updateDoc(matchRef, { ...update, lastEffects: fxList });
        setSelectedUnitId(null);
        setTimeout(() => setIsProcessing(false), 1200); // Reduced from 2000
        return;
      }

      target.currentHp -= attacker.atk;
      fxList.push({ unitId: target.instanceId, type: 'damage', id: uniqueFxId + 2 }); 
      
      if (target.currentHp > 0) {
        // Recoil only if target survived
        if (myUnitIndex !== -1) {
           myBoard[myUnitIndex].currentHp -= target.atk;
           // FIX 1: Show recoil damage ONLY if enemy had attack power
           if (target.atk > 0) {
              fxList.push({ unitId: attacker.instanceId, type: 'damage', id: uniqueFxId + 3 });
           }
        }
      }

      // FIX 2: DELAYED DEATH - Keep units in array for animation
      update[enemyBoardKey] = enemyBoard;
      update[myBoardKey] = myBoard; 
      
      update.lastAction = `${attacker.name} engaged ${target.name}`;
      update.lastEffects = fxList;
    }

    await updateDoc(matchRef, update);
    setSelectedUnitId(null); 

    // Delayed Cleanup Step
    if (targetIndex !== -1) {
       setTimeout(async () => {
          const cleanEnemy = update[enemyBoardKey].filter(u => u.currentHp > 0);
          const cleanMy = update[myBoardKey].filter(u => u.currentHp > 0);

          if (cleanEnemy.length !== update[enemyBoardKey].length || cleanMy.length !== update[myBoardKey].length) {
             await updateDoc(matchRef, {
               [enemyBoardKey]: cleanEnemy,
               [myBoardKey]: cleanMy
             });
          }
       }, 1000);
    }
    setTimeout(() => setIsProcessing(false), 1200); 
  };

  const handleBoardClick = (unit, index, isEnemy) => {
    if (isEnemy) {
      handleAttack(index);
      return;
    }

    if (selectedUnitId) {
      const isHost = activeMatch.isHost;
      const myBoard = isHost ? gameState.hostBoard : gameState.guestBoard;
      const selectedUnit = myBoard.find(u => u.instanceId === selectedUnitId);

      if (selectedUnitId === unit.instanceId) {
        setSelectedUnitId(null);
        return;
      }

      if (selectedUnit && selectedUnit.type === 'support') {
        handleSupportAction(selectedUnit, unit, index);
        return;
      }
      
      if (unit.type === 'support' && unit.isAbilityUsed) {
         showNotif("This unit is depleted.");
         return; 
      }
      setSelectedUnitId(unit.instanceId);
    } else {
      if (unit.type === 'support' && unit.isAbilityUsed) {
         showNotif("This unit is depleted.");
         return; 
      }
      setSelectedUnitId(unit.instanceId);
    }
  };

  const handleSurrender = async () => {
    if (!activeMatch || !gameState) return;
    const isHost = activeMatch.isHost;
    
    const update = {
      status: 'finished',
      winner: isHost ? gameState.guestId : gameState.hostId, 
      lastAction: `${isHost ? 'Host' : 'Guest'} surrendered!`
    };
    
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id), update);
  };

  const handleLeaveClean = () => {
    setActiveMatch(null);
    setGameState(null);
    setView('home');
  };

  const handleCancelMatch = async () => {
    if (!activeMatch) return;
    try {
      if (activeMatch.isHost && gameState && gameState.status === 'waiting') {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id));
        showNotif("Operation cancelled.");
      }
    } catch (e) {
      console.error("Error deleting match", e);
    }
    handleLeaveClean();
  };

  return (
    <div className="w-full h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="h-14 bg-black flex items-center justify-between px-6 border-b border-gray-800 z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-yellow-600 font-black tracking-widest uppercase">
            <Shield className="mr-2" /> Blitzkrieg
          </div>
          
          {connectionError ? (
             <div className="flex items-center text-red-500 text-xs font-bold animate-pulse" title={connectionError}>
               <WifiOff size={14} className="mr-1" /> Offline/Error
             </div>
          ) : (
             <div className="flex flex-col justify-center">
               <div className="flex items-center text-green-600 text-xs font-bold" title="Connected to Global Server">
                 <Wifi size={14} className="mr-1" /> Online
               </div>
               <div className="text-[10px] text-gray-600 font-mono">Room: {appId.substring(0,8)}...</div>
             </div>
          )}
        </div>

        {userData && (
          <div className="flex items-center space-x-6 text-sm font-mono">
            <div className="flex items-center text-gray-400">
              <User size={14} className="mr-2" /> {userData.username}
            </div>
            <div className="flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              ${userData.credits}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden relative">
        {/* Notification Wrapper for centering */}
        {notification && (
          <div className="absolute top-4 w-full flex justify-center z-50 pointer-events-none">
            <div className="bg-yellow-600 text-black px-6 py-2 rounded-full font-bold shadow-lg animate-bounce border border-yellow-500 pointer-events-auto">
              {notification}
            </div>
          </div>
        )}

        {/* HQ Damage Overlay - Global - Fixed Stacking */}
        {view === 'game' && hqDamage && gameState?.status !== 'finished' && (
           <div key={hqDamage.id} className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
                <div className="text-9xl font-black text-red-600 drop-shadow-[0_0_10px_rgba(0,0,0,1)] animate-pulse flex items-center">
                    <span className="text-6xl mr-2">-</span>{hqDamage.amount}
                </div>
           </div>
        )}

        {/* CARD SPLASH OVERLAY - Global */}
        {splashCard && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="flex flex-col items-center animate-in zoom-in duration-500">
                <div className="text-4xl font-black text-yellow-500 mb-4 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] uppercase tracking-widest">OPPONENT PLAYED</div>
                <Card cardId={splashCard.id} size="large" disabled className="shadow-2xl" />
             </div>
          </div>
        )}

        {/* Card Inspector Modal - Global */}
        {inspectCard && (
          <Modal onClose={() => setInspectCard(null)}>
             <div className="flex flex-col items-center">
                <Card cardId={inspectCard.id} size="large" disabled />
             </div>
          </Modal>
        )}

        {view === 'home' && <RenderHome setView={setView} setShowTutorial={setShowTutorial} showTutorial={showTutorial} activateTestMode={activateTestMode} />}
        {view === 'lobby' && <RenderLobby setView={setView} matchesList={matchesList} createMatch={createMatch} joinMatch={joinMatch} />}
        {view === 'game' && 
          <GameView 
             gameState={gameState}
             user={user}
             activeMatch={activeMatch}
             myMana={myMana}
             myHp={myHp}
             enemyHp={enemyHp}
             myHand={myHand}
             myBoard={myBoard}
             enemyBoard={enemyBoard}
             selectedUnitId={selectedUnitId}
             visualEffects={visualEffects}
             isMyTurn={isMyTurn}
             handleCancelMatch={handleCancelMatch}
             handleSurrender={handleSurrender}
             handleLeaveClean={handleLeaveClean}
             handleAttack={handleAttack}
             handleBoardClick={handleBoardClick}
             handlePlayCard={handlePlayCard}
             handleEndTurn={handleEndTurn}
             CARD_DATABASE={CARD_DATABASE}
             hqHitAnim={null} // Removed localized animation for global overlay
             isProcessing={isProcessing}
          />
        }
        {view === 'collection' && <RenderCollection setView={setView} userData={userData} listCardForSale={listCardForSale} setInspectCard={setInspectCard} />}
        {view === 'market' && <RenderMarket setView={setView} userData={userData} marketListings={marketListings} loading={loading} buyCard={buyCard} user={user} setInspectCard={setInspectCard} />}
      </main>
    </div>
  );
}