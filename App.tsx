
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Navigation2
} from 'lucide-react';
import { GroceryItem, OptimizationResult, MarketProduct, Market } from './types';
import { optimizeShoppingList, parseReceiptPdf } from './services/geminiService';
import StoreCard from './components/StoreCard';

const STORAGE_KEY = 'smartshop-grocery-list';
const CESTA_BASICA_ITEMS = [
  "Arroz Agulha (1kg)","Feijão Encarnado (1kg)","Açúcar Branco (1kg)","Café Moído (250g)","Azeite (750ml)","Massa Esparguete (500g)","Farinha (1kg)","Leite Mimosa (1L)","Manteiga (250g)","Pão de Forma","Ovos (L)","Papel Higiénico (12 rlos)","Detergente Loiça","Bananas (kg)","Batatas (kg)"
];

const LOADING_STEPS = [
  "Sincronizando com Google Shopping...",
  "Extraindo snippets de preços em tempo real...",
  "Validando marcas brancas vs marcas premium...",
  "Consultando folhetos oficiais ativos...",
  "Finalizando Auditoria Digital..."
];

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
  <header className="bg-white border-b border-orange-100 sticky top-0 z-10 shadow-sm">
    <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-100">
          <Utensils className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">SmartShop</h1>
          <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">Auditoria Live Google Shopping</p>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${location ? 'bg-lime-50 text-lime-700 border border-lime-100' : 'bg-stone-100 text-stone-500'}`}>
        <Radar className="w-4 h-4" />
        <span className="font-bold">{location ? 'GPS Sincronizado' : 'A detetar GPS...'}</span>
      </div>
    </div>
  </header>
));

const OptimizingLoader = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-orange-100 text-center relative overflow-hidden h-[450px] flex flex-col items-center justify-center">
      <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl mb-8 animate-pulse">
        <ShoppingCart className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-xl font-black text-stone-800 transition-all duration-500 leading-tight max-w-xs h-14">
        {LOADING_STEPS[step]}
      </h3>
      <div className="mt-8 flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
        <Search className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase">Extraindo Dados Google Shopping...</span>
      </div>
    </div>
  );
};

const ShoppingListPanel: React.FC<{
  items: GroceryItem[];
  setItems: React.Dispatch<React.SetStateAction<GroceryItem[]>>;
  handleOptimize: () => void;
  loading: boolean;
  location: any;
  error: string | null;
  setResults: any;
}> = ({ items, setItems, handleOptimize, loading, location, error, setResults }) => {
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
        const products = await parseReceiptPdf(base64);
        const newItems = products.map(name => ({ id: Math.random().toString(36).substr(2, 9), name }));
        setItems(prev => [...prev, ...newItems]);
        setResults(null);
        setParsingPdf(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setParsingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setItems(CESTA_BASICA_ITEMS.map(name => ({ id: Math.random().toString(36).substr(2, 9), name })))} className="bg-orange-100 hover:bg-orange-200 text-orange-800 p-4 rounded-3xl flex flex-col items-center gap-2 transition-all group">
          <ShoppingBasket className="w-5 h-5 text-orange-600" />
          <p className="text-[9px] font-black uppercase">Carregar Cabaz</p>
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={parsingPdf}
          className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-4 rounded-3xl flex flex-col items-center gap-2 transition-all group relative overflow-hidden"
        >
          {parsingPdf ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          ) : (
            <FileText className="w-5 h-5 text-blue-600" />
          )}
          <p className="text-[9px] font-black uppercase">{parsingPdf ? 'A LER PDF...' : 'Subir Fatura'}</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePdfUpload} 
            accept="application/pdf" 
            className="hidden" 
          />
        </button>
      </div>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-red-600" />Minha Lista</h2>
        <form onSubmit={addItem} className="flex gap-2 mb-6">
          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Ex: Leite Mimosa 1L..." className="flex-1 bg-orange-50/30 border border-orange-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20" />
          <button type="submit" className="bg-red-600 hover:bg-red-700 text-white p-3.5 rounded-2xl shadow-md transition-all active:scale-95"><Plus className="w-6 h-6" /></button>
        </form>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {items.length === 0 && (
            <div className="py-8 text-center border-2 border-dashed border-stone-50 rounded-2xl">
              <p className="text-xs font-bold text-stone-300 uppercase">Lista vazia</p>
            </div>
          )}
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-transparent hover:border-orange-100 transition-colors">
              <span className="font-semibold text-stone-700 text-sm">{item.name}</span>
              <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        <button onClick={handleOptimize} disabled={loading || !location || items.length === 0} className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 active:scale-[0.98] transition-all">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          {loading ? "Processando Auditoria..." : "Comparar Preços Reais"}
        </button>
      </section>
      
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-3xl flex items-start gap-3"><AlertTriangle className="w-6 h-6 shrink-0" /><p className="text-sm font-medium">{error}</p></div>}
    </div>
  );
};

