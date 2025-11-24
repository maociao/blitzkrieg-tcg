import React, { useState } from 'react';
import { Package } from 'lucide-react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { CARD_DATABASE } from '../data/cards';

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

export default RenderCollection;
