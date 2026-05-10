import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Settings, User, Trophy, BookMarked, Sword, Box, LayoutPanelLeft } from 'lucide-react';

import AssemblyGame from './components/AssemblyGame';
import CardMatchGame from './components/CardMatchGame';
import GuessingGame from './components/GuessingGame';
import TeacherPanel from './components/TeacherPanel';
import RewardSystem from './components/RewardSystem';

// Type definitions moved to lib/services.ts, but standard state used here for demo
interface PlayerProgress {
  coins: number;
  level: number;
  petLevel: number;
}

function MainMenu() {
  const games = [
    { 
      id: 'assembly', 
      name: 'Character Builder', 
      desc: 'Assemble Hanzi parts!', 
      icon: Box, 
      color: 'bg-mc-green',
      path: '/game/assembly'
    },
    { 
      id: 'guessing', 
      name: 'Hero Quiz', 
      desc: 'Guess the meaning!', 
      icon: Trophy, 
      color: 'bg-hero-blue',
      path: '/game/guessing'
    },
    { 
      id: 'cards', 
      name: 'Card Master', 
      desc: 'Match Chinese pairs!', 
      icon: Sword, 
      color: 'bg-hero-red',
      path: '/game/cards'
    },
  ];

  return (
    <div className="flex flex-col items-center py-12 px-4 space-y-12">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center space-y-4"
      >
        <h1 className="font-bangers text-8xl text-black tracking-tighter drop-shadow-[4px_4px_0_#fff]">
          HANZI HEROES
        </h1>
        <p className="font-pixel text-xl uppercase tracking-widest text-slate-600 bg-white/50 px-4 py-1 inline-block border-2 border-black">
          Defeat the confusion. Master the stroke.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {games.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link 
              to={game.path}
              className="flex flex-col group"
            >
              <div className={`mc-panel p-8 hover:scale-[1.02] transition-transform cursor-pointer h-full flex flex-col items-center text-center gap-6 ${game.color} text-white`}>
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/40">
                  <game.icon size={48} className="text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-bangers text-4xl tracking-wide uppercase">{game.name}</h2>
                  <p className="font-pixel text-sm text-white/80">{game.desc}</p>
                </div>
                <button className="btn-pixel bg-white text-black text-sm w-full">Start Training</button>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link 
          to="/teacher" 
          className="mc-panel bg-stone-100 p-4 flex items-center gap-2 hover:bg-stone-200 transition-colors"
        >
          <Settings size={20} />
          <span className="font-pixel text-sm">Teacher Center</span>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  const [progress, setProgress] = useState<PlayerProgress>({
    coins: 100,
    level: 1,
    petLevel: 1
  });

  const handleGameComplete = (score: number) => {
    setProgress(prev => ({
      ...prev,
      coins: prev.coins + score,
      level: prev.level + Math.floor(score / 50),
      petLevel: prev.petLevel + (score > 30 ? 1 : 0)
    }));
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen minecraft-bg selection:bg-hero-red selection:text-white">
        <div className="fixed top-4 left-4 z-50">
          <Link to="/" className="btn-pixel bg-hero-blue border-white p-2">
            <LayoutPanelLeft size={24} />
          </Link>
        </div>

        <RewardSystem progress={progress} />

        <main className="container mx-auto pt-24 pb-12">
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/game/assembly" element={<AssemblyGame onComplete={handleGameComplete} />} />
            <Route path="/game/guessing" element={<GuessingGame onComplete={handleGameComplete} />} />
            <Route path="/game/cards" element={<CardMatchGame onComplete={handleGameComplete} />} />
            <Route path="/teacher" element={<TeacherPanel />} />
          </Routes>
        </main>

        <footer className="text-center p-8 opacity-50">
          <p className="font-pixel text-[10px]">Built for Hanzi Heroes. Character Radicals v1.02</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}


