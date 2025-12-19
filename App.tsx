
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Navigation, 
  Loader2, 
  ShoppingBasket, 
  Utensils, 
  AlertTriangle, 
  Radar, 
  Info, 
  Globe,
  ShieldCheck,
  Search,
  ShoppingCart,
  FileText,
  Upload,
  CheckCircle,
  ArrowUpDown,
  TrendingDown,
  Navigation2,
  PackageCheck,
  Save,
  Clock,
  ChevronRight,
  X,
  List as ListIcon,
  PieChart
} from 'lucide-react';
import { GroceryItem, OptimizationResult, MarketProduct, Market, SavedList } from './types';
import { fetchItemPrices, parseReceiptPdf, suggestListNameAndIcon } from './services/geminiService';
import StoreCard from './components/StoreCard';

const STORAGE_KEY = 'smartshop-grocery-list';
const SAVED_LISTS_KEY = 'smartshop-saved-lists';

const CESTA_BASICA_ITEMS = [
  "Arroz Agulha (1kg)","Feijão (1kg)","Açúcar (1kg)","Café (250g)","Azeite (750ml)","Massa (500g)","Leite (1L)","Ovos (12un)","Pão","Bananas (kg)"
];

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || ShoppingBasket;
  return <IconComponent className={className} />;
};

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const Header = React.memo(({ location }: { location: { lat: number, lng: number } | null }) => (
  <header className="bg-white border-b border-stone-100 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-2">
      <div className="bg-red-600 p-1.5 rounded-lg shadow-md shadow-red-100">
        <Utensils className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="text-base font-black text-stone-900 leading-none">SmartShop</h1>
        <p className="text-[9px] text-orange-600 font-bold uppercase tracking-widest mt-0.5">Auditoria Live</p>
      </div>
    </div>
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${location ? 'bg-lime-50 text-lime-700' : 'bg-stone-50 text-stone-400'}`}>
      <Radar className="w-3 h-3" />
      <span>{location ? 'GPS OK' : 'GPS...'}</span>
    </div>
  </header>
));

const OptimizingLoader = ({ progress, total }: { progress: number, total: number }) => {
  const percentage = Math.round((progress / total) * 100) || 0;
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-xl animate-pulse">
          <PackageCheck className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-stone-900 font-black text-xs px-2 py-0.5 rounded-lg border-2 border-white">
          {percentage}%
        </div>
      </div>
      <h3 className="text-lg font-black text-stone-800 mb-2">Auditando Preços...</h3>
      <p className="text-xs text-stone-500 mb-6 max-w-[200px]">Isto pode demorar alguns segundos devido aos limites de rede.</p>
      <div className="w-full max-w-[200px] bg-stone-100 h-2 rounded-full overflow-hidden">
        <div className="bg-red-600 h-full transition-all duration-500 ease-out" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">{progress}/{total} itens</p>
    </div>
  );
};

const ShoppingListPanel: React.FC<{
  items: GroceryItem[];
  setItems: React.Dispatch<React.SetStateAction<GroceryItem[]>>;
  handleOptimize: () => void;
  loading: boolean;
  location: any;
  onSave: () => void;
  setResults: any;
}> = ({ items, setItems, handleOptimize, loading, location, onSave, setResults }) => {
  const [newItemName, setNewItemName] = useState('');
  const [parsingPdf, setParsingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;
    setItems(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: newItemName.trim() }]);
    setNewItemName('');
    setResults(null);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsingPdf(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        try {
          const products = await parseReceiptPdf(base64);
          setItems(prev => [...prev, ...products.map(name => ({ id: Math.random().toString(36).substr(2, 9), name }))]);
          setResults(null);
        } finally { setParsingPdf(false); }
      };
      reader.readAsDataURL(file);
    } catch { setParsingPdf(false); }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setItems(CESTA_BASICA_ITEMS.map(n => ({ id: Math.random().toString(36).substr(2, 9), name: n })))} className="bg-orange-50 text-orange-700 p-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase active:scale-95 transition-all">
          <ShoppingBasket className="w-4 h-4" /> Cabaz Tipo
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="bg-blue-50 text-blue-700 p-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase active:scale-95 transition-all">
          {parsingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Subir PDF
          <input type="file" ref={fileInputRef} onChange={handlePdfUpload} accept="application/pdf" className="hidden" />
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-black text-stone-900 uppercase tracking-tighter">Itens na Lista</h2>
          {items.length > 0 && (
            <button onClick={onSave} className="text-lime-600 bg-lime-50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase">
              Guardar
            </button>
          )}
        </div>

        <form onSubmit={addItem} className="flex gap-2 mb-4">
          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Adicionar item..." className="flex-1 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
          <button type="submit" className="bg-red-600 text-white p-3 rounded-xl active:scale-90 transition-all shadow-lg shadow-red-100">
            <Plus className="w-5 h-5" />
          </button>
        </form>

        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-stone-50/50 rounded-xl border border-transparent active:border-orange-100">
              <span className="text-sm font-semibold text-stone-700">{item.name}</span>
              <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="text-stone-300 p-1"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {items.length === 0 && <p className="text-center py-8 text-xs font-bold text-stone-300 uppercase tracking-widest">Lista Vazia</p>}
        </div>
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-20">
          <button 
            onClick={handleOptimize} 
            disabled={loading || !location}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? "Auditando..." : `Ver Preços em ${items.length} Itens`}
          </button>
        </div>
      )}
    </div>
  );
};

const SavedListsSection: React.FC<{
  savedLists: SavedList[];
  onLoad: (list: SavedList) => void;
  onDelete: (id: string) => void;
}> = ({ savedLists, onLoad, onDelete }) => (
  <div className="space-y-4 pb-24">
    <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Meu Arquivo</h3>
    <div className="grid grid-cols-1 gap-3">
      {savedLists.map(list => (
        <div key={list.id} className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex items-center justify-between active:bg-stone-50 transition-colors">
          <button onClick={() => onLoad(list)} className="flex items-center gap-4 flex-1 text-left">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <DynamicIcon name={list.iconName} className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-stone-800 text-sm leading-tight mb-0.5">{list.name}</p>
              <p className="text-[10px] text-stone-400 font-bold uppercase">{list.items.length} itens</p>
            </div>
          </button>
          <button onClick={() => onDelete(list.id)} className="p-2 text-stone-200"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      {savedLists.length === 0 && (
        <div className="py-20 text-center">
          <Clock className="w-12 h-12 text-stone-100 mx-auto mb-3" />
          <p className="text-xs font-bold text-stone-300 uppercase">Sem listas salvas</p>
        </div>
      )}
    </div>
  </div>
);

const App: React.FC = () => {
  const [items, setItems] = useState<GroceryItem[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  const [savedLists, setSavedLists] = useState<SavedList[]>(() => JSON.parse(localStorage.getItem(SAVED_LISTS_KEY) || '[]'));
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'results' | 'archive'>('list');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [suggestion, setSuggestion] = useState({ name: '', icon: '' });

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(savedLists)), [savedLists]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => setError("Ative o GPS para localizar mercados.")
      );
    }
  }, []);

  const handleOpenSaveModal = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const { name, icon } = await suggestListNameAndIcon(items);
      setSuggestion({ name, icon });
      setIsSaveModalOpen(true);
    } catch {
      setSuggestion({ name: "Minha Lista", icon: "ShoppingBasket" });
      setIsSaveModalOpen(true);
    } finally { setLoading(false); }
  };

  const handleSaveList = (name: string, icon: string) => {
    const newList = { id: Math.random().toString(36).substr(2, 9), name, iconName: icon, items: [...items], createdAt: Date.now() };
    setSavedLists(prev => [newList, ...prev]);
    setIsSaveModalOpen(false);
  };

  const handleOptimize = async () => {
    if (!items.length || !location) return;
    setLoading(true); setError(null); setResults(null);
    setProgress({ current: 0, total: items.length });

    try {
      const marketAggregator: Record<string, Market> = {};
      const chunkSize = 2;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (item) => {
          try {
            const itemMarkets = await fetchItemPrices(item.name, location.lat, location.lng);
            itemMarkets.forEach(m => {
              if (!marketAggregator[m.id]) {
                marketAggregator[m.id] = { 
                  ...m, 
                  distance: `${calculateHaversineDistance(location.lat, location.lng, m.lat, m.lng).toFixed(1)} km`,
                  products: {}, 
                  totalCost: 0 
                };
              }
              const prod = (m as any).product;
              if (prod) marketAggregator[m.id].products[item.name] = { ...prod, isCheapest: true };
            });
          } finally { setProgress(prev => ({ ...prev, current: prev.current + 1 })); }
        }));
        if (i + chunkSize < items.length) await new Promise(r => setTimeout(r, 1000));
      }

      const finalMarkets = Object.values(marketAggregator).map(m => {
        const total = Object.values(m.products).reduce((s, p) => s + p.price, 0);
        return { ...m, totalCost: total };
      }).filter(m => Object.keys(m.products).length > 0);

      if (finalMarkets.length === 0) throw new Error("Sem stock próximo.");

      setResults({
        markets: finalMarkets,
        summary: {
          totalOriginalEstimate: finalMarkets[0].totalCost * 1.3,
          totalOptimizedCost: Math.min(...finalMarkets.map(m => m.totalCost)),
          savings: (finalMarkets[0].totalCost * 1.3) - Math.min(...finalMarkets.map(m => m.totalCost)),
          currencySymbol: "€"
        }
      });
      setActiveTab('results');
    } catch (err: any) { setError(err.message || "Erro."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] selection:bg-red-100">
      <Header location={location} />
      
      <main className="max-w-md mx-auto px-4 pt-4">
        {loading ? (
          <OptimizingLoader progress={progress.current} total={progress.total} />
        ) : (
          <>
            {activeTab === 'list' && (
              <ShoppingListPanel 
                items={items} setItems={setItems} handleOptimize={handleOptimize} 
                loading={loading} location={location} onSave={handleOpenSaveModal} setResults={setResults} 
              />
            )}
            {activeTab === 'results' && results && (
              <div className="space-y-6 pb-24 animate-in slide-in-from-right duration-300">
                <div className="sticky top-[64px] z-20 -mx-4 px-4 py-3 bg-[#FFFBF5]/90 backdrop-blur-md border-b border-stone-100">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-3 rounded-2xl border border-stone-100 text-center">
                      <p className="text-[8px] font-black uppercase text-stone-400">Total</p>
                      <p className="text-sm font-black text-stone-800">€{results.summary.totalOptimizedCost.toFixed(2)}</p>
                    </div>
                    <div className="bg-red-600 p-3 rounded-2xl text-center shadow-lg shadow-red-100">
                      <p className="text-[8px] font-black uppercase text-red-100">Poupa</p>
                      <p className="text-sm font-black text-white">€{results.summary.savings.toFixed(2)}</p>
                    </div>
                    <div className="bg-yellow-400 p-3 rounded-2xl text-center">
                      <p className="text-[8px] font-black uppercase text-yellow-900">Itens</p>
                      <p className="text-sm font-black text-stone-900">{items.length}</p>
                    </div>
                  </div>
                </div>
                {results.markets.map(m => <StoreCard key={m.id} market={m} currencySymbol="€" />)}
              </div>
            )}
            {activeTab === 'archive' && (
              <SavedListsSection savedLists={savedLists} onLoad={(l) => { loadSavedList(l); setActiveTab('list'); }} onDelete={deleteSavedList} />
            )}
            {activeTab === 'results' && !results && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
                <Search className="w-12 h-12 text-stone-200 mb-4" />
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Inicie uma auditoria para ver resultados</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Navegação Inferior (Abas) */}
      {!loading && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-6 py-3 flex justify-between items-center z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <button onClick={() => setActiveTab('list')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'list' ? 'text-red-600' : 'text-stone-300'}`}>
            <ListIcon className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase">Lista</span>
          </button>
          <button onClick={() => setActiveTab('results')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'results' ? 'text-red-600' : 'text-stone-300'}`}>
            <PieChart className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase">Preços</span>
          </button>
          <button onClick={() => setActiveTab('archive')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'archive' ? 'text-red-600' : 'text-stone-300'}`}>
            <Clock className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase">Arquivo</span>
          </button>
        </nav>
      )}

      {/* Bottom Sheet Modal para Guardar */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-stone-900/60 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[3rem] p-8 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1.5 bg-stone-100 rounded-full mx-auto mb-6" />
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-lime-100 p-3 rounded-2xl text-lime-600">
                <DynamicIcon name={suggestion.icon} className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-stone-900">Guardar Lista</h3>
                <p className="text-xs text-stone-400 font-bold uppercase tracking-tight">Personalize o nome da lista</p>
              </div>
            </div>
            <input 
              type="text" 
              value={suggestion.name} 
              onChange={(e) => setSuggestion(s => ({...s, name: e.target.value}))}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 font-bold text-stone-800 focus:outline-none mb-6 text-sm"
              placeholder="Nome da lista..."
            />
            <div className="flex gap-3">
              <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 bg-stone-100 text-stone-500 font-black py-4 rounded-2xl text-sm">Cancelar</button>
              <button onClick={() => handleSaveList(suggestion.name, suggestion.icon)} className="flex-2 bg-lime-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-lime-100 text-sm px-8">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="fixed top-20 left-4 right-4 z-40 bg-red-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in zoom-in"><AlertTriangle className="w-5 h-5 shrink-0" /><p className="text-xs font-bold leading-tight">{error}</p></div>}
    </div>
  );

  function loadSavedList(list: SavedList) { setItems(list.items); setResults(null); }
  function deleteSavedList(id: string) { setSavedLists(prev => prev.filter(l => l.id !== id)); }
};

export default App;
