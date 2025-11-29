import React from 'react';
import { Zap, Swords, Tent, Info, Skull, Trophy } from 'lucide-react';
import Modal from '../components/Modal';

const RenderTutorial = ({ onClose }) => (
  <Modal onClose={onClose}>
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 text-gray-200">
      <h2 className="text-2xl font-bold text-yellow-500 border-b border-gray-600 pb-2">Field Manual</h2>
      
      <div className="space-y-2">
        <h3 className="font-bold text-white flex items-center text-lg"><Zap size={20} className="mr-2 text-yellow-400"/> Supplies & Deployment</h3>
        <ul className="list-disc list-inside text-sm space-y-1 ml-1">
          <li><strong>Cost:</strong> Deploying units consumes Supplies (Mana). You must have enough Supplies to cover the card's cost.</li>
          <li><strong>Supply Drop:</strong> Your Supply cap increases by 1 each round (up to 10), and fully refills at the start of your turn.</li>
          <li><strong>Sleeping Sickness:</strong> Units cannot attack or use abilities the turn they are deployed (Zzz).</li>
          <li><strong>Hand Limit:</strong> You start with a fixed hand of 6 cards (2 Unique Support, 4 Combat). No new cards are drawn - make them count! (In Draw Mode, hand refills to 2 Support / 4 Combat each turn).</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-white flex items-center text-lg"><Swords size={20} className="mr-2 text-red-400"/> Combat Mechanics</h3>
        <ul className="list-disc list-inside text-sm space-y-1 ml-1">
          <li><strong>Attack:</strong> Select a ready unit, then click an enemy to attack.</li>
          <li><strong>Counter Attack:</strong> Attackers take damage equal to the defender's ATK (unless the defender is destroyed in the attack).</li>
          <li><strong>Taunt (Bunkers):</strong> You cannot attack the enemy HQ or other units if a Bunker is present. It must be destroyed first.</li>
          <li><strong>Invulnerable:</strong> Some units (like HQ) cannot be damaged by direct attacks.</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-white flex items-center text-lg"><Tent size={20} className="mr-2 text-green-400"/> Support & Abilities</h3>
        <ul className="list-disc list-inside text-sm space-y-1 ml-1">
          <li><strong>Passive Support:</strong> Provides benefits for as long as the unit remains on the board (e.g., +1 ATK aura).</li>
          <li><strong>Active Abilities:</strong> Click a Support unit, then a target to use its skill (e.g., Heal, Buff). A unit's action can only be used once per battle.</li>
          <li><strong>Restrictions:</strong> Support units cannot target themselves or other Support units.</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-white flex items-center text-lg"><Trophy size={20} className="mr-2 text-purple-400"/> Winning</h3>
        <p className="text-sm">Reduce the enemy HQ Health to 0 or force a surrender to win!</p>
      </div>

      <div className="bg-gray-800 p-3 rounded border border-gray-700">
        <h3 className="font-bold text-blue-400 flex items-center text-sm mb-1"><Info size={16} className="mr-2"/> Pro Tip</h3>
        <p className="text-xs text-gray-400">Hover over any card to see full details. Click cards in your Collection to inspect them.</p>
      </div>

      <button onClick={onClose} className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded transition-colors uppercase tracking-widest">Understood, Commander!</button>
    </div>
  </Modal>
);

export default RenderTutorial;
