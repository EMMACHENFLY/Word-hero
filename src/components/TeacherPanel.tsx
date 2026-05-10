import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { Plus, Trash2, Book, Layout, Sparkles, Loader2, Save } from 'lucide-react';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

interface AnalyzedWord {
  character: string;
  pinyin: string;
  meaning: string;
  components: string[];
}

interface Word extends AnalyzedWord {
  id?: string;
  difficulty?: number;
  createdAt?: string;
}

export default function TeacherPanel() {
  const [words, setWords] = useState<Word[]>([]);
  const [newWord, setNewWord] = useState<AnalyzedWord>({
    character: '',
    pinyin: '',
    meaning: '',
    components: []
  });
  const [compInput, setCompInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    const q = collection(db, 'words');
    const snapshot = await getDocs(q);
    setWords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Word)));
  };

  const handleAddWord = async () => {
    if (!newWord.character || !newWord.pinyin) return;
    try {
      await addDoc(collection(db, 'words'), {
        ...newWord,
        difficulty: 1,
        createdAt: new Date().toISOString()
      });
      setNewWord({ character: '', pinyin: '', meaning: '', components: [] });
      setCompInput('');
      fetchWords();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                character: { type: SchemaType.STRING },
                pinyin: { type: SchemaType.STRING },
                meaning: { type: SchemaType.STRING },
                components: { 
                  type: SchemaType.ARRAY, 
                  items: { type: SchemaType.STRING } 
                }
              },
              required: ["character", "pinyin", "meaning", "components"]
            }
          }
        }
      });

      const response = await model.generateContent(`Analyze the following Chinese characters for 2nd graders: "${bulkInput}". Break them down into radicals.`);
      
      const analyzed = JSON.parse(response.response.text() || "[]");
      const batch = writeBatch(db);
      
      analyzed.forEach((item: any) => {
        const newDocRef = doc(collection(db, 'words'));
        batch.set(newDocRef, {
          ...item,
          difficulty: 1,
          createdAt: new Date().toISOString()
        });
      });

      await batch.commit();
      setBulkInput('');
      fetchWords();
    } catch (e) {
      console.error("Bulk import failed:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteWord = async (id: string) => {
    if (!id) return;
    await deleteDoc(doc(db, 'words', id));
    fetchWords();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 border-b-4 border-black pb-4">
        <Layout className="text-hero-blue" size={40} />
        <h1 className="font-bangers text-5xl tracking-wide uppercase">Teacher Headquarters</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* AI Bulk Import */}
          <section className="mc-panel p-6 bg-purple-50 border-purple-600">
            <h2 className="font-pixel text-2xl mb-4 flex items-center gap-2 text-purple-900">
              <Sparkles className="fill-purple-400" size={24} /> Magic Import (AI)
            </h2>
            <div className="space-y-4">
              <p className="font-comic text-xs text-purple-700">Paste any Chinese text or a list of words. AI will handle Pinyin, Meanings, and Components!</p>
              <textarea 
                value={bulkInput}
                onChange={e => setBulkInput(e.target.value)}
                className="w-full h-32 border-4 border-purple-600 p-2 font-sans"
                placeholder="例: 你好，世界，朋友..."
              />
              <button 
                onClick={handleBulkImport}
                disabled={isAnalyzing || !bulkInput.trim()}
                className="btn-pixel w-full bg-purple-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                {isAnalyzing ? 'Powering up AI...' : 'Analyze & Add to Library'}
              </button>
            </div>
          </section>

          {/* Manual Form */}
          <section className="mc-panel p-6 space-y-6">
            <h2 className="font-pixel text-2xl mb-4 flex items-center gap-2">
              <Plus size={24} /> Add One Word
            </h2>
          
          <div className="space-y-4">
            <div>
              <label className="font-comic font-bold text-sm uppercase">Character</label>
              <input 
                value={newWord.character}
                onChange={e => setNewWord(prev => ({ ...prev, character: e.target.value }))}
                className="w-full border-4 border-black p-2 font-sans text-2xl" placeholder="例: 妈" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-comic font-bold text-sm uppercase">Pinyin</label>
                <input 
                  value={newWord.pinyin}
                  onChange={e => setNewWord(prev => ({ ...prev, pinyin: e.target.value }))}
                  className="w-full border-4 border-black p-2" placeholder="mā" 
                />
              </div>
              <div>
                <label className="font-comic font-bold text-sm uppercase">Meaning</label>
                <input 
                  value={newWord.meaning}
                  onChange={e => setNewWord(prev => ({ ...prev, meaning: e.target.value }))}
                  className="w-full border-4 border-black p-2" placeholder="Mother" 
                />
              </div>
            </div>
            <div>
              <label className="font-comic font-bold text-sm uppercase">Components (Space separated)</label>
              <input 
                value={compInput}
                onChange={e => {
                  setCompInput(e.target.value);
                  setNewWord(prev => ({ ...prev, components: e.target.value.split(' ').filter(c => c) }));
                }}
                className="w-full border-4 border-black p-2" placeholder="女 马" 
              />
            </div>
            
            <button 
              onClick={handleAddWord}
              className="btn-pixel w-full py-4 text-xl flex items-center justify-center gap-2"
            >
              <Save size={24} /> Deploy word to game
            </button>
          </div>
        </section>
      </div>

        {/* List */}
        <section className="space-y-4">
          <h2 className="font-pixel text-2xl flex items-center gap-2">
            <Book size={24} /> Current Word List ({words.length})
          </h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {words.map(word => (
              <div key={word.id} className="mc-panel bg-white p-4 flex justify-between items-center group">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold">{word.character}</span>
                    <span className="font-pixel text-slate-400">{word.pinyin}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {word.components?.map((c: string, i: number) => (
                      <span key={i} className="text-[10px] bg-slate-100 px-1 border border-black">{c}</span>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => deleteWord(word.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
