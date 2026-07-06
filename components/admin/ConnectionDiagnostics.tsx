
import React, { useState, useEffect } from 'react';
import { db, auth, app } from '../../services/firebase';
import { getDocFromServer, doc, collection, getDocs, limit, query } from 'firebase/firestore';
import { Card, CardContent } from '../ui/Card';
import DatabaseIcon from '../icons/DatabaseIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import Spinner from '../ui/Spinner';
import firebaseConfig from '../../firebase-applet-config.json';
import { safeJSONStringify } from '../../services/utils';

const ConnectionDiagnostics: React.FC = () => {
    const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
    const [report, setReport] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);
    
    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const runDiagnostics = async () => {
        setStatus('testing');
        setLogs([]);
        addLog("Starting Connection Diagnostics...");
        
        const diagnosticReport: any = {
            timestamp: new Date().toISOString(),
            config: {
                projectId: firebaseConfig.projectId,
                authDomain: firebaseConfig.authDomain,
            },
            auth: {
                isSignedIn: !!auth.currentUser,
                uid: auth.currentUser?.uid,
                email: auth.currentUser?.email
            }
        };

        try {
            addLog(`Attempting to read singleton document 'sponsors/main'...`);
            const sponsorsRef = doc(db, 'sponsors', 'main');
            const snap = await getDocFromServer(sponsorsRef);
            
            diagnosticReport.firestore = {
                connected: true,
                snapshotExists: snap.exists(),
                snapshotDataSize: snap.exists() ? safeJSONStringify(snap.data()).length : 0
            };
            
            addLog("Reading 'competitions' collection (limit 1)...");
            const compQuery = query(collection(db, 'competitions'), limit(1));
            const compSnap = await getDocs(compQuery);
            diagnosticReport.competitions = {
                count: compSnap.size,
                empty: compSnap.empty
            };
            
            setStatus('success');
            addLog("Diagnostics Complete: SUCCESS");
        } catch (err: any) {
            addLog(`Error: ${err.message || String(err)}`);
            diagnosticReport.error = {
                message: err.message,
                code: err.code,
                name: err.name
            };
            setStatus('error');
        }
        
        setReport(diagnosticReport);
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="border-2 border-slate-200 shadow-xl overflow-hidden">
                <div className={`p-4 flex items-center justify-between ${status === 'success' ? 'bg-green-600' : status === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
                    <div className="flex items-center gap-3 text-white">
                        <DatabaseIcon className="w-6 h-6" />
                        <h3 className="font-display font-bold text-lg">Real-time Connectivity Report</h3>
                    </div>
                    <button 
                        onClick={runDiagnostics}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        Retest
                    </button>
                </div>
                
                <CardContent className="p-0">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-4">Diagnostic Logs</h4>
                            <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-green-400 h-64 overflow-y-auto space-y-1 shadow-inner border border-slate-700">
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="opacity-50 shrink-0">{i+1}</span>
                                        <span className="break-all">{log}</span>
                                    </div>
                                ))}
                                {status === 'testing' && <div className="animate-pulse">_</div>}
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3">System Identity</h4>
                                <div className="space-y-2">
                                    <DetailRow label="Project ID" value={firebaseConfig.projectId} />
                                    <DetailRow label="Auth State" value={auth.currentUser ? `Authenticated (${auth.currentUser.email})` : 'Anonymous'} />
                                    <DetailRow label="Persistence" value="Memory/Local Hybrid" />
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3">Database Statistics</h4>
                                {status === 'testing' ? (
                                    <div className="flex items-center gap-2 text-slate-500 animate-pulse">
                                        <Spinner className="w-4 h-4" />
                                        <span className="text-sm">Calculating collection sizes...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <DetailRow 
                                            label="Metadata Sync" 
                                            value={report?.firestore?.snapshotExists ? "SYNCED" : "NOT FOUND / EMPTY"} 
                                            success={report?.firestore?.snapshotExists}
                                        />
                                        <DetailRow 
                                            label="Competitions" 
                                            value={report?.competitions?.count > 0 ? `${report.competitions.count} Active` : "None Found"} 
                                            success={report?.competitions?.count > 0}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {status === 'error' && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                                    <AlertTriangleIcon className="w-5 h-5 text-red-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-red-800">Connection Failed</p>
                                        <p className="text-xs text-red-700 mt-1">{report?.error?.message || "Check network/config"}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const DetailRow: React.FC<{ label: string, value: string, success?: boolean }> = ({ label, value, success }) => (
    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0">
        <span className="text-slate-500">{label}</span>
        <span className={`font-bold ${success === true ? 'text-green-600' : success === false ? 'text-red-500' : 'text-slate-700'}`}>
            {value}
        </span>
    </div>
);

export default ConnectionDiagnostics;
