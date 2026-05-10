import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, ArrowRight, HelpCircle, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Word {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  components: string[];
}

const FALLBACK_WORDS: Word[] = [
  { id: '1', character: '妈', pinyin: 'mā', meaning: 'Mother', components: ['女', '马'] },
  { id: '2', character: '好', pinyin: 'hǎo', meaning: 'Good', components: ['女', '子'] },
  { id: '3', character: '林', pinyin: 'lín', meaning: 'Forest', components: ['木', '木'] },
];

export default function GuessingGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const q = collection(db, 'words');
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setWords(FALLBACK_WORDS);
        } else {
          setWords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Word)));
        }
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
      const current = words[currentIndex];
      const others = words.filter(w => w.id !== current.id);
      
      let wrongCount = 1;
      if (difficulty === 'medium') wrongCount = 3;
      if (difficulty === 'hard') {
        wrongCount = 5;
        setTimeLeft(15);
      }

      const wrongOptions = others.sort(() => Math.random() - 0.5).slice(0, wrongCount).map(w => w.meaning);
      const allOptions = [current.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);
      setOptions(allOptions);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  }, [currentIndex, words]);

  useEffect(() => {
    if (difficulty === 'hard' && timeLeft > 0 && !selectedOption) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (difficulty === 'hard' && timeLeft === 0 && !selectedOption) {
      handleOptionClick('TIMEOUT_SPECIAL_VAL_XXXX');
    }
  }, [timeLeft, selectedOption]);

  const handleOptionClick = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const correct = option === words[currentIndex].meaning;
    setIsCorrect(correct);
    if (correct) {
      const bonus = difficulty === 'hard' ? timeLeft : 0;
      setScore(s => s + 15 + bonus);
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.8 }
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

  if (!difficulty) {
    return (
      <div className="max-w-xl mx-auto p-12 mc-panel bg-white flex flex-col items-center gap-10 shadow-[16px_16px_0_0_#000]">
        <div className="text-center space-y-4">
          <h2 className="font-bangers text-6xl uppercase text-hero-blue tracking-widest">Hero Quiz</h2>
          <p className="font-comic text-slate-500 font-bold">SELECT YOUR DIFFICULTY</p>
        </div>
        <div className="grid grid-cols-1 w-full gap-6">
          <button onClick={() => setDifficulty('easy')} className="btn-pixel bg-mc-green text-2xl py-6 hover:scale-105 transition-transform">EASY (2 Options)</button>
          <button onClick={() => setDifficulty('medium')} className="btn-pixel bg-orange-500 text-2xl py-6 hover:scale-105 transition-transform">MEDIUM (4 Options)</button>
          <button onClick={() => setDifficulty('hard')} className="btn-pixel bg-hero-red text-2xl py-6 hover:scale-105 transition-transform">HARD (Speed Run!)</button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="h-96 flex items-center justify-center font-pixel text-2xl">Loading Quiz...</div>;

  const current = words[currentIndex];

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col items-center min-h-[600px]">
      <div className="w-full flex justify-between items-center mb-12">
        <div className="flex gap-4">
          <div className="mc-panel px-4 py-2 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-pixel text-xl">{score}</span>
          </div>
          {difficulty === 'hard' && (
            <div className={`mc-panel px-4 py-2 flex items-center gap-2 ${timeLeft < 5 ? 'bg-red-100 text-red-600 animate-pulse' : ''}`}>
              <span className="font-pixel">TIME: {timeLeft}s</span>
            </div>
          )}
        </div>
        <div className="font-pixel text-lg">Quiz {currentIndex + 1} / {words.length}</div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="w-full flex flex-col items-center gap-8"
        >
          <div className="mc-panel bg-white p-12 relative shadow-[12px_12px_0_0_#000]">
            <h1 className="text-9xl font-bold">{current.character}</h1>
            <div className="absolute -top-4 -left-4 bg-hero-red p-2 rounded-full border-4 border-black text-white">
              <HelpCircle size={24} />
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="font-pixel text-2xl text-mc-dirt">{current.pinyin}</p>
            <p className="font-comic text-slate-500 uppercase text-xs tracking-[0.2em] font-bold">What does this character mean?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
            {options.map((option, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOptionClick(option)}
                disabled={selectedOption !== null}
                className={`p-6 mc-panel text-xl font-bold uppercase transition-all flex items-center justify-between
                  ${selectedOption === option ? (isCorrect ? 'bg-mc-green text-white border-green-800' : 'bg-hero-red text-white border-red-800') : 'bg-white hover:bg-stone-50'}
                  ${selectedOption && option === current.meaning ? 'bg-mc-green text-white border-green-800' : ''}
                `}
              >
                <span>{option}</span>
                {selectedOption === option && (
                  isCorrect ? <Star fill="white" /> : <AlertCircle />
                )}
              </motion.button>
            ))}
          </div>

          {selectedOption && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={nextWord}
              className="btn-pixel mt-8 text-2xl px-12 py-4"
            >
              Continue Adventure <ArrowRight />
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
