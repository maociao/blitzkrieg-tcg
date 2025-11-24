import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Card from '../components/Card';
import { CARD_DATABASE } from '../data/cards';

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

export default RenderMarket;
