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
  Zap
} from 'lucide-react';

interface StoreCardProps {
  market: Market;
  currencySymbol: string;
  selectedCategory?: string;
}

const StoreCard: React.FC<StoreCardProps> = ({ market, currencySymbol, selectedCategory = 'Todos' }) => {
  const cheapestProducts = Object.values(market.products)
    .filter((p: MarketProduct) => p.isCheapest)
    .filter((p: MarketProduct) => selectedCategory === 'Todos' || p.category === selectedCategory);

  if (cheapestProducts.length === 0) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(market.name + ", " + market.address)}`;

  const handleVerifyPrice = (productName: string) => {
    const query = `${productName} preço ${market.name.split(' ')[0]}`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-orange-100 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-orange-50 bg-orange-50/30">
        <div className="flex justify-between items-center mb-2 gap-3">
          <h3 className="text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="leading-tight truncate">{market.name}</span>
          </h3>
          <span className="px-3 py-1.5 bg-yellow-400 text-yellow-950 text-xs font-black rounded-full uppercase tracking-tighter shadow-sm flex-shrink-0 whitespace-nowrap">
            {market.distance}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 flex items-start gap-1.5 font-semibold pl-1">
          <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{market.address}</span>
        </p>
      </div>
      
      <div className="p-4 sm:p-6 flex-grow flex flex-col">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Diretórios de Validação</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {market.officialUrl && (
              <a 
                href={market.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-2.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                title="Abrir página oficial da loja"
              >
                <Globe className="w-3 h-3" />
                Site Loja
              </a>
            )}
            
            {market.flyerUrl && (
              <a 
                href={market.flyerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-[9px] font-black text-orange-600 uppercase bg-orange-50 px-2 py-2.5 rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors"
                title="Abrir folheto semanal"
              >
                <FileText className="w-3 h-3" />
                Folheto
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Auditoria de Itens</h4>
          {selectedCategory !== 'Todos' && (
            <span className="text-[9px] font-black bg-stone-100 px-2 py-1 rounded text-stone-500 uppercase flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" /> {selectedCategory}
            </span>
          )}
        </div>
        
        <div className="space-y-3 flex-grow">
          {cheapestProducts.map((product: MarketProduct, idx) => (
            <div key={idx} className="group relative bg-lime-50/40 rounded-2xl border border-lime-100/50 p-3 transition-all hover:bg-lime-50 hover-shake cursor-default">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="bg-lime-500 p-1.5 rounded-full mt-0.5 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-stone-800 text-sm leading-tight block truncate">
                        {product.name}
                      </span>
                      {product.isPrivateLabel && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-lime-200 text-lime-900 text-[8px] font-black uppercase rounded-md border border-lime-300">
                          <Zap className="w-2 h-2" /> Marca Própria
                        </span>
                      )}
                      <button 
                        onClick={() => copyToClipboard(product.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-lime-200 rounded text-lime-700"
                        title="Copiar nome para o site oficial"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-stone-400 font-bold uppercase">{product.category}</span>
                      <button 
                        onClick={() => handleVerifyPrice(product.name)}
                        className="flex items-center gap-1 text-[9px] font-black text-blue-500 hover:text-blue-700 uppercase"
                      >
                        <Search className="w-2.5 h-2.5" /> Validar Preço
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-lime-700">{currencySymbol}{product.price.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-lime-600/60 uppercase">{product.unit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-dashed border-orange-100 flex justify-between items-baseline">
          <span className="text-stone-500 font-bold text-sm">Total a validar</span>
          <span className="text-xl sm:text-2xl font-black text-stone-900">
            {currencySymbol}{Number(cheapestProducts.reduce((sum: number, p: MarketProduct) => sum + p.price, 0)).toFixed(2)}
          </span>
        </div>
        
        <a 
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-6 py-3 px-5 bg-stone-800 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-stone-900 transition-all active:scale-95">
          Abrir Rota no Maps <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default StoreCard;