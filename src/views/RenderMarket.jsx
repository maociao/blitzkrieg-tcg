import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Card from '../components/Card';
import { CARD_DATABASE } from '../data/cards';

const RenderMarket = ({ setView, userData, marketListings, loading, buyCard, user, setInspectCard }) => {
  const [sortBy, setSortBy] = React.useState('price');
  const [filterType, setFilterType] = React.useState('all');

  const getSortedAndFilteredListings = () => {
    if (!marketListings) return [];

    let filtered = marketListings.map(listing => ({ ...listing, data: CARD_DATABASE[listing.cardId] }));

    // Filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.data.type === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'name') return a.data.name.localeCompare(b.data.name);
      if (sortBy === 'rarity') {
        const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'limited': 4 };
        return (rarityOrder[b.data.rarity] || 0) - (rarityOrder[a.data.rarity] || 0);
      }
      if (sortBy === 'type') return a.data.type.localeCompare(b.data.type);
      return 0;
    });

    return filtered;
  };

  const displayedListings = getSortedAndFilteredListings();

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold flex items-center text-green-500"><ShoppingCart className="mr-3" /> Supply Depot</h2>

        <div className="flex flex-wrap justify-center gap-4">
          <div className="bg-gray-800 px-4 py-2 rounded-full border border-green-600 text-green-400 font-mono shadow-glow">Credits: ${userData?.credits || 0}</div>

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
            <option value="price">Sort by Price</option>
            <option value="name">Sort by Name</option>
            <option value="rarity">Sort by Rarity</option>
            <option value="type">Sort by Type</option>
          </select>

          <button onClick={() => setView('home')} className="text-gray-400 hover:text-white px-4 py-1 border border-gray-600 rounded">Back</button>
        </div>
      </div>
      {loading && <div className="text-center py-4 animate-pulse text-green-400">Processing Transaction...</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12 pb-12">
        {displayedListings.map(listing => (
          <div key={listing.id} className="flex flex-col items-center group p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-green-500 transition-all">
            <Card cardId={listing.cardId} price={listing.price} size="medium" onClick={() => setInspectCard(listing.data)} />
            <div className="w-full mt-4 flex flex-col gap-2">
              <button onClick={() => buyCard(listing)} className={`w-full py-2 rounded-lg font-bold text-sm shadow-lg transition-all transform hover:scale-105 flex items-center justify-center ${listing.sellerId === user?.uid ? 'bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700' : 'bg-green-700 hover:bg-green-600 text-white border border-green-500'}`}>
                {listing.sellerId === user?.uid ? 'Cancel Listing' : 'Buy Now'}
              </button>
              <div className="text-[10px] text-center text-gray-500 truncate font-mono">Seller: {listing.sellerName}</div>
            </div>
          </div>
        ))}
        {displayedListings.length === 0 && <div className="col-span-full text-center text-gray-500 py-20 italic">No supplies match your criteria.</div>}
      </div>
    </div>
  );
};

export default RenderMarket;
