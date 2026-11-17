import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Activity, PhoneCall, Info, AlertTriangle, 
  CheckCircle, TrendingUp, TrendingDown, Minus, 
  Heart, Droplets, Wind, X, BellRing, WifiOff
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

type PatientStatus = 'critical' | 'warning' | 'stable' | 'disconnected';
type Trend = 'up' | 'down' | 'stable';
type VitalLimit = 'high' | 'low' | 'normal';
type Patient = {
  id: string;
  name: string;
  age: number;
  hospital: string;
  bed: string;
  status: PatientStatus;
  vitals: {
    hr: { value: number; trend: Trend; limit: VitalLimit };
    bp: { value: string; trend: Trend; limit: VitalLimit };
    spo2: { value: number; trend: Trend; limit: VitalLimit };
  };
  history: { time: string; hr: number; spo2: number }[];
  notes: string;
};

// --- MOCK DATA ---
// Represents patients monitored across multiple hospitals
const initialPatients: Patient[] = [
  {
    id: 'PT-101', name: 'Robert Chen', age: 65, hospital: 'General Hosp', bed: 'ICU-04', status: 'critical',
    vitals: {
      hr: { value: 135, trend: 'up', limit: 'high' },
      bp: { value: '85/50', trend: 'down', limit: 'low' },
      spo2: { value: 88, trend: 'down', limit: 'low' }
    },
    history: [
      { time: '02:00', hr: 105, spo2: 95 }, { time: '03:00', hr: 112, spo2: 94 }, 
      { time: '04:00', hr: 118, spo2: 91 }, { time: '05:00', hr: 125, spo2: 90 }, 
      { time: '06:00', hr: 135, spo2: 88 }
    ],
    notes: 'Septic shock, increasing vasopressor requirement.'
  },
  {
    id: 'PT-102', name: 'Sarah Jenkins', age: 72, hospital: 'Mercy Med', bed: 'CCU-12', status: 'warning',
    vitals: {
      hr: { value: 110, trend: 'up', limit: 'normal' },
      bp: { value: '145/90', trend: 'up', limit: 'high' },
      spo2: { value: 93, trend: 'down', limit: 'normal' }
    },
    history: [
      { time: '02:00', hr: 88, spo2: 96 }, { time: '03:00', hr: 92, spo2: 96 }, 
      { time: '04:00', hr: 98, spo2: 95 }, { time: '05:00', hr: 105, spo2: 94 }, 
      { time: '06:00', hr: 110, spo2: 93 }
    ],
    notes: 'Post-op CABG, mild tachycardia.'
  },
  {
    id: 'PT-103', name: 'David Smith', age: 45, hospital: 'General Hosp', bed: 'ICU-01', status: 'stable',
    vitals: {
      hr: { value: 72, trend: 'stable', limit: 'normal' },
      bp: { value: '120/80', trend: 'stable', limit: 'normal' },
      spo2: { value: 99, trend: 'stable', limit: 'normal' }
    },
    history: [
      { time: '02:00', hr: 74, spo2: 98 }, { time: '03:00', hr: 73, spo2: 99 }, 
      { time: '04:00', hr: 71, spo2: 98 }, { time: '05:00', hr: 72, spo2: 99 }, 
      { time: '06:00', hr: 72, spo2: 99 }
    ],
    notes: 'Extubated today, observing overnight.'
  },
  {
    id: 'PT-104', name: 'Maria Garcia', age: 58, hospital: 'Eastside Health', bed: 'ICU-08', status: 'critical',
    vitals: {
      hr: { value: 45, trend: 'down', limit: 'low' },
      bp: { value: '90/60', trend: 'stable', limit: 'low' },
      spo2: { value: 92, trend: 'down', limit: 'normal' }
    },
    history: [
      { time: '02:00', hr: 62, spo2: 95 }, { time: '03:00', hr: 58, spo2: 95 }, 
      { time: '04:00', hr: 52, spo2: 94 }, { time: '05:00', hr: 48, spo2: 93 }, 
      { time: '06:00', hr: 45, spo2: 92 }
    ],
    notes: 'Severe bradycardia, cardiology consulted.'
  },
  {
    id: 'PT-105', name: 'James Wilson', age: 81, hospital: 'Mercy Med', bed: 'CCU-03', status: 'stable',
    vitals: {
      hr: { value: 85, trend: 'stable', limit: 'normal' },
      bp: { value: '130/85', trend: 'stable', limit: 'normal' },
      spo2: { value: 96, trend: 'stable', limit: 'normal' }
    },
    history: [
      { time: '02:00', hr: 84, spo2: 95 }, { time: '03:00', hr: 86, spo2: 96 }, 
      { time: '04:00', hr: 85, spo2: 96 }, { time: '05:00', hr: 85, spo2: 97 }, 
      { time: '06:00', hr: 85, spo2: 96 }
    ],
    notes: 'Stable on CPAP.'
  },
  {
    id: 'PT-106', name: 'Linda Taylor', age: 62, hospital: 'Northway Clinic', bed: 'ICU-02', status: 'disconnected',
    vitals: {
      hr: { value: 98, trend: 'up', limit: 'normal' },
      bp: { value: '100/65', trend: 'down', limit: 'normal' },
      spo2: { value: 90, trend: 'down', limit: 'low' }
    },
    history: [
      { time: '02:00', hr: 85, spo2: 96 }, { time: '03:00', hr: 88, spo2: 94 }, 
      { time: '04:00', hr: 92, spo2: 92 }, { time: '05:00', hr: 95, spo2: 91 }, 
      { time: '06:00', hr: 98, spo2: 90 }
    ],
    notes: 'Connection Lost'
  },
  {
    id: 'PT-107', name: 'William Brown', age: 54, hospital: 'Eastside Health', bed: 'ICU-05', status: 'stable',
    vitals: {
      hr: { value: 68, trend: 'stable', limit: 'normal' },
      bp: { value: '118/75', trend: 'stable', limit: 'normal' },
      spo2: { value: 98, trend: 'stable', limit: 'normal' }
    },
    history: [
      { time: '02:00', hr: 66, spo2: 98 }, { time: '03:00', hr: 67, spo2: 99 }, 
      { time: '04:00', hr: 68, spo2: 98 }, { time: '05:00', hr: 69, spo2: 98 }, 
      { time: '06:00', hr: 68, spo2: 98 }
    ],
    notes: 'Awaiting transfer to step-down unit.'
  },
  {
    id: 'PT-108', name: 'Elizabeth Davis', age: 77, hospital: 'General Hosp', bed: 'ICU-10', status: 'warning',
    vitals: {
      hr: { value: 115, trend: 'up', limit: 'high' },
      bp: { value: '155/95', trend: 'up', limit: 'high' },
      spo2: { value: 94, trend: 'stable', limit: 'normal' }
    },
    history: [
      { time: '02:00', hr: 90, spo2: 95 }, { time: '03:00', hr: 95, spo2: 95 }, 
      { time: '04:00', hr: 102, spo2: 94 }, { time: '05:00', hr: 108, spo2: 93 }, 
      { time: '06:00', hr: 115, spo2: 94 }
    ],
    notes: 'Agitated, needs sedation review.'
  },
  {
    id: 'PT-109', name: 'Michael Miller', age: 39, hospital: 'Northway Clinic', bed: 'ICU-07', status: 'critical',
    vitals: {
      hr: { value: 145, trend: 'up', limit: 'high' },
      bp: { value: '75/40', trend: 'down', limit: 'low' },
      spo2: { value: 85, trend: 'down', limit: 'low' }
    },
    history: [
      { time: '02:00', hr: 110, spo2: 96 }, { time: '03:00', hr: 120, spo2: 92 }, 
      { time: '04:00', hr: 130, spo2: 89 }, { time: '05:00', hr: 138, spo2: 87 }, 
      { time: '06:00', hr: 145, spo2: 85 }
    ],
    notes: 'Massive trauma, massive transfusion protocol initiated.'
  }
];

