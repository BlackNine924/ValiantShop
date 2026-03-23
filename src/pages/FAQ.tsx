import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle, Search, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const FAQ = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'FAQ'), orderBy('question', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.docs.length > 0) {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FAQItem[];
        setFaqs(data);
      } else {
        loadFallback();
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore FAQ error:", error);
      loadFallback();
      setLoading(false);
    });

    function loadFallback() {
      setFaqs([
        { id: '1', question: 'Como recebo meu Pokémon?', answer: 'Seu Pokémon será entregue via Trade in-game no servidor. Nossa equipe entrará em contato.', category: 'Geral' },
        { id: '2', question: 'Quanto tempo demora a entrega?', answer: 'O tempo de entrega não pode ser determinado, já que depende puramente da sorte.', category: 'Geral' },
        { id: '3', question: 'Como funciona o pagamento?', answer: 'Você paga em dinheiro do próprio servidor, usando o comando /pay, porém, apenas quando o Pokémon estiver "Finalizado" e pronto para entrega.', category: 'Pagamentos' },
        { id: '4', question: 'O que significa Breedable e Castrado?', answer: 'Pokémons castrados são mais baratos (desconto de 15k) mas não podem ser cruzados entre si para gerar novos ovos.', category: 'Pokémons' },
        { id: '5', question: 'Posso encomendar Pokémon Shiny?', answer: 'Não, se vier shiny sim, entregamos, mas não fazemos encomendas especificamente de shinys.', category: 'Pokémons' },
        { id: '6', question: 'Vocês entregam Pokémons na Forma Final?', answer: 'Não, vendemos apenas pokémons em suas formas iniciais, sempre em seus respectivos ovos.', category: 'Geral' }
      ]);
    }
    return unsubscribe;
  }, []);

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade">
      <div className="text-center mb-16">
        <h2 className="pixel-title text-4xl mb-4">DÚVIDAS <span className="text-secondary">FREQUENTES</span></h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Tudo o que você precisa saber sobre a Valiant Shop</p>
      </div>

      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
        <input
          type="text"
          className="w-full bg-black/40 border-2 border-white/5 rounded-2xl pl-16 pr-6 py-5 focus:border-secondary outline-none text-lg font-bold transition-all"
          placeholder="Qual a sua dúvida?"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-gray-600 font-black italic uppercase animate-pulse">Consultando oráculo...</div>
        ) : filteredFaqs.length === 0 ? (
          <div className="text-center py-20 text-gray-600 font-black italic uppercase">Nenhuma resposta encontrada. Tente termos mais simples.</div>
        ) : filteredFaqs.map((faq) => (
          <div key={faq.id} className="glow-card border-white/5 bg-black/40 overflow-hidden">
            <button
              onClick={() => setActiveId(activeId === faq.id ? null : faq.id)}
              className="w-full px-8 py-6 flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg transition-colors ${activeId === faq.id ? 'bg-secondary text-white' : 'bg-white/5 text-gray-500 group-hover:text-primary'}`}>
                  <HelpCircle size={18} />
                </div>
                <span className={`font-black uppercase tracking-wider transition-colors ${activeId === faq.id ? 'text-secondary' : 'text-gray-300'}`}>{faq.question}</span>
              </div>
              {activeId === faq.id ? <ChevronUp className="text-secondary" /> : <ChevronDown className="text-gray-600" />}
            </button>
            <AnimatePresence>
              {activeId === faq.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-8 pt-2 text-gray-400 font-bold text-sm leading-relaxed border-t border-white/5 mt-2">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="mt-20 p-8 glow-card border-primary/20 bg-primary/5 text-center">
        <MessageCircle className="mx-auto mb-4 text-primary" size={32} />
        <h4 className="pixel-title text-xl mb-2">Ainda com <span className="text-primary">Dúvidas?</span></h4>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">Nossa equipe está pronta para te ajudar via Chat em Tempo Real.</p>
        <button onClick={() => navigate('/status?chat=support')} className="btn-manda !bg-primary !shadow-primary-glow">ABRIR CHAT DE SUPORTE</button>
      </div>
    </div>
  );
};
