import React from 'react';
import { Zap, Swords, Tent, Info } from 'lucide-react';
import Modal from '../components/Modal';

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

export default RenderTutorial;
