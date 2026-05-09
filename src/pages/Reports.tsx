import React, { useEffect, useState } from 'react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { useAuth } from '../components/FirebaseProvider';
import { format } from 'date-fns';
import { getCategoryColor } from '../lib/utils';
import { History, AlertTriangle, FileText, Calendar, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ReportsPage: React.FC = () => {
  const { isHeadAdmin, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'discipline'>('attendance');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [disciplineReports, setDisciplineReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attendance Logs
    const qAtt = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'), limit(100));
    const unsubAtt = onSnapshot(qAtt, (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance'));

    // Discipline Reports (Admins only)
    let unsubDisc = () => {};
    if (isHeadAdmin) {
      const qDisc = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(100));
      unsubDisc = onSnapshot(qDisc, (snapshot) => {
        setDisciplineReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reports');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      unsubAtt();
      unsubDisc();
    };
  }, [isHeadAdmin]);

  const getAttendanceRow = (log: any) => (
    <tr key={log.id} className="border-b-2 border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="py-5 px-6 font-black text-slate-900 text-base">{log.prefectId}</td>
      <td className="py-5 px-6">
        <span className="status-badge bg-white shadow-[2px_2px_0px_0px_#0F172A]">
          {log.category}
        </span>
      </td>
      <td className="py-5 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
        {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PPP p') : 'Processing...'}
      </td>
      <td className="py-5 px-6 font-mono text-xs font-bold text-slate-500">AUTH_{log.teacherId.slice(0, 10)}</td>
    </tr>
  );

  const getDisciplineCard = (report: any) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={report.id}
      className="bento-card p-6 flex flex-col bg-amber-50 border-amber-900 shadow-[4px_4px_0px_0px_#78350f]"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="status-badge bg-amber-900 text-white border-amber-950 mb-2 inline-block">
            {report.type}
          </span>
          <h4 className="text-2xl font-black text-amber-950 tracking-tighter">{report.prefectId}</h4>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-amber-900/40 font-black uppercase tracking-widest">Logged At</p>
          <p className="text-xs font-black text-amber-900 uppercase">
            {report.timestamp?.toDate ? format(report.timestamp.toDate(), 'HH:mm:ss') : '--'}
          </p>
        </div>
      </div>
      
      <p className="text-sm font-bold text-amber-950 leading-relaxed bg-white/50 p-5 rounded-2xl border-2 border-amber-900/10 italic flex-1">
        "{report.details}"
      </p>
      
      <div className="pt-4 flex items-center gap-3 text-[9px] font-black text-amber-900/40 uppercase tracking-tighter">
        <AlertTriangle className="w-3 h-3" />
        STAFF UNIT: {report.teacherId.slice(0, 12)}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-10">
      <div className="bento-card p-8 bg-slate-900 border-none shadow-none text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Global Audit logs</h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mt-1">Real-time Data Stream from School Database</p>
        </div>

        <div className="flex bg-slate-800 p-2 rounded-2xl border-2 border-slate-700 shadow-inner">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            Attendance
          </button>
          {isHeadAdmin && (
            <button
              onClick={() => setActiveTab('discipline')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'discipline' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Incident Reports
            </button>
          )}
        </div>
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'attendance' ? (
          <div className="bento-card shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-bento-border">
                  <tr>
                    <th className="py-6 px-6">Identified Prefect</th>
                    <th className="py-6 px-6">Period Block</th>
                    <th className="py-6 px-6">Precision Timestamp</th>
                    <th className="py-6 px-6">Auth Authority</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(log => getAttendanceRow(log))}
                </tbody>
              </table>
            </div>
            {attendance.length === 0 && (
              <div className="p-32 text-center text-slate-300 flex flex-col items-center gap-4">
                 <Calendar className="w-16 h-16 opacity-10" />
                 <p className="text-xl font-black uppercase tracking-tighter">Zero Logs Detected</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {disciplineReports.map(report => getDisciplineCard(report))}
            {disciplineReports.length === 0 && (
              <div className="col-span-full p-32 text-center text-amber-900/20 flex flex-col items-center gap-4 bento-card bg-amber-50 border-dashed border-amber-900/20 shadow-none">
                 <FileText className="w-16 h-16 opacity-20" />
                 <p className="text-2xl font-black uppercase tracking-tighter">No Incident Flags</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