const ResultsDashboard: React.FC<{
  results: OptimizationResult;
  maxDistance: number;
  setMaxDistance: (val: number) => void;
  maxPossibleDistance: number;
}> = ({ results, maxDistance, setMaxDistance, maxPossibleDistance }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
  const currencySymbol = results?.summary?.currencySymbol || '€';
  
  const availableCategories = useMemo(() => {
    const cats = new Set<string>(['Todos']);
    results.markets.forEach(m => Object.values(m.products).forEach(p => cats.add(p.category)));
    return Array.from(cats).sort();
  }, [results]);

  const sortedAndFilteredMarkets = useMemo(() => {
    const filtered = results.markets.filter(m => parseFloat(m.distance) <= maxDistance);
    return [...filtered].sort((a, b) => {
      if (sortBy === 'distance') {
        return parseFloat(a.distance) - parseFloat(b.distance);
      } else {
        const costA = Object.values(a.products).reduce((sum, p) => sum + p.price, 0);
        const costB = Object.values(b.products).reduce((sum, p) => sum + p.price, 0);
        return costA - costB;
      }
    });
  }, [results, maxDistance, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-blue-50 border border-blue-200 p-5 rounded-[2rem] flex items-start gap-4">
        <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />
        <div>
          <h4 className="text-xs font-black text-blue-800 uppercase mb-1">Auditado via Google Shopping</h4>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Cruzámos a sua lista (incluindo itens extraídos de fatura) com os preços mais baixos encontrados online para o formato exato.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-[3rem] shadow-sm border border-orange-100">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-orange-50 rounded-2xl text-center">
            <p className="text-[10px] font-black uppercase mb-1 text-orange-600">Total Médio</p>
            <p className="text-xl font-black">{currencySymbol}{results.summary.totalOriginalEstimate.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-red-600 text-white rounded-2xl text-center shadow-lg shadow-red-100">
            <p className="text-[10px] font-black uppercase mb-1 text-red-100">Otimizado</p>
            <p className="text-xl font-black">{currencySymbol}{results.summary.totalOptimizedCost.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-yellow-400 rounded-2xl text-center">
            <p className="text-[10px] font-black uppercase mb-1 text-yellow-900">Poupança</p>
            <p className="text-xl font-black">{currencySymbol}{results.summary.savings.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {availableCategories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all ${selectedCategory === cat ? 'bg-red-600 text-white border-red-600' : 'bg-white text-stone-400 border-stone-100 hover:border-red-200'}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm flex flex-col gap-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-stone-400 uppercase">Alcance Local</h3>
            <span className="text-xs font-black text-red-600">{maxDistance} km</span>
          </div>
          <input type="range" min="1" max={maxPossibleDistance || 30} step="1" value={maxDistance} onChange={(e) => setMaxDistance(parseInt(e.target.value))} className="w-full h-2 bg-orange-100 rounded-lg appearance-none accent-red-600 cursor-pointer" />
        </div>

        <div className="pt-4 border-t border-orange-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-stone-400 uppercase flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5" /> Ordenar Resultados
            </h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSortBy('distance')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center justify-center gap-2 ${sortBy === 'distance' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-100 hover:border-stone-300'}`}
            >
              <Navigation2 className="w-3 h-3" /> Mais Próximo
            </button>
            <button 
              onClick={() => setSortBy('price')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center justify-center gap-2 ${sortBy === 'price' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-100 hover:border-stone-300'}`}
            >
              <TrendingDown className="w-3 h-3" /> Mais Barato
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-20">
        {sortedAndFilteredMarkets.length > 0 ? (
          sortedAndFilteredMarkets.map(market => (
            <StoreCard 
              key={market.id} 
              market={market} 
              currencySymbol={currencySymbol} 
              selectedCategory={selectedCategory} 
            />
          ))
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-stone-100">
            <p className="text-stone-400 font-bold">Nenhuma loja no raio definido.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [items, setItems] = useState<GroceryItem[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState(15);
  const [maxPossibleDistance, setMaxPossibleDistance] = useState(40);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)), [items]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => setError("Ative o GPS para localizar mercados próximos.")
      );
    }
  }, []);

  const handleOptimize = async () => {
    if (!items.length || !location) return;
    setLoading(true); setError(null); setResults(null);
    try {
      const data = await optimizeShoppingList(items, location.lat, location.lng);
      const processedMarkets = data.markets.map(m => {
        const dist = calculateHaversineDistance(location.lat, location.lng, m.lat, m.lng);
        return { ...m, distance: `${dist.toFixed(1)} km` };
      });
      setResults({ ...data, markets: processedMarkets });
      const dists = processedMarkets.map(m => parseFloat(m.distance));
      const max = dists.length ? Math.ceil(Math.max(...dists)) : 15;
      setMaxPossibleDistance(Math.max(max + 10, 30));
      setMaxDistance(max);
    } catch (err: any) {
      setError(err?.message || "Erro na sincronização.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] pb-24">
      <Header location={location} />
      <main className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <ShoppingListPanel items={items} setItems={setItems} handleOptimize={handleOptimize} loading={loading} location={location} error={error} setResults={setResults} />
        </div>
        <div className="lg:col-span-7">
          {loading ? (
            <OptimizingLoader />
          ) : results ? (
            <ResultsDashboard results={results} maxDistance={maxDistance} setMaxDistance={setMaxDistance} maxPossibleDistance={maxPossibleDistance} />
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center bg-white rounded-[3rem] border-2 border-dashed border-orange-200">
              <div className="bg-red-50 p-6 rounded-full mb-6">
                <Search className="w-16 h-16 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-stone-800">Crie a sua Lista</h3>
              <p className="mt-4 text-stone-500 max-w-xs text-sm font-medium">
                Adicione itens manualmente ou <strong>carregue uma fatura antiga (PDF)</strong> para encontrar os preços mais baixos hoje.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
