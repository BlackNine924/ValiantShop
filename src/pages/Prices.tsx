import { Zap, Sparkles, AlertCircle } from 'lucide-react';

const PRICES_NORMAL = [
  { iv: '4 IVs', price: '40k', label: 'Iniciante' },
  { iv: '5 IVs Castrado', price: '70k', label: 'Eficaz' },
  { iv: '5 IVs Reproduzível', price: '80k', label: 'Avançado' },
  { iv: '6 IVs Castrado', price: '90k', label: 'Perfeito' },
  { iv: '6 IVs Reproduzível', price: '100k', label: 'Elite' }
];

const PRICES_GENDERLESS = [
  { iv: '4 IVs', price: '80k', label: 'Iniciante' },
  { iv: '5 IVs Castrado', price: '140k', label: 'Eficaz' },
  { iv: '5 IVs Reproduzível', price: '160k', label: 'Avançado' },
  { iv: '6 IVs Castrado', price: '180k', label: 'Perfeito' },
  { iv: '6 IVs Reproduzível', price: '200k', label: 'Elite' }
];

export const Prices = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 animate-fade">
      <div className="mb-20 text-center">
        <h2 className="pixel-title text-4xl mb-4">Tabela de <span className="text-primary">Valores</span></h2>
        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Precisão técnica com preço justo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        <PriceTable title="Normal Breeding" data={PRICES_NORMAL} icon={<Zap size={24} className="text-primary" />} />
        <PriceTable title="Genderless Breeding" data={PRICES_GENDERLESS} icon={<Sparkles size={24} className="text-secondary" />} />
      </div>

      <div className="glow-card p-10 flex flex-col md:flex-row items-center gap-10 bg-primary/5 border-primary/20">
        <div className="p-5 bg-primary/20 rounded-full">
          <AlertCircle size={48} className="text-primary" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="pixel-title text-xl mb-2 text-white">Serviços Adicionais</h3>
          <p className="text-gray-400 leading-relaxed mb-4">Habilidade Oculta (HA) possui um custo adicional fixo de <span className="text-secondary font-black">15k</span> por pedido, devido à raridade genética.</p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <span className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-xs font-bold text-gray-400">Natureza Custom: <span className="text-primary font-black">GRÁTIS</span></span>
            <span className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-xs font-bold text-gray-400">Gênero Escolhido: <span className="text-primary font-black">GRÁTIS</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PriceTable = ({ title, data, icon }: any) => (
  <div className="glow-card overflow-hidden">
    <div className="p-8 border-b border-white/5 flex items-center justify-between">
      <h3 className="pixel-title text-xl">{title}</h3>
      {icon}
    </div>
    <div className="divide-y divide-white/5">
      {data.map((item: any, i: number) => (
        <div key={i} className="px-8 py-5 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
          <div>
            <p className="text-[10px] font-black text-gray-600 uppercase mb-1">{item.label}</p>
            <p className="font-bold">{item.iv}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-primary">{item.price}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
