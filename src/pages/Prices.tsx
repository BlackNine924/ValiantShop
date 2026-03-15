import { Check } from 'lucide-react';

const PRICES_NORMAL = [
  { iv: '4 IVs', price: '40.000' },
  { iv: '5 IVs Castrado', price: '70.000' },
  { iv: '5 IVs Reproduzível', price: '80.000' },
  { iv: '6 IVs Castrado', price: '90.000' },
  { iv: '6 IVs Reproduzível', price: '100.000' }
];

const PRICES_GENDERLESS = [
  { iv: '4 IVs', price: '80.000' },
  { iv: '5 IVs Castrado', price: '140.000' },
  { iv: '5 IVs Reproduzível', price: '160.000' },
  { iv: '6 IVs Castrado', price: '180.000' },
  { iv: '6 IVs Reproduzível', price: '200.000' }
];

export const Prices = () => {
  return (
    <div className="py-10 animate-fade">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
          Nossa Tabela de Preços
        </h2>
        <p className="text-gray-400">Valores em Pokédollars (PD). Qualidade premium em cada breed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Normal Breeding */}
        <div className="card border-purple-500/20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">Pokémon Com Gênero</h3>
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-widest border border-purple-500/20">
              Padrão
            </span>
          </div>
          <div className="space-y-4">
            {PRICES_NORMAL.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all">
                <span className="text-gray-300 font-medium">{p.iv}</span>
                <span className="text-xl font-bold text-white">{p.price} <span className="text-xs text-purple-400">PD</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Genderless Breeding */}
        <div className="card border-blue-500/20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">Pokémon Sem Gênero</h3>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/20">
              Ditto Breeding
            </span>
          </div>
          <div className="space-y-4">
            {PRICES_GENDERLESS.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all">
                <span className="text-gray-300 font-medium">{p.iv}</span>
                <span className="text-xl font-bold text-white">{p.price} <span className="text-xs text-blue-400">PD</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 glass p-8 rounded-2xl text-center border border-purple-500/20">
        <h4 className="text-xl font-bold mb-4">Serviços Adicionais</h4>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-gray-300">
            <Check size={18} className="text-purple-400" />
            <span>Habilidade Oculta: <strong>+15.000 PD</strong></span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Check size={18} className="text-purple-400" />
            <span>Nature Personalizada: <strong>Grátis</strong></span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Check size={18} className="text-purple-400" />
            <span>Gênero Específico: <strong>Grátis</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
