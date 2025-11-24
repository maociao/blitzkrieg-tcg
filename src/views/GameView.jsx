import React from 'react';
import { Flag } from 'lucide-react';
import Card from '../components/Card';

const GameView = ({ 
  gameState, user, activeMatch, myMana, myHp, enemyHp, myHand, myBoard, enemyBoard, 
  selectedUnitId, visualEffects, isMyTurn,
  handleCancelMatch, handleSurrender, handleLeaveClean, handleAttack, handleBoardClick, 
  handlePlayCard, handleEndTurn, CARD_DATABASE, 
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

export default GameView;
