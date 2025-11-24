import React from 'react';
import { Swords, Package, ShoppingCart, HelpCircle } from 'lucide-react';
import RenderTutorial from './RenderTutorial';

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

export default RenderHome;
