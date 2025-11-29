import React from 'react';
import { Crosshair, Play, Swords, RefreshCw, Bot } from 'lucide-react';

const RenderLobby = ({ setView, matchesList, createMatch, joinMatch, user, createAiMatch }) => {
  const [gameMode, setGameMode] = React.useState('stud');

  return (
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
            <div key={m.id} className={`bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700 transition-colors ${m.hostId === user?.uid ? 'border-yellow-500/50' : 'hover:border-yellow-500'}`}>
              <div>
                <div className="font-bold text-lg flex items-center">
                    {m.hostName}'s Skirmish
                    {m.hostId === user?.uid && <span className="ml-2 text-[10px] bg-yellow-600 text-black px-1 rounded font-black uppercase">YOU</span>}
                    <span className={`ml-2 text-[10px] px-2 rounded uppercase font-bold ${m.mode === 'draw' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {m.mode === 'draw' ? 'DRAW MODE' : 'STUD MODE'}
                    </span>
                </div>
                <div className="text-xs text-gray-400">Waiting for opponent...</div>
              </div>
              
              {m.hostId === user?.uid ? (
                  <button 
                    onClick={() => joinMatch(m.id, true)} 
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold flex items-center animate-pulse"
                  >
                    <RefreshCw size={16} className="mr-2" /> Resume
                  </button>
              ) : (
                  <button onClick={() => joinMatch(m.id)} className="bg-yellow-600 hover:bg-yellow-500 text-black px-6 py-2 rounded font-bold flex items-center"><Play size={16} className="mr-2" /> Join</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    
    <div className="mt-6 flex flex-col gap-4">
       {/* Mode Selector */}
       <div className="flex justify-end gap-2">
          <button 
            onClick={() => setGameMode('stud')} 
            className={`px-4 py-2 rounded font-bold border transition-colors ${gameMode === 'stud' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
          >
            Stud (Fixed Hand)
          </button>
          <button 
            onClick={() => setGameMode('draw')} 
            className={`px-4 py-2 rounded font-bold border transition-colors ${gameMode === 'draw' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
          >
            Draw (Refill Hand)
          </button>
       </div>

       <div className="flex justify-end gap-4">
          <button onClick={() => createAiMatch(gameMode)} className="bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-lg font-bold text-lg flex items-center shadow-lg shadow-purple-900/20"><Bot className="mr-2" /> Start Solo Operation</button>
          <button onClick={() => createMatch(gameMode)} className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-lg font-bold text-lg flex items-center shadow-lg shadow-blue-900/20"><Swords className="mr-2" /> Start Multiplayer Operation</button>
       </div>
    </div>
  </div>
  );
};

export default RenderLobby;
