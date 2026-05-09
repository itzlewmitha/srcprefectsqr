import React, { useEffect, useState } from 'react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../components/FirebaseProvider';
import { Search, UserMinus, UserCheck, Trash2, ShieldAlert, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Prefects: React.FC = () => {
  const { isHeadAdmin } = useAuth();
  const [prefects, setPrefects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'prefects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPrefects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'prefects');
    });

    return () => unsubscribe();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    if (!isHeadAdmin) return;
    try {
      await updateDoc(doc(db, 'prefects', id), {
        status: currentStatus === 'active' ? 'suspended' : 'active'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prefects/${id}`);
    }
  };

  const removePrefect = async (id: string) => {
    if (!isHeadAdmin) return;
    if (!window.confirm('PERMANENTLY delete this prefect? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'prefects', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `prefects/${id}`);
    }
  };

  const filteredPrefects = prefects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="bento-card p-8 bg-blue-600 border-none shadow-none text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Prefect Registry</h1>
          <p className="text-blue-100 text-[10px] uppercase tracking-widest font-bold mt-1">Personnel Management & Status Control</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
          <input
            type="text"
            placeholder="Search identity or ID..."
            className="w-full pl-12 pr-4 py-4 bg-blue-700/50 border-2 border-blue-400/30 rounded-2xl shadow-inner focus:ring-4 focus:ring-white/20 outline-none font-bold text-white placeholder-blue-300 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20 bento-card">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-bento-border rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredPrefects.map((prefect) => (
              <motion.div
                key={prefect.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bento-card p-8 transition-all ${
                  prefect.status === 'suspended' ? 'bg-red-50 border-red-900 shadow-[4px_4px_0px_0px_#7f1d1d]' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className={`p-4 rounded-2xl border-2 ${prefect.status === 'suspended' ? 'bg-red-100 border-red-900' : 'bg-slate-50 border-slate-200'}`}>
                    <GraduationCap className={`w-8 h-8 ${prefect.status === 'suspended' ? 'text-red-900' : 'text-blue-600'}`} />
                  </div>
                  <span className={`status-badge ${
                    prefect.status === 'active' ? 'bg-emerald-100 border-emerald-900 text-emerald-900' : 'bg-red-900 border-red-950 text-white'
                  }`}>
                    {prefect.status}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">{prefect.name}</h3>
                <div className="flex items-center gap-2 mb-8">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{prefect.id}</p>
                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade {prefect.grade}</p>
                </div>

                {isHeadAdmin && (
                  <div className="pt-6 border-t-2 border-slate-50 flex gap-3">
                    <button
                      onClick={() => toggleStatus(prefect.id, prefect.status)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                        prefect.status === 'active' 
                          ? 'bg-red-50 border-red-900 text-red-900 hover:bg-red-100 shadow-[2px_2px_0px_0px_#7f1d1d]' 
                          : 'bg-emerald-50 border-emerald-900 text-emerald-900 hover:bg-emerald-100 shadow-[2px_2px_0px_0px_#064e3b]'
                      }`}
                    >
                      {prefect.status === 'active' ? (
                        <><UserMinus className="w-4 h-4" /> Suspend Account</>
                      ) : (
                        <><UserCheck className="w-4 h-4" /> Restore Access</>
                      )}
                    </button>
                    <button
                      onClick={() => removePrefect(prefect.id)}
                      className="p-3 bg-white border-2 border-slate-100 text-slate-300 hover:text-red-600 hover:border-red-600 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && filteredPrefects.length === 0 && (
        <div className="bento-card p-20 text-center">
          <ShieldAlert className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Zero Records Found</h3>
          <p className="text-slate-400 mt-2 font-medium">Verify your search term or expand your query.</p>
        </div>
      )}
    </div>
  );
};

export default Prefects;
