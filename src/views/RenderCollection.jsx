import React, { useState } from 'react';
import { Package } from 'lucide-react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { CARD_DATABASE } from '../data/cards';

const RenderCollection = ({ setView, userData, listCardForSale, setInspectCard }) => {
  const [sellMode, setSellMode] = useState(null);
  const [priceInput, setPriceInput] = useState('50');
  const [sortBy, setSortBy] = useState('name');
  const [filterType, setFilterType] = useState('all');

  const getSortedAndFilteredCollection = () => {
    if (!userData?.collection) return [];

    let filtered = userData.collection.map((id, idx) => ({ id, idx, data: CARD_DATABASE[id] }));

    // Filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.data.type === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.data.name.localeCompare(b.data.name);
      if (sortBy === 'cost') return a.data.cost - b.data.cost;
      if (sortBy === 'rarity') {
        const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'limited': 4 };
        return (rarityOrder[b.data.rarity] || 0) - (rarityOrder[a.data.rarity] || 0);
      }
      if (sortBy === 'type') return a.data.type.localeCompare(b.data.type);
      return 0;
    });

    return filtered;
  };

  const displayedCollection = getSortedAndFilteredCollection();

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold flex items-center text-blue-500"><Package className="mr-3" /> My Barracks</h2>

        <div className="flex space-x-4">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1">
            <option value="all">All Types</option>
            <option value="infantry">Infantry</option>
            <option value="tank">Tank</option>
            <option value="air">Air</option>
            <option value="artillery">Artillery</option>
            <option value="support">Support</option>
            <option value="tactic">Tactic</option>
            <option value="commander">Commander</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1">
            <option value="name">Sort by Name</option>
            <option value="cost">Sort by Cost</option>
            <option value="rarity">Sort by Rarity</option>
            <option value="type">Sort by Type</option>
          </select>
          <button onClick={() => setView('home')} className="text-gray-400 hover:text-white px-4 py-1 border border-gray-600 rounded">Back</button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {displayedCollection.map((item, i) => (
          <div key={`${item.id}-${i}`} className="relative group flex flex-col items-center">
            <Card cardId={item.id} size="medium" onClick={() => setInspectCard(item.data)} />
            <button onClick={() => setSellMode({ id: item.id, idx: item.idx })} className="mt-2 w-32 py-1 bg-gray-800 border border-gray-600 hover:bg-green-900 hover:border-green-500 rounded text-xs font-bold text-gray-300 hover:text-white transition-all">Sell Unit</button>
          </div>
        ))}
      </div>
      {sellMode && (
        <Modal onClose={() => setSellMode(null)}>
          <h3 className="text-xl font-bold mb-4 text-white">Sell {CARD_DATABASE[sellMode.id].name}</h3>
          <div className="mb-4"><Card cardId={sellMode.id} size="medium" disabled showHoverOverlay={false} /></div>
          <input type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-3 mb-4 text-white focus:border-green-500 outline-none" placeholder="Price" />
          <div className="flex space-x-4"><button onClick={() => { listCardForSale(sellMode.id, priceInput); setSellMode(null); }} className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded font-bold text-white shadow-lg">Confirm Listing</button></div>
        </Modal>
      )}
    </div>
  );
};

export default RenderCollection;
