
import React from 'react';
import { Instagram, Youtube, Package } from 'lucide-react';
import Logo from './Logo';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#050505] text-white pt-16 pb-10 border-t border-white/5 relative overflow-hidden">
      {/* Background Decorative Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] select-none pointer-events-none w-full text-center">
        <span className="font-street text-[120px] md:text-[250px] leading-none whitespace-nowrap tracking-tighter">UNDERGROUND</span>
      </div>

      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
        
        {/* Logo & Slogan */}
        <div className="mb-12 flex flex-col items-center">
          <Logo className="mb-6 scale-125" />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed max-w-xs md:max-w-sm mt-4">
            Não seguimos tendências. Nós as roubamos, desconstruímos e devolvemos às ruas em forma de arte.
          </p>
        </div>

        {/* Social Links */}
        <div className="flex flex-col items-center gap-6 mb-16 w-full">
          <div className="flex items-center gap-4 w-full max-w-xs">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-[9px] font-black text-zinc-600 tracking-[0.6em] uppercase">Conecte-se</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
          
          <div className="flex gap-4 md:gap-6 justify-center">
            <a href="https://www.instagram.com/driveitlikestoleit" target="_blank" className="group relative flex items-center justify-center w-14 h-14 bg-white/5 border border-white/10 rounded-full hover:bg-[#e34717] hover:border-[#e34717] hover:scale-110 transition-all duration-300">
              <Instagram size={20} className="text-white group-hover:text-white transition-colors" />
            </a>
            <a href="https://www.youtube.com/@driveitlikestoleit" target="_blank" className="group relative flex items-center justify-center w-14 h-14 bg-white/5 border border-white/10 rounded-full hover:bg-[#e34717] hover:border-[#e34717] hover:scale-110 transition-all duration-300">
              <Youtube size={20} className="text-white group-hover:text-white transition-colors" />
            </a>
            <a href="https://www.tiktok.com/@driveitlikestoleit" target="_blank" className="group relative flex items-center justify-center w-14 h-14 bg-white/5 border border-white/10 rounded-full hover:bg-[#e34717] hover:border-[#e34717] hover:scale-110 transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-white group-hover:text-white transition-colors"
              >
                <path d="M16.57 1.999a.75.75 0 0 1 .75.75c0 2.49 2.019 4.512 4.52 4.512a.75.75 0 0 1 .75.75v2.003a.75.75 0 0 1-.75.75 8.03 8.03 0 0 1-4.21-1.22v7.606a6.46 6.46 0 1 1-6.46-6.459c.308 0 .56.252.56.56v2.015a.56.56 0 0 1-.56.56A3.087 3.087 0 1 0 11.77 17.46a3.098 3.098 0 0 0 2.73-3.063V2.749a.75.75 0 0 1 .75-.75h1.32ZM20.34 7.737c-2.088-.426-3.783-2.236-4.113-4.385h-1.078v11.049a4.564 4.564 0 1 1-4.56-4.563v.893a3.668 3.668 0 1 0 3.96 3.653V10.37a9.465 9.465 0 0 0 4.025 1.128v-3.76h-.234Z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Utility Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mb-10">
          <Link
            to="/rastrear"
            className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 hover:text-[#e34717] transition-colors"
          >
            <Package size={12} />
            Rastrear Pedido
          </Link>
          <Link
            to="/conta"
            className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 hover:text-[#e34717] transition-colors"
          >
            Minha Conta
          </Link>
          <Link
            to="/entrega"
            className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 hover:text-[#e34717] transition-colors"
          >
            Prazos e Envios
          </Link>
          <Link
            to="/trocas-e-devolucoes"
            className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 hover:text-[#e34717] transition-colors"
          >
            Trocas
          </Link>
          <Link
            to="/politica-de-privacidade"
            className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 hover:text-[#e34717] transition-colors"
          >
            Privacidade
          </Link>
          <Link
            to="/termos-de-uso"
            className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 hover:text-[#e34717] transition-colors"
          >
            Termos
          </Link>
        </div>

        {/* Back to top - Centered Button */}
        <button
          onClick={scrollToTop}
          className="group flex flex-col items-center gap-3 mb-16"
        >
          <div className="w-px h-12 bg-white/20 group-hover:h-16 group-hover:bg-[#e34717] transition-all duration-300"></div>
          <span className="text-[10px] font-black tracking-[0.4em] uppercase text-zinc-400 group-hover:text-white transition-colors">Voltar ao Topo</span>
        </button>

        {/* Final Copyright Tag */}
        <div className="w-full pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 text-[9px] font-black tracking-[0.3em] uppercase">
          <span className="text-zinc-500">REAL UNDERGROUND © {new Date().getFullYear()}</span>
          <div className="flex items-center gap-3">
            <span className="text-zinc-500">Feito no asfalto</span>
            <span className="w-1 h-1 rounded-full bg-[#e34717]"></span>
            <span className="text-[#e34717]">Puro Vandalismo</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
