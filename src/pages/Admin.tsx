import React, { useEffect, useState } from 'react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { useAuth } from '../components/FirebaseProvider';
import { UserPlus, ShieldPlus, Trash2, ShieldCheck, Mail, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AdminPage: React.FC = () => {
  const { isHeadAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'teacher' | 'admin'>('teacher');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !isHeadAdmin) return;

    // Check admin limit
    if (newRole === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount >= 3) {
        alert("Limit reached: Only 3 Head Admin accounts allowed.");
        return;
      }
    }

    try {
      // For simplified demo, UID = email (normally we'd map after sign-in)
      // but Firestore rules check role by UID. 
      // In a real app, users would sign in and admins would "authorize" their UIDs.
      // Here, we'll store mapping in a doc named after the EMAIL for lookup if needed,
      // but rules expect UID. Let's use a mapping collection or handle it differently.
      
      // Instruction: Admin enters email. When that user signs in, their UID is checked against this list.
      // We'll store by MD5 or just a predictable ID if we don't have UID yet.
      // Actually, let's use EMAIL as the document ID for 'pending_users' and 'users'.
      // But rules use request.auth.uid.
      
      // Better: Admin adds teacher email. Teacher signs in -> client checks if they are in 'authorized_emails'.
      // If yes, client creates 'users' doc for them with their UID.
      // Let's stick to 'users' collection with manual UID entry or a mapping.
      
      // Simplest: ID = email. Rules: get(/.../users/$(request.auth.token.email)).data
      // Wait, firestore rules can't use request.auth.token.email easily as a path key.
      
      await setDoc(doc(db, 'authorized_users', newEmail.toLowerCase()), {
        email: newEmail.toLowerCase(),
        role: newRole
      });
      setNewEmail('');
      alert(`User ${newEmail} authorized as ${newRole}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'authorized_users');
    }
  };

  const removeUser = async (email: string) => {
    if (email === 'pixstudios.lk@gmail.com') return; // Cannot remove root
    try {
      await deleteDoc(doc(db, 'authorized_users', email));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `authorized_users/${email}`);
    }
  };

  if (!isHeadAdmin) return <div className="p-8 text-center">Unauthorized. Head Admins only.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="bento-card p-10 bg-indigo-600 border-none shadow-none text-white flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
           <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border-2 border-white/30">
              <ShieldCheck className="w-10 h-10 text-white" />
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter">System Authority</h1>
           <p className="text-indigo-100 text-xs uppercase tracking-widest font-black mt-2">Elevated Control & Personnel Authorization</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6 w-full md:w-auto">
           <div className="bg-indigo-700/50 p-6 rounded-3xl border-2 border-indigo-400/30 text-center">
              <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Admin Density</p>
              <p className="text-3xl font-black mt-1">{users.filter(u => u.role === 'admin').length}<span className="text-indigo-300">/3</span></p>
           </div>
           <div className="bg-indigo-700/50 p-6 rounded-3xl border-2 border-indigo-400/30 text-center">
              <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Status</p>
              <p className="text-3xl font-black mt-1">LOCKED</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Authorization Form */}
        <section className="bento-card p-10 bg-white">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100">
              <UserPlus className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Grant Authority</h2>
              <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Enroll New Staff Email</p>
            </div>
          </div>

          <form onSubmit={handleAddUser} className="space-y-8">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
               <div className="relative">
                 <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input
                   type="email"
                   placeholder="official.staff@school.edu"
                   className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 pl-14 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                   value={newEmail}
                   onChange={(e) => setNewEmail(e.target.value)}
                   required
                 />
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Permission Tier</label>
               <div className="grid grid-cols-2 gap-4">
                 <button
                   type="button"
                   onClick={() => setNewRole('teacher')}
                   className={`p-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                     newRole === 'teacher' ? 'bg-indigo-600 border-indigo-800 text-white shadow-[4px_4px_0px_0px_#1e1b4b]' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
                   }`}
                 >
                   Teacher Unit
                 </button>
                 <button
                   type="button"
                   onClick={() => setNewRole('admin')}
                   className={`p-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                     newRole === 'admin' ? 'bg-indigo-600 border-indigo-800 text-white shadow-[4px_4px_0px_0px_#1e1b4b]' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
                   }`}
                 >
                   Head Admin
                 </button>
               </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-bento-primary w-full py-6 text-sm bg-indigo-600 hover:bg-indigo-700 shadow-[6px_6px_0px_0px_#1e1b4b]"
            >
              {loading ? 'Initializing...' : 'Confirm Authorization'}
            </button>
          </form>
        </section>

        {/* Existing Users List */}
        <section className="bento-card p-10 bg-slate-50 border-slate-200">
           <div className="flex items-center gap-4 mb-10">
            <div className="bg-slate-200 p-4 rounded-2xl border-2 border-slate-300">
              <UserCog className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Current Authority list</h2>
              <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Active Staff Access</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-auto pr-2 custom-scrollbar">
            {users.map((user) => (
              <div key={user.id} className="bg-white p-6 rounded-2xl border-2 border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl border-2 ${user.role === 'admin' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                    {user.role === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <ShieldPlus className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{user.email}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{user.role}</p>
                  </div>
                </div>
                
                {user.email !== 'pixstudios.lk@gmail.com' && (
                  <button
                    onClick={() => removeUser(user.id)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPage;
