import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp, increment } from 'firebase/firestore';
import type { PixelHuntEvent } from '../types/social';
import { Sparkles } from 'lucide-react';
import { POKEMON_DATA } from '../data/pokemonData';
import { getCleanSpeciesName } from '../utils/pokemonNameUtils';

// localStorage key: stores the spawnTime of the last hunt the user caught
const CAUGHT_KEY = 'valiant_pixel_hunt_caught_spawn';

export const PixelHunt = () => {
  const [hunt, setHunt] = useState<PixelHuntEvent | null>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [caught, setCaught] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const lastSpawnRef = useRef<string | null>(null);

  const getPokemonSprite = (name: string) => {
    if (!name) return '';
    const isShiny = name.toLowerCase().startsWith('shiny ');
    const searchName = getCleanSpeciesName(name);

    const pokemon = POKEMON_DATA.find(p => p.name.toLowerCase() === searchName.toLowerCase());
    if (pokemon) {
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${isShiny ? 'shiny/' : ''}${pokemon.id}.png`;
    }

    const slug = searchName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://img.pokemondb.net/sprites/home/${isShiny ? 'shiny' : 'normal'}/${slug}.png`;
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'global_events', 'pixel_hunt'), (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data() as PixelHuntEvent;
      const spawnKey = data.spawnTime?.toString() || 'no-spawn';

      // Check if this is a new/different event session
      const isNewSession = lastSpawnRef.current !== spawnKey;

      if (isNewSession) {
        lastSpawnRef.current = spawnKey;

        if (data.isActive) {
          // Check localStorage: did this user already catch THIS specific spawn?
          const caughtSpawn = localStorage.getItem(CAUGHT_KEY);
          const alreadyCaught = caughtSpawn === spawnKey;

          setCaught(alreadyCaught);
          setShowCelebration(false);

          // Only randomize position if not already caught
          if (!alreadyCaught) {
            setPos({
              x: Math.random() * 80 + 5,
              y: Math.random() * 80 + 5,
            });
          }
        } else {
          // Event ended - don't show pokemon
          setCaught(false);
          setShowCelebration(false);
        }
      } else if (data.isActive) {
        // Same session, just sync: check localStorage again in case another tab caught it
        const caughtSpawn = localStorage.getItem(CAUGHT_KEY);
        if (caughtSpawn === spawnKey) {
          setCaught(true);
        }
      }

      setHunt(data);
    });

    return unsubscribe;
  }, []);

  const handleCatch = async () => {
    if (!hunt || caught) return;

    const spawnKey = hunt.spawnTime?.toString() || 'no-spawn';

    // Immediately mark as caught in localStorage so F5 won't show it again
    localStorage.setItem(CAUGHT_KEY, spawnKey);
    setCaught(true);
    setShowCelebration(true);

    if (!auth.currentUser) {
      // Guest user: localStorage is enough for the UI
      setTimeout(() => setShowCelebration(false), 4000);
      return;
    }

    try {
      const huntRef = doc(db, 'global_events', 'pixel_hunt');
      await updateDoc(huntRef, {
        winners: arrayUnion({
          uid: auth.currentUser.uid,
          nick: auth.currentUser.displayName || 'Treinador',
          timestamp: serverTimestamp()
        })
      });

      const profileRef = doc(db, 'trainer_profiles', auth.currentUser.uid);
      await updateDoc(profileRef, {
        pixelHuntCatches: increment(1),
        lastPixelHuntCatchAt: serverTimestamp()
      }).catch(err => console.error('Error updating trainer hunt stats:', err));

      setTimeout(() => setShowCelebration(false), 4000);
    } catch (error) {
      console.error('Error catching pokemon:', error);
    }
  };

  // Only render if there's an active hunt OR we're showing the celebration screen
  if (!hunt || !hunt.isActive) {
    if (!showCelebration) return null;
  }

  return (
    <>
      {/* Pokemon sprite — hidden once caught */}
      {!caught && hunt?.isActive && (
        <div
          className="fixed z-[9999] cursor-pointer group"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          onClick={handleCatch}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], y: [0, -10, 0], opacity: 1 }}
            transition={{ duration: 2, repeat: Infinity, opacity: { duration: 0.5 } }}
            className="relative"
          >
            <img
              src={getPokemonSprite(hunt.pokemonName)}
              className="w-7 h-7 [image-rendering:pixelated] drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] filter brightness-110 saturate-150"
              alt="Pixel Hunt"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';
              }}
            />
            <div className="absolute -top-2 -right-2 bg-primary text-black text-[8px] font-black px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              CAPTURA!
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showCelebration && hunt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCelebration(false)}
            />
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="relative bg-black/80 backdrop-blur-xl border-4 border-primary p-8 sm:p-12 rounded-[40px] text-center shadow-[0_0_100px_var(--primary-glow)] max-w-lg w-full"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <img
                  src={getPokemonSprite(hunt.pokemonName)}
                  alt={hunt.pokemonName}
                  className="w-32 h-32 mx-auto relative z-10 [image-rendering:pixelated] drop-shadow-[0_0_15px_var(--primary-glow)]"
                />
              </div>
              <h2 className="pixel-title text-2xl sm:text-4xl text-white mb-4 animate-pulse uppercase">
                VOCÊ O ENCONTROU!
              </h2>
              <p className="text-primary font-black uppercase tracking-[0.4em] text-[10px] sm:text-xs">
                A recompensa foi adicionada ao seu perfil!
              </p>
              <div className="flex gap-4 justify-center mt-8">
                {[...Array(5)].map((_, i) => (
                  <Sparkles
                    key={i}
                    className="text-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
