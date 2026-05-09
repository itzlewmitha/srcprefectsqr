import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please ensure your browser allows pop-ups.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decals */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bento-card p-12 bg-[#1E293B] border-slate-700 shadow-[12px_12px_0px_0px_#0F172A] text-center">
          <div className="bg-blue-500 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-10 border-4 border-white shadow-[4px_4px_0px_0px_#0F172A]">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-5xl font-black text-white tracking-tighter mb-2 font-display">PrefectGate</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-12 italic">Advanced Security Terminal</p>

          <div className="space-y-6">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-4 py-6 px-8 bg-white text-slate-900 font-black rounded-3xl border-4 border-slate-100 hover:bg-blue-50 transition-all active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_#0F172A] relative group"
            >
              <img src="https://www.google.com/favicon.ico" className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
              <span className="text-lg">Staff Auth Portal</span>
            </button>

            {import.meta.env.VITE_PREFECT_FORM_URL && (
              <a
                href={import.meta.env.VITE_PREFECT_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-4 py-4 px-8 bg-slate-800 text-slate-300 font-bold rounded-[24px] border-2 border-slate-700 hover:bg-slate-700 hover:text-white transition-all active:scale-[0.98]"
              >
                New Prefect Registration
              </a>
            )}

            <div className="pt-8 flex flex-col items-center gap-4">
               <div className="h-[2px] w-12 bg-slate-700 rounded-full"></div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-[200px] leading-relaxed">
                 Access restricted to authorized secondary school personnel only.
               </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-10">
           <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
              <p className="text-xs font-black text-emerald-500 uppercase">Operational</p>
           </div>
           <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Encrypted</p>
              <p className="text-xs font-black text-blue-400 uppercase">AES-256</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
