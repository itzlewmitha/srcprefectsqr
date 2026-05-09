import React, { useState } from 'react';
import Scanner from '../components/Scanner';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { getAttendanceCategory, getCategoryColor, AttendanceCategory } from '../lib/utils';
import { format } from 'date-fns';
import { useAuth } from '../components/FirebaseProvider';
import { CheckCircle2, XCircle, Loader2, AlertCircle, MessageSquare, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Dashboard: React.FC = () => {
  const { role, user } = useAuth();
  const [isSpecialMode, setIsSpecialMode] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'error' | 'pending';
    message: string;
    prefect?: any;
    category?: AttendanceCategory;
  } | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportDetails, setReportDetails] = useState('');
  const [reportType, setReportType] = useState<'Late' | 'Absent' | 'Misconduct' | 'Duty failure'>('Late');

  const handleScan = async (prefectId: string) => {
    if (scanResult?.status === 'pending' || isReporting) return;

    setScanResult({ status: 'pending', message: 'Verifying prefect...' });

    try {
      const prefectDoc = await getDoc(doc(db, 'prefects', prefectId));
      if (!prefectDoc.exists()) {
        setScanResult({ status: 'error', message: 'Prefect not found in database.' });
        return;
      }

      const prefectData = prefectDoc.data();
      if (prefectData.status === 'suspended') {
        setScanResult({ status: 'error', message: 'This prefect is currently SUSPENDED.' });
        return;
      }

      const now = new Date();
      const category = isSpecialMode ? 'Special' : getAttendanceCategory(now);
      const dateStr = format(now, 'yyyy-MM-dd');
      const attendanceId = `${prefectId}_${category}_${dateStr}`;

      // Check if already scanned
      const existingScan = await getDoc(doc(db, 'attendance', attendanceId));
      if (existingScan.exists()) {
        setScanResult({ 
          status: 'error', 
          message: `Already marked for ${category} today.`,
          prefect: prefectData 
        });
        return;
      }

      // Log attendance
      await setDoc(doc(db, 'attendance', attendanceId), {
        prefectId,
        timestamp: serverTimestamp(),
        category,
        teacherId: user?.uid,
        date: dateStr
      });

      setScanResult({
        status: 'success',
        message: 'Attendance marked successfully!',
        prefect: prefectData,
        category
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'attendance');
      setScanResult({ status: 'error', message: 'System error. Try again.' });
    }
  };

  const handleReport = async () => {
    if (!scanResult?.prefect?.id || !user) return;

    try {
      await addDoc(collection(db, 'reports'), {
        prefectId: scanResult.prefect.id,
        teacherId: user.uid,
        timestamp: serverTimestamp(),
        type: reportType,
        details: reportDetails
      });
      setIsReporting(false);
      setReportDetails('');
      setScanResult({
        status: 'success',
        message: 'Report filed successfully!',
        prefect: scanResult.prefect
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    }
  };

  if (!role && user?.email !== 'pixstudios.lk@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500 max-w-sm">
          Your account is not yet authorized as a Teacher or Admin. Please contact the Head Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header Container */}
      <div className="bento-card bg-slate-800 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-none shadow-none text-white">
        <div className="flex items-center gap-5">
           <div className="bg-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl shadow-[4px_4px_0px_0px_#0F172A] border-2 border-bento-border text-white">
             P
           </div>
           <div>
             <h1 className="text-3xl font-black tracking-tighter text-white">PrefectGate Pro</h1>
             <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Duty Scanning Terminal</p>
           </div>
        </div>
        
        <div className="flex bg-slate-900 p-2 rounded-2xl border-2 border-slate-700 shadow-inner">
          <button
            onClick={() => setIsSpecialMode(false)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isSpecialMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Routine
          </button>
          <button
            onClick={() => setIsSpecialMode(true)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isSpecialMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
             Special
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Scanner Column */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bento-card p-6">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-tighter mb-4">Scanner Input</h2>
            <div className="bg-slate-900 rounded-3xl overflow-hidden border-2 border-bento-border p-2">
              <Scanner onScan={handleScan} isPaused={!!scanResult && scanResult.status !== 'pending'} />
            </div>
            
            <div className="mt-6 flex flex-col gap-3">
              {scanResult && !isReporting && (
                <button
                  onClick={() => setScanResult(null)}
                  className="btn-bento-primary w-full bg-slate-900"
                >
                  Clear Terminal
                </button>
              )}
              <div className="p-3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                 <p className="text-[10px] font-bold text-slate-400 uppercase text-center">Camera: Ready</p>
              </div>
            </div>
          </div>
        </section>

        {/* Result Column */}
        <section className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!scanResult ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bento-card p-12 flex flex-col items-center justify-center text-center min-h-[450px]"
              >
                <div className="w-24 h-24 bg-slate-50 border-2 border-slate-100 rounded-[32px] flex items-center justify-center mb-6">
                  <Scan className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Awaiting Credentials</h3>
                <p className="text-slate-500 mt-3 max-w-sm font-medium">Place the prefect's ID card under the camera to verify duty attendance.</p>
              </motion.div>
            ) : scanResult.status === 'pending' ? (
              <motion.div
                key="pending"
                className="bento-card p-12 flex flex-col items-center justify-center text-center min-h-[450px]"
              >
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">System Verification...</h3>
                <p className="text-slate-400 mt-2 font-mono text-xs uppercase tracking-widest">Querying Firestore</p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[450px]"
              >
                <div className={`bento-card p-8 flex flex-col ${scanResult.status === 'success' ? 'bg-emerald-50 border-emerald-900 shadow-[4px_4px_0px_0px_#064e3b]' : 'bg-red-50 border-red-900 shadow-[4px_4px_0px_0px_#7f1d1d]'}`}>
                  <div className="flex items-center gap-4 mb-8">
                     {scanResult.status === 'success' ? (
                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                     ) : (
                        <XCircle className="w-12 h-12 text-red-600" />
                     )}
                     <div>
                        <h3 className={`text-4xl font-black tracking-tighter uppercase ${scanResult.status === 'success' ? 'text-emerald-950' : 'text-red-950'}`}>
                          {scanResult.status === 'success' ? 'Verified' : 'Access Denied'}
                        </h3>
                     </div>
                  </div>

                  <p className={`text-lg font-bold mb-8 ${scanResult.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {scanResult.message}
                  </p>

                  <div className="mt-auto pt-6 border-t border-black/10 flex flex-col gap-3">
                    {!isReporting && (
                      <button
                        onClick={() => setIsReporting(true)}
                        className="btn-bento-secondary border-black shadow-[2px_2px_0px_0px_#000]"
                      >
                        File Incident Report
                      </button>
                    )}
                  </div>
                </div>

                {scanResult.prefect && (
                   <div className="bento-card p-8 bg-white">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Prefect Profile</h4>
                      
                      <div className="space-y-8">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Identity</p>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter">{scanResult.prefect.name}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prefect ID</p>
                              <p className="font-mono font-bold text-lg text-slate-900">{scanResult.prefect.id}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Grade</p>
                              <p className="font-bold text-lg text-slate-900">{scanResult.prefect.grade}</p>
                           </div>
                        </div>

                        {scanResult.category && (
                          <div className="p-4 bg-slate-50 border-2 border-bento-border rounded-2xl flex items-center justify-between">
                             <p className="text-xs font-black uppercase tracking-tighter">Session Category</p>
                             <span className="status-badge bg-white shadow-[2px_2px_0px_0px_#0F172A]">
                               {scanResult.category}
                             </span>
                          </div>
                        )}
                      </div>
                   </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reporting Section - Bento Style Overlay */}
          <AnimatePresence>
            {isReporting && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="bento-card mt-8 p-10 bg-amber-50 border-amber-900 shadow-[8px_8px_0px_0px_#78350f]"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-amber-900 p-3 rounded-xl border-2 border-amber-950">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-amber-950 tracking-tighter">Incident Logging</h3>
                    <p className="text-amber-700 text-sm font-bold">Documenting duty failure or misconduct.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-900/50 uppercase tracking-widest block ml-1">Incident Type</label>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value as any)}
                        className="w-full bg-white border-2 border-amber-900 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-amber-500/20"
                      >
                        <option value="Late">Late Arrival</option>
                        <option value="Absent">Unexplained Absence</option>
                        <option value="Misconduct">Misconduct / Behavior</option>
                        <option value="Duty failure">Duty Failure</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-900/50 uppercase tracking-widest block ml-1">Case Details</label>
                    <textarea
                      placeholder="Detailed statement of the issue..."
                      className="w-full bg-white border-2 border-amber-900 rounded-2xl p-6 min-h-[150px] font-bold outline-none focus:ring-4 focus:ring-amber-500/20"
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleReport}
                      disabled={!reportDetails}
                      className="btn-bento-primary flex-1 bg-amber-900 hover:bg-amber-950 border-amber-950"
                    >
                      Authenticate & Submit
                    </button>
                    <button
                      onClick={() => setIsReporting(false)}
                      className="btn-bento-secondary flex-1 border-amber-900"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
