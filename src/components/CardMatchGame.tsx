import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Word {
  id: string;
  char: string;
  meaning: string;
}

const FALLBACK_CARDS: Word[] = [
  { id: '1', char: '妈', meaning: 'Mother' },
  { id: '2', char: '好', meaning: 'Good' },
  { id: '3', char: '校', meaning: 'School' },
  { id: '4', char: '林', meaning: 'Forest' },
  { id: '5', char: '森', meaning: 'Woods' },
  { id: '6', char: '木', meaning: 'Wood' },
];

interface CardState {
  id: string;
  content: string;
  type: 'char' | 'meaning';
  isFlipped: boolean;
  isMatched: boolean;
  matchId: string;
}

export default function CardMatchGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (difficulty) {
      initializeGame();
    }
  }, [difficulty]);

  const initializeGame = async () => {
    setLoading(true);
    let words: Word[] = [];
    try {
      const q = collection(db, 'words');
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        words = FALLBACK_CARDS;
      } else {
        words = snapshot.docs.map(doc => ({
          id: doc.id,
          char: doc.data().character,
          meaning: doc.data().meaning
        }));
      }
    } catch (e) {
      words = FALLBACK_CARDS;
    }

    // Determine number of pairs based on difficulty
    let pairsCount = 4;
    let initialLives = 5;
    if (difficulty === 'medium') { pairsCount = 6; initialLives = 4; }
    if (difficulty === 'hard') { pairsCount = 8; initialLives = 3; }

    const selectedWords = words.sort(() => Math.random() - 0.5).slice(0, pairsCount);
    
    const gameCards: CardState[] = [];
    selectedWords.forEach(word => {
      gameCards.push({
        id: `char-${word.id}`,
        content: word.char,
        type: 'char',
        isFlipped: false,
        isMatched: false,
        matchId: word.id
      });
      gameCards.push({
        id: `meaning-${word.id}`,
        content: word.meaning,
        type: 'meaning',
        isFlipped: false,
        isMatched: false,
        matchId: word.id
      });
    });

    setCards(gameCards.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setLives(initialLives);
    setScore(0);
    setLoading(false);
  };

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || cards[index].isMatched || cards[index].isFlipped) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [firstIndex, secondIndex] = newFlipped;
      if (cards[firstIndex].matchId === cards[secondIndex].matchId) {
        // Match!
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setScore(s => s + 20);

          if (matchedCards.every(c => c.isMatched)) {
            confetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.6 }
            });
            setTimeout(() => onComplete(score + 20), 1500);
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedCards([]);
          setLives(l => Math.max(0, l - 1));
        }, 1000);
      }
    }
  };

  if (!difficulty) {
    return (
      <div className="max-w-xl mx-auto p-12 mc-panel bg-white flex flex-col items-center gap-10 shadow-[16px_16px_0_0_#000]">
        <div className="text-center space-y-4">
          <h2 className="font-bangers text-6xl uppercase text-hero-blue tracking-widest">Card Master</h2>
          <p className="font-comic text-slate-500 font-bold">SELECT YOUR DIFFICULTY</p>
        </div>
        <div className="grid grid-cols-1 w-full gap-6">
          <button onClick={() => setDifficulty('easy')} className="btn-pixel bg-mc-green text-2xl py-6 hover:scale-105 transition-transform">EASY (4 Pairs)</button>
          <button onClick={() => setDifficulty('medium')} className="btn-pixel bg-orange-500 text-2xl py-6 hover:scale-105 transition-transform">MEDIUM (6 Pairs)</button>
          <button onClick={() => setDifficulty('hard')} className="btn-pixel bg-hero-red text-2xl py-6 hover:scale-105 transition-transform">HARD (8 Pairs)</button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="h-96 flex items-center justify-center font-pixel text-2xl">Preparing Cards...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <div className="mc-panel px-4 py-2 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-pixel text-xl">{score}</span>
          </div>
          <div className="mc-panel px-4 py-2 flex items-center gap-2">
            <Heart className={lives === 0 ? "text-stone-400" : "text-red-500 fill-current"} size={20} />
            <span className="font-pixel text-xl">{lives}</span>
          </div>
        </div>
        <button onClick={initializeGame} className="btn-pixel bg-hero-blue border-white flex items-center gap-2">
          <RefreshCw size={18} /> Reset
        </button>
      </div>

      <div className={`grid gap-4 w-full ${difficulty === 'easy' ? 'grid-cols-2 md:grid-cols-4' : difficulty === 'medium' ? 'grid-cols-3 md:grid-cols-4' : 'grid-cols-4'}`}>
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCardClick(index)}
            className={`aspect-square cursor-pointer transition-transform duration-500 preserve-3d relative ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}
          >
            {/* Front of card */}
            <div className={`absolute inset-0 mc-panel flex items-center justify-center text-center p-2 text-xl font-bold backface-hidden ${card.isMatched ? 'bg-mc-green/20 border-mc-green' : 'bg-white'}`}>
              {card.isFlipped || card.isMatched ? (
                <div className="rotate-y-180">
                  {card.content}
                </div>
              ) : (
                <div className="minecraft-bg w-12 h-12 rounded-sm" />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {lives === 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="mc-panel p-8 flex flex-col items-center gap-6 max-w-sm w-full text-center bg-white">
            <h2 className="font-bangers text-5xl text-red-500">OUT OF LIVES!</h2>
            <p className="font-pixel text-xl">The adventure ends here...</p>
            <button onClick={initializeGame} className="btn-pixel w-full">Try Again</button>
          </div>
        </div>
      )}
    </div>
  );
}
