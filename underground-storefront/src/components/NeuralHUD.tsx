
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Terminal, X, Zap, Activity, Ghost } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface NeuralHUDProps {
  onVibeChange: (vibe: any) => void;
}

const NeuralHUD: React.FC<NeuralHUDProps> = ({ onVibeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(["NEURAL LINK ACTIVE...", "WAITING FOR ARCHIVE COMMAND..."]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const processVibe = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setHistory(prev => [...prev, `> ANALYZING: ${prompt.toUpperCase()}`]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise este conceito de streetwear: "${prompt}". 
                   Retorne um JSON estrito com as seguintes propriedades:
                   - accentColor: uma cor hexadecimal vibrante (ex: #FF0000).
                   - vibeName: um nome curto e forte (max 2 palavras).
                   - glitchLevel: um numero de 0 a 10.
                   - recommendation: uma pequena frase técnica sobre o estilo.
                   - theme: um dos seguintes: 'neon', 'industrial', 'vintage', 'toxic'.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              accentColor: { type: Type.STRING },
              vibeName: { type: Type.STRING },
              glitchLevel: { type: Type.NUMBER },
              recommendation: { type: Type.STRING },
              theme: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text;
      if (text == null || text === "") {
        throw new Error("Empty model response");
      }
      const result = JSON.parse(text);
      onVibeChange(result);
      setHistory(prev => [...prev, `> ARCHIVE SHIFT: ${result.vibeName}`, `> ACCENT_UPDATE: ${result.accentColor}`]);
      setPrompt('');
      setTimeout(() => setIsOpen(false), 1500);
    } catch (error) {
      setHistory(prev => [...prev, "> ERROR: NEURAL CONNECTION INTERRUPTED"]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 left-10 z-[110] bg-black border border-white/20 p-4 hover:border-[#e34717] group transition-all"
      >
        <div className="flex items-center gap-3">
          <Cpu size={20} className="text-[#e34717] group-hover:animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] hidden md:block">Neural Link</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-2xl bg-zinc-950 border border-white/10 p-1 relative overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>

              <div className="border border-white/5 p-8 relative z-10 bg-zinc-950">
                <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-4">
                    <Terminal size={24} className="text-[#e34717]" />
                    <div>
                      <h2 className="text-xl font-black italic uppercase tracking-tighter">Vibe Command HUD</h2>
                      <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">User_Interface_v3.1 // AI_Assisted_Style</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="text-zinc-700 hover:text-white"><X size={20} /></button>
                </div>

                <div className="bg-black/50 p-6 mb-8 font-mono text-[10px] space-y-2 h-40 overflow-y-auto border border-white/5 scrollbar-hide">
                  {history.map((line, i) => (
                    <div key={i} className={line.startsWith('>') ? 'text-[#e34717]' : 'text-zinc-500'}>{line}</div>
                  ))}
                  {isLoading && <div className="animate-pulse text-white">RECONFIGURING ARCHIVE PARAMETERS...</div>}
                </div>

                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && processVibe()}
                    placeholder="DESCRIBE THE VIBE (EX: TECHWEAR TOKYO NIGHT)..."
                    className="w-full bg-transparent border-b-2 border-white/10 py-4 font-mono text-sm focus:outline-none focus:border-[#e34717] transition-all uppercase placeholder:text-zinc-800"
                    disabled={isLoading}
                  />
                  <button
                    onClick={processVibe}
                    disabled={isLoading}
                    className="absolute right-0 bottom-4 text-[#e34717] hover:text-white transition-colors"
                  >
                    <Zap size={20} />
                  </button>
                </div>

                <div className="mt-12 grid grid-cols-3 gap-4 opacity-30">
                  {[Activity, Ghost, Cpu].map((Icon, i) => (
                    <div key={i} className="flex items-center gap-3 border border-white/10 p-3">
                      <Icon size={14} />
                      <span className="text-[7px] font-black tracking-widest uppercase">Channel_0{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NeuralHUD;
