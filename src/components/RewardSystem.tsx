import { motion } from 'motion/react';
import { Gamepad2, Coins, TrendingUp, ShieldCheck } from 'lucide-react';

interface Progress {
  coins: number;
  level: number;
  petLevel: number;
}

export default function RewardSystem({ progress }: { progress: Progress }) {
  return (
    <div className="fixed top-4 right-4 flex flex-col gap-3 z-50">
      <motion.div 
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        className="mc-panel bg-yellow-50 p-3 flex items-center gap-3 border-yellow-600 min-w-[160px]"
      >
        <div className="w-10 h-10 bg-yellow-400 rounded-lg border-4 border-yellow-700 flex items-center justify-center">
          <Coins className="text-yellow-900" size={24} />
        </div>
        <div>
          <p className="font-pixel text-[10px] text-yellow-800 leading-none">Hero Coins</p>
          <p className="font-pixel text-xl leading-none">{progress.coins}</p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.1 }}
        className="mc-panel bg-blue-50 p-3 flex items-center gap-3 border-blue-600 min-w-[160px]"
      >
        <div className="w-10 h-10 bg-blue-400 rounded-lg border-4 border-blue-700 flex items-center justify-center">
          <TrendingUp className="text-blue-900" size={24} />
        </div>
        <div>
          <p className="font-pixel text-[10px] text-blue-800 leading-none">Player Level</p>
          <p className="font-pixel text-xl leading-none">{progress.level}</p>
        </div>
      </motion.div>

      {/* Pet Status */}
      <motion.div 
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.2 }}
        className="mc-panel bg-mc-green/10 p-4 border-mc-green flex flex-col items-center gap-2"
      >
        <p className="font-pixel text-[10px] text-mc-green uppercase font-bold">Your Pet</p>
        <div className="relative">
          <img 
            src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Dogman&backgroundColor=b6e3f4" 
            alt="Pet" 
            className="w-16 h-16 pixel-border bg-white"
          />
          <div className="absolute -bottom-2 -right-2 bg-mc-green text-white font-pixel text-xs px-2 py-0.5 border-2 border-black">
            Lv.{progress.petLevel}
          </div>
        </div>
        <div className="w-full bg-slate-200 h-2 mt-2 rounded-full overflow-hidden border-2 border-black">
           <div className="h-full bg-mc-green" style={{ width: '60%' }} />
        </div>
      </motion.div>
    </div>
  );
}