// --- HELPER COMPONENTS ---

const TrendIcon = ({ trend }: { trend: Trend }) => {
  if (trend === 'up') return <TrendingUp size={16} className="text-slate-400" />;
  if (trend === 'down') return <TrendingDown size={16} className="text-slate-400" />;
  return <Minus size={16} className="text-slate-500" />;
};

// --- MAIN DASHBOARD COMPONENT ---

export default function TeleICUDashboard() {
  const [filter, setFilter] = useState<'all' | PatientStatus>('all');
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'call' | 'details' | null;
    patient: Patient | null;
  }>({ isOpen: false, type: null, patient: null });
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [seenPatients, setSeenPatients] = useState<Set<string>>(new Set());
  const seenTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      seenTimers.current.forEach(timer => clearTimeout(timer));
      seenTimers.current.clear();
    };
  }, []);

  // 1. Calculate stats for the Top Navigation (Reduces Alarm Fatigue by providing summary)
  const stats = useMemo(() => {
    return {
      all: initialPatients.length,
      critical: initialPatients.filter(p => p.status === 'critical').length,
      warning: initialPatients.filter(p => p.status === 'warning' || p.status === 'disconnected').length,
      stable: initialPatients.filter(p => p.status === 'stable').length,
    };
  }, []);

  // 2. Filter and Sort Patients (Crucial Need: Deteriorating patients rise to the top automatically)
  const sortedAndFilteredPatients = useMemo(() => {
    let filtered = initialPatients;
    if (filter !== 'all') {
      filtered = initialPatients.filter(p => p.status === filter || (filter === 'warning' && p.status === 'disconnected'));
    }
    
    // Sort logic: Critical (3) > Warning (2) > Stable (1)
    const statusWeight: Record<PatientStatus, number> = { critical: 3, warning: 2, disconnected: 2, stable: 1 };
    
    return filtered.sort((a, b) => {
      const aIsSeen = seenPatients.has(a.id);
      const bIsSeen = seenPatients.has(b.id);
      if (aIsSeen !== bIsSeen) {
        return aIsSeen ? 1 : -1;
      }

      // Primary sort by status weight (descending)
      if (statusWeight[a.status] !== statusWeight[b.status]) {
        return statusWeight[b.status] - statusWeight[a.status];
      }
      // Secondary sort by bed/id
      return a.id.localeCompare(b.id);
    });
  }, [filter, seenPatients]);

  // Handlers for interactions (Showing feedback as required by prototyping phase)
  const handleAction = (type: 'call' | 'details', patient: Patient) => {
    setModalState({ isOpen: true, type, patient });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, patient: null });
  };

  const markPatientAsSeen = (patientId: string) => {
    const patient = initialPatients.find(item => item.id === patientId);
    if (!patient || patient.status === 'critical' || seenPatients.has(patientId)) {
      return;
    }

    setSeenPatients(current => {
      const next = new Set(current);
      next.add(patientId);
      return next;
    });

    const existingTimer = seenTimers.current.get(patientId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      setSeenPatients(current => {
        const next = new Set(current);
        next.delete(patientId);
        return next;
      });
      seenTimers.current.delete(patientId);
    }, 60 * 60 * 1000);
    seenTimers.current.set(patientId, timer);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-cyan-900">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <header className="sticky top-0 z-10 bg-slate-800 border-b border-slate-700 shadow-md px-3 py-3 sm:px-6 sm:py-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Activity className="text-cyan-400" size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Tele-ICU Matrix</h1>
            <p className="text-xs text-slate-400 truncate">Dr. Meera Shah • Night Shift • 5 Hospitals</p>
          </div>
        </div>

        <div className="flex w-full md:w-auto max-w-full items-center gap-2">
          {/* Filter Controls / Summary Counters */}
          <div className="flex min-w-0 flex-1 md:flex-none overflow-x-auto bg-slate-900 p-1 rounded-xl border border-slate-700 shadow-inner">
            <button
              onClick={() => setFilter('all')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${filter === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              All ({stats.all})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${filter === 'critical' ? 'bg-rose-500/20 text-rose-400 shadow-sm' : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'}`}
            >
              <BellRing size={14} className={filter === 'critical' ? 'animate-pulse' : ''} />
              Critical ({stats.critical})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${filter === 'warning' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'}`}
            >
              <AlertTriangle size={14} />
              Warning ({stats.warning})
            </button>
            <button
              onClick={() => setFilter('stable')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${filter === 'stable' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'}`}
            >
              <CheckCircle size={14} />
              Stable ({stats.stable})
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            aria-label="Open help"
            title="Help"
            className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-sm font-bold text-slate-400 transition-colors hover:border-slate-500 hover:bg-slate-700 hover:text-white"
          >
            ?
          </button>
        </div>
      </header>

      {/* --- MAIN MATRIX GRID --- */}
      <main className="p-3 sm:p-6 max-w-[1600px] mx-auto">
        {sortedAndFilteredPatients.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
            <h2 className="text-xl">No patients match this filter.</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {sortedAndFilteredPatients.map((patient) => (
              <PatientTile 
                key={patient.id} 
                patient={patient} 
                isSeen={seenPatients.has(patient.id)}
                onAction={handleAction} 
                onMarkSeen={markPatientAsSeen}
              />
            ))}
          </div>
        )}
      </main>

      {/* --- ACTION MODAL (Feedback Layer) --- */}
      {modalState.isOpen && modalState.patient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto p-4 sm:p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
            >
              <X size={24} />
            </button>
            
            {modalState.type === 'call' ? (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-slate-700 border-4 border-slate-600 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <PhoneCall size={36} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Calling Bedside Team</h2>
                <p className="text-slate-400 mb-8 text-lg">
                  Connecting to {modalState.patient.hospital}, <br/><span className="text-slate-200 font-medium">Bed {modalState.patient.bed}</span> for {modalState.patient.name}...
                </p>
                <button 
                  onClick={closeModal}
                  className="w-full py-4 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-medium transition-colors"
                >
                  End Call
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-700 rounded-lg">
                    <Info className="text-slate-200" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-white">Patient Details</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Patient Info</p>
                      <p className="text-white font-medium text-lg">{modalState.patient.name}, {modalState.patient.age} yrs</p>
                      <p className="text-slate-400 text-sm mt-1">{modalState.patient.id} • {modalState.patient.hospital}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Current Status</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${modalState.patient.status === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                          modalState.patient.status === 'warning' || modalState.patient.status === 'disconnected' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                        {modalState.patient.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Detailed Vitals Graph */}
                  <div className="bg-slate-900 p-5 rounded-xl border border-slate-700/50">
                    {modalState.patient.status === 'disconnected' ? (
                      <div className="h-48 flex flex-col items-center justify-center gap-4 text-slate-500">
                        <div className="w-full border-t-2 border-dashed border-slate-600" />
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <WifiOff size={18} />
                          Signal Lost
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center mb-4">
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Vitals Trend (Last 5 Hours)</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium">
                            <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-rose-400 rounded-full"></div> Heart Rate</span>
                            <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-cyan-400 rounded-full"></div> SpO2 %</span>
                          </div>
                        </div>
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={modalState.patient.history} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                              <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                                itemStyle={{ fontWeight: 500 }}
                              />
                              <Line type="monotone" name="Heart Rate" dataKey="hr" stroke="#fb7185" strokeWidth={2.5} dot={{ r: 4, fill: '#fb7185', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                              <Line type="monotone" name="SpO2 %" dataKey="spo2" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    )}

                  </div>

                  <div className="bg-slate-900 p-5 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Clinical Notes</p>
                    <p className="text-slate-200 leading-relaxed">{modalState.patient.notes}</p>
                  </div>
                </div>
                
                <button 
                  onClick={closeModal}
                  className="w-full mt-8 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => modalState.patient && markPatientAsSeen(modalState.patient.id)}
                  disabled={seenPatients.has(modalState.patient.id) || modalState.patient.status === 'critical'}
                  className="w-full mt-3 py-3 px-4 bg-slate-900 hover:bg-slate-950 disabled:cursor-default disabled:text-slate-500 text-slate-300 border border-slate-700 rounded-xl font-medium transition-colors"
                >
                  {modalState.patient.status === 'critical' ? 'Critical Alerts Cannot Be Snoozed' :
                    seenPatients.has(modalState.patient.id) ? 'Snoozed for 60 Minutes' : 'Mark as Seen'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="relative w-full max-w-md rounded-2xl border border-slate-600 bg-slate-800 p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              aria-label="Close help"
              className="absolute right-4 top-4 p-1 text-slate-400 transition-colors hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 id="help-title" className="mb-5 text-xl font-bold text-white">Quick Reference</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <p className="text-slate-300"><span className="font-semibold text-rose-400">Red</span> = Critical</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <p className="text-slate-300"><span className="font-semibold text-amber-400">Yellow</span> = Warning</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-slate-400" />
                <p className="text-slate-300"><span className="font-semibold text-slate-200">Gray</span> = Disconnected</p>
              </div>
              <p className="border-t border-slate-700 pt-4 leading-relaxed text-slate-400">
                Read the patient graphs from left to right: rising or falling lines show how vitals are changing over time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PATIENT TILE COMPONENT ---
// Designed for "glanceability" and minimal clutter

function PatientTile({ patient, isSeen, onAction, onMarkSeen }: {
  patient: Patient;
  isSeen: boolean;
  onAction: (type: 'call' | 'details', patient: Patient) => void;
  onMarkSeen: (patientId: string) => void;
}) {
  // Determine styling based on status
  const theme = {
    critical: {
      border: 'border-rose-500/40',
      bg: 'bg-slate-800',
      headerBg: 'bg-rose-500/10',
      text: 'text-rose-400',
      icon: <BellRing size={20} className="text-rose-400 animate-pulse" />
    },
    warning: {
      border: 'border-amber-500/40',
      bg: 'bg-slate-800',
      headerBg: 'bg-amber-500/10',
      text: 'text-amber-400',
      icon: <AlertTriangle size={20} className="text-amber-400" />
    },
    stable: {
      border: 'border-slate-700',
      bg: 'bg-slate-800',
      headerBg: 'bg-slate-800',
      text: 'text-emerald-400',
      icon: <CheckCircle size={20} className="text-emerald-500/70" />
    },
    disconnected: {
      border: 'border-slate-600',
      bg: 'bg-slate-700/80',
      headerBg: 'bg-slate-700',
      text: 'text-slate-300',
      icon: <WifiOff size={20} className="text-slate-300" />
    }
  }[patient.status];

  // Helper to color vitals based on limits
  const getVitalColor = (limit: VitalLimit) => {
    if (limit === 'high' || limit === 'low') return 'text-rose-400';
    return 'text-slate-200';
  };

  const tileBorder = isSeen ? 'border-slate-600' : theme.border;
  const tileBackground = isSeen ? 'bg-slate-800/75' : theme.bg;
  const tileOpacity = isSeen ? 'opacity-75' : '';

  return (
    <div className={`rounded-xl border ${tileBorder} ${tileBackground} ${tileOpacity} overflow-hidden shadow-sm transition-all hover:shadow-md flex flex-col`}>
      {/* Tile Header */}
      <div className={`${isSeen ? 'bg-slate-800/60' : theme.headerBg} p-4 sm:p-5 flex justify-between items-start gap-3 border-b border-slate-700/50`}>
        <div>
          <h3 className="font-bold text-lg text-white leading-tight flex items-center gap-2">
            {patient.bed}
            {patient.status === 'critical' && !isSeen && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
          </h3>
          <p className="text-sm text-slate-400 truncate max-w-[180px] mt-0.5">{patient.name}, {patient.age}</p>
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/40 rounded-lg">
          {isSeen ? <CheckCircle size={20} className="text-slate-400" /> : theme.icon}
        </div>
      </div>

      {/* Vitals Body */}
      <div className="p-3 sm:p-5 grid grid-cols-3 gap-2 sm:gap-3 flex-grow">
        
        {/* Heart Rate */}
        <div className="bg-slate-900/50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center text-center border border-slate-700/30">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">
            <Heart size={14} className="text-slate-500" /> HR
          </div>
          {patient.status === 'disconnected' ? (
            <WifiOff size={22} className="text-slate-400" aria-label="No signal" />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className={`text-xl sm:text-2xl font-bold tracking-tight ${getVitalColor(patient.vitals.hr.limit)}`}>
                {patient.vitals.hr.value}
              </span>
              <TrendIcon trend={patient.vitals.hr.trend} />
            </div>
          )}
        </div>

        {/* Blood Pressure */}
        <div className="bg-slate-900/50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center text-center border border-slate-700/30">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">
            <Droplets size={14} className="text-slate-500" /> BP
          </div>
          {patient.status === 'disconnected' ? (
            <WifiOff size={22} className="text-slate-400" aria-label="No signal" />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className={`text-base sm:text-lg font-bold tracking-tight ${getVitalColor(patient.vitals.bp.limit)}`}>
                {patient.vitals.bp.value}
              </span>
              <TrendIcon trend={patient.vitals.bp.trend} />
            </div>
          )}
        </div>

        {/* SpO2 */}
        <div className="bg-slate-900/50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center text-center border border-slate-700/30">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">
            <Wind size={14} className="text-slate-500" /> SpO2
          </div>
          {patient.status === 'disconnected' ? (
            <WifiOff size={22} className="text-slate-400" aria-label="No signal" />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className={`text-xl sm:text-2xl font-bold tracking-tight flex items-baseline ${getVitalColor(patient.vitals.spo2.limit)}`}>
                {patient.vitals.spo2.value}<span className="text-sm ml-0.5 opacity-60">%</span>
              </span>
              <TrendIcon trend={patient.vitals.spo2.trend} />
            </div>
          )}
        </div>
        
      </div>

      {/* Mini Trend Sparkline */}
      <div className="px-3 sm:px-5 pb-4">
        {patient.status === 'disconnected' ? (
          <div className="h-10 flex flex-col items-center justify-center gap-2 text-xs font-medium text-slate-400">
            <div className="w-full border-t-2 border-dashed border-slate-500" />
            <span className="flex items-center gap-1.5"><WifiOff size={14} /> Signal Lost</span>
          </div>
        ) : (
          <div className="h-10 w-full opacity-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patient.history}>
                <Line type="monotone" dataKey="hr" stroke="#fb7185" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="spo2" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3 sm:p-5 pt-0 mt-auto flex flex-wrap gap-2 sm:gap-3">
        <button 
          onClick={() => onAction('details', patient)}
          className="min-w-[calc(50%-0.25rem)] flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-3 rounded-lg bg-slate-900/40 hover:bg-slate-700 border border-slate-700/50 text-slate-300 text-xs sm:text-sm font-medium transition-all"
        >
          <Info size={16} />
          Details
        </button>
        <button 
          onClick={() => onAction('call', patient)}
          className="min-w-[calc(50%-0.25rem)] flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-3 rounded-lg bg-slate-900/40 hover:bg-slate-700 border border-slate-700/50 text-slate-300 text-xs sm:text-sm font-medium transition-all"
        >
          <PhoneCall size={16} />
          Call Bed
        </button>
        <button
          type="button"
          onClick={() => onMarkSeen(patient.id)}
          disabled={isSeen || patient.status === 'critical'}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-900/40 hover:bg-slate-700 disabled:cursor-default disabled:text-slate-500 border border-slate-700/50 text-slate-300 text-xs sm:text-sm font-medium transition-all"
        >
          <CheckCircle size={16} />
          {patient.status === 'critical' ? 'Critical Alert' : isSeen ? 'Snoozed (60m)' : 'Mark as Seen'}
        </button>
      </div>
    </div>
  );
}