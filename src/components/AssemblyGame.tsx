import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, ArrowRight, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ComponentPart {
  id: string;
  char: string;
}

interface Character {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  parts: string[];
}

const FALLBACK_WORDS: Character[] = [
  { id: '1', character: '妈', pinyin: 'mā', meaning: 'Mother', parts: ['女', '马'] },
  { id: '2', character: '好', pinyin: 'hǎo', meaning: 'Good', parts: ['女', '子'] },
  { id: '3', character: '休', pinyin: 'xiū', meaning: 'Rest', parts: ['人', '木'] },
  { id: '4', character: '森', pinyin: 'sēn', meaning: 'Forest', parts: ['木', '木', '木'] },
];

export default function AssemblyGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [words, setWords] = useState<Character[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slots, setSlots] = useState<(ComponentPart | null)[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [availableParts, setAvailableParts] = useState<ComponentPart[]>([]);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const q = collection(db, 'words');
        const snapshot = await getDocs(q);
        let wordData: Character[] = [];
        if (snapshot.empty) {
          wordData = FALLBACK_WORDS;
        } else {
          wordData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            character: doc.data().character,
            pinyin: doc.data().pinyin,
            meaning: doc.data().meaning,
            parts: doc.data().components || []
          }) as Character);
        }

        if (difficulty) {
          if (difficulty === 'easy') {
            wordData = wordData.filter(w => w.parts.length <= 2);
          } else if (difficulty === 'medium') {
            wordData = wordData.filter(w => w.parts.length <= 3);
          }
        }
        
        setWords(wordData.length > 0 ? wordData : FALLBACK_WORDS);
      } catch (e) {
        setWords(FALLBACK_WORDS);
      } finally {
        setLoading(false);
      }
    };
    if (difficulty) fetchWords();
  }, [difficulty]);

  useEffect(() => {
    if (words.length > 0) {
      const word = words[currentIndex];
      const parts = (word.parts || []).map((p, i) => ({ id: `${i}-${p}-${Math.random()}`, char: p }))
        .sort(() => Math.random() - 0.5);
      setAvailableParts(parts);
      setSlots(new Array(Math.max(4, word.parts.length)).fill(null));
      setIsCorrect(false);
    }
  }, [currentIndex, words]);

  if (!difficulty) {
    return (
      <div className="max-w-xl mx-auto p-12 mc-panel bg-white flex flex-col items-center gap-10 shadow-[16px_16px_0_0_#000]">
        <div className="text-center space-y-4">
          <h2 className="font-bangers text-6xl uppercase text-hero-blue tracking-widest">Assembly Challenge</h2>
          <p className="font-comic text-slate-500 font-bold">SELECT YOUR POWER LEVEL</p>
        </div>
        <div className="grid grid-cols-1 w-full gap-6">
          <button onClick={() => setDifficulty('easy')} className="btn-pixel bg-mc-green text-2xl py-6 hover:scale-105 transition-transform">EASY (2 Parts)</button>
          <button onClick={() => setDifficulty('medium')} className="btn-pixel bg-orange-500 text-2xl py-6 hover:scale-105 transition-transform">MEDIUM (3 Parts)</button>
          <button onClick={() => setDifficulty('hard')} className="btn-pixel bg-hero-red text-2xl py-6 hover:scale-105 transition-transform">HARD (Complex)</button>
        </div>
      </div>
    );
  }

  const handleDrop = (part: ComponentPart, slotIndex: number) => {
    const newSlots = [...slots];
    // Remove if already in another slot
    const existingIndex = newSlots.findIndex(s => s?.id === part.id);
    if (existingIndex !== -1) newSlots[existingIndex] = null;
    
    newSlots[slotIndex] = part;
    setSlots(newSlots);

    // Check if correct
    const currentAssembled = newSlots.filter(s => s !== null).map(s => s!.char).join('');
    const target = words[currentIndex].parts.join('');
    
    if (currentAssembled === target) {
      setIsCorrect(true);
      setScore(s => s + 15);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 }
      });
    }
  };

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      onComplete(score);
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center font-pixel text-2xl">
      Loading Hero Data...
    </div>
  );

  const word = words[currentIndex];

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col items-center min-h-[600px]">
      <div className="w-full flex justify-between items-center mb-12">
        <div className="mc-panel px-4 py-2 flex items-center gap-2">
          <Trophy className="text-yellow-500" size={20} />
          <span className="font-pixel text-xl">{score}</span>
        </div>
        <div className="font-pixel text-lg">Power {currentIndex + 1} / {words.length}</div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={word.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="flex flex-col items-center gap-8 w-full"
        >
          {/* Tian Zi Ge Grid */}
          <div className="relative">
            <div className={`grid grid-cols-2 grid-rows-2 w-64 h-64 bg-white border-8 border-black relative transition-all shadow-[12px_12px_0_0_#000] ${isCorrect ? 'border-mc-green' : ''}`}>
              {/* Grid Lines */}
              <div className="absolute inset-0 flex items-center pointer-events-none">
                <div className="w-full h-0 border-t-2 border-dashed border-stone-300" />
              </div>
              <div className="absolute inset-0 flex justify-center pointer-events-none">
                <div className="h-full w-0 border-l-2 border-dashed border-stone-300" />
              </div>

              {slots.map((slot, i) => (
                <div 
                  key={i}
                  className={`flex items-center justify-center p-2 border border-slate-50 relative`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e: React.DragEvent) => {
                    const dataStr = e.dataTransfer.getData('part');
                    if (!dataStr) return;
                    const data = JSON.parse(dataStr);
                    handleDrop(data, i);
                  }}
                >
                  <AnimatePresence>
                    {slot ? (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-6xl font-bold cursor-pointer"
                        onClick={() => {
                          const newSlots = [...slots];
                          newSlots[i] = null;
                          setSlots(newSlots);
                        }}
                      >
                        {slot.char}
                      </motion.div>
                    ) : (
                      <div className="w-full h-full bg-stone-50/50 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-dashed border-stone-300 rounded-full" />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {isCorrect && (
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute -top-8 -right-8 bg-yellow-400 p-4 rounded-full border-4 border-black z-10"
              >
                <div className="text-4xl">🏆</div>
              </motion.div>
            )}
          </div>

          <div className="text-center space-y-2">
            <h2 className="font-bangers text-5xl tracking-wide uppercase text-hero-blue">{word.meaning}</h2>
            <p className="font-pixel text-xl text-mc-dirt">{word.pinyin}</p>
          </div>

          <div className="flex flex-col items-center gap-6 w-full mt-4">
            <div className="flex gap-4">
              <div className="comic-bubble py-2 px-6">
                <p className="font-comic font-bold text-black uppercase text-sm">Drag parts to the grid!</p>
              </div>
              <button 
                onClick={() => setSlots([null, null, null, null])}
                className="bg-orange-500 hover:bg-orange-600 text-white font-pixel p-2 border-4 border-black flex items-center gap-2 text-xs"
              >
                <RefreshCw size={14} /> RESET
              </button>
            </div>
            
            {/* Parts Palette */}
            <div className="flex flex-wrap justify-center gap-4 p-8 bg-stone-200 mc-panel border-stone-400 w-full min-h-[120px]">
              {availableParts.map((part) => {
                const isInSlot = slots.some(s => s?.id === part.id);
                return (
                  <motion.div
                    key={part.id}
                    draggable={!isInSlot}
                    onDragStartCapture={(e: any) => {
                      e.dataTransfer.setData('part', JSON.stringify(part));
                    }}
                    whileHover={!isInSlot ? { scale: 1.1, rotate: 2 } : {}}
                    whileTap={!isInSlot ? { scale: 0.9, rotate: -2 } : {}}
                    className={`w-20 h-20 bg-white rounded-xl border-4 border-black flex items-center justify-center text-4xl shadow-[6px_6px_0_0_#000] ${isInSlot ? 'opacity-20 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:bg-yellow-50'}`}
                  >
                    {part.char}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {isCorrect && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={nextWord}
              className="btn-pixel flex items-center gap-2 mt-4 text-2xl py-4 px-10"
            >
              Next Mission <ArrowRight size={24} />
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
