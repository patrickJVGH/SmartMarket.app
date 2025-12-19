
import React from 'react';
import { Market, MarketProduct } from '../types';
import { 
  ShoppingBag, 
  MapPin, 
  CheckCircle2, 
  ChevronRight, 
  Tag, 
  ExternalLink, 
  Globe, 
  FileText,
  Search,
  Copy,
  Zap,
  Navigation
} from 'lucide-react';

interface StoreCardProps {
  market: Market;
  currencySymbol: string;
}

const StoreCard: React.FC<StoreCardProps> = ({ market, currencySymbol }) => {
  const products = Object.values(market.products);
  if (products.length === 0) return null;

  const handleVerifyPrice = (productName: string) => {
    const query = `${productName} preço ${market.name.split(' ')[0]}`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col active:shadow-md transition-all">
      <div className="p-5 border-b border-stone-50 bg-stone-50/30">
        <div className="flex justify-between items-start mb-1 gap-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-black text-stone-900 truncate max-w-[150px]">{market.name}</h3>
          </div>
          <span className="text-[9px] font-black bg-yellow-400 px-2 py-0.5 rounded-full text-stone-900">{market.distance}</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
          {market.officialUrl && (
            <a href={market.officialUrl} target="_blank" className="flex items-center gap-1 text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-lg shrink-0">
              <Globe className="w-2.5 h-2.5" /> Site
            </a>
          )}
          {market.flyerUrl && (
            <a href={market.flyerUrl} target="_blank" className="flex items-center gap-1 text-[8px] font-black text-orange-600 uppercase bg-orange-50 px-2 py-1 rounded-lg shrink-0">
              <FileText className="w-2.5 h-2.5" /> Folheto
            </a>
          )}
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(market.name + " " + market.address)}`} target="_blank" className="flex items-center gap-1 text-[8px] font-black text-stone-600 uppercase bg-stone-100 px-2 py-1 rounded-lg shrink-0">
            <Navigation className="w-2.5 h-2.5" /> Maps
          </a>
        </div>
      </div>
      
      <div className="p-5 space-y-3">
        {products.map((product, idx) => (
          <div key={idx} className="flex justify-between items-center bg-lime-50/40 p-3 rounded-2xl border border-lime-100/30">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-bold text-stone-800 truncate block">{product.name}</span>
                {product.isPrivateLabel && <Zap className="w-2.5 h-2.5 text-lime-600" />}
              </div>
              <button onClick={() => handleVerifyPrice(product.name)} className="text-[8px] font-black text-blue-500 uppercase flex items-center gap-1">
                <Search className="w-2 h-2" /> Validar Preço
              </button>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-black text-lime-700">{currencySymbol}{product.price.toFixed(2)}</span>
            </div>
          </div>
        ))}
        
        <div className="pt-2 flex justify-between items-center">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Subtotal</p>
          <p className="text-lg font-black text-stone-900">{currencySymbol}{market.totalCost.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;
