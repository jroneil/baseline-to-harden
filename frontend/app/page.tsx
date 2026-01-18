"use client";

import { useState, useEffect, useCallback } from "react";
import { callEndpoint, ApiResponse, getAdminStatus, resetLab } from "@/lib/api";
import { ShieldCheck, Zap, AlertTriangle, Timer, Activity, Info, RotateCcw, Play, Square } from "lucide-react";

export default function Home() {
    const [mode, setMode] = useState<'baseline' | 'hardened'>('baseline');
    const [scenario, setScenario] = useState<'normal' | 'slow' | 'fail' | 'fail-window'>('normal');
    const [results, setResults] = useState<ApiResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [stats, setStats] = useState<any>(null);

    const runTest = useCallback(async (endpoint: 'profile' | 'search') => {
        setLoading(true);
        const result = await callEndpoint(endpoint, mode, scenario);
        setResults(prev => [result, ...prev].slice(0, 10)); // Keep last 10
        setLoading(false);
        return result;
    }, [mode, scenario]);

    const runBoth = async () => {
        setLoading(true);
        const [res1, res2] = await Promise.all([
            callEndpoint('profile', mode, scenario),
            callEndpoint('search', mode, scenario)
        ]);
        setResults(prev => [res1, res2, ...prev].slice(0, 10));
        setLoading(false);
    };

    const handleReset = async () => {
        await resetLab();
        setResults([]);
        setScenario('normal');
        fetchStatus();
    };

    const fetchStatus = useCallback(async () => {
        try {
            const data = await getAdminStatus();
            setStats(data);
        } catch (e) {
            console.error("Failed to fetch status", e);
        }
    }, []);

    // Polling for CB status
    useEffect(() => {
        const interval = setInterval(fetchStatus, 1000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    // Continuous simulation logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isSimulating) {
            timer = setInterval(() => {
                runTest('search');
            }, 800);
        }
        return () => clearInterval(timer);
    }, [isSimulating, runTest]);

    const getExplanation = (res: ApiResponse) => {
        if (res.scenario === 'fail-window') {
            if (res.mode === 'hardened' && res.status === 503) return "Circuit breaker is open! Forced recovery to protect the system.";
            return res.message;
        }
        if (res.mode === 'baseline') {
            if (res.scenario === 'slow' && res.ok) return "The UI waited for the slow dependency to finish. Feels hung.";
            if (res.scenario === 'fail' && !res.ok) return "Direct dependency failure. The 502 error is passed to the UI.";
        } else {
            if (res.status === 504) return "Fail-fast! Timeout at 200ms prevented the UI from hanging.";
            if (res.status === 503) return "Circuit breaker is open! Immediate rejection to protect the system.";
            if (res.ok && res.latencyMs > 200) return "Hardened call completed, but exceeded timeout? (Check config)";
        }
        return "Normal expected behavior.";
    };

    return (
        <main className="max-w-6xl mx-auto p-8 font-sans">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Reliability Lab: Baseline vs Hardened
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Compare a standard API out-of-the-box against a hardened service with timeouts,
                    circuit breakers, and bulkheads.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {/* Controls */}
                <div className="md:col-span-1 space-y-6">
                    <section className="glass p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="flex items-center gap-2 text-xl font-semibold">
                                <Activity className="w-5 h-5 text-blue-400" />
                                Controls
                            </h2>
                            <button
                                onClick={handleReset}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                                title="Reset Lab State"
                            >
                                <RotateCcw className="w-4 h-4 text-gray-400 group-hover:text-white" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Resilience Mode</label>
                                <div className="flex bg-black/40 rounded-lg p-1">
                                    {(['baseline', 'hardened'] as const).map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setMode(m)}
                                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === m ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            {m.charAt(0).toUpperCase() + m.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Traffic Scenario</label>
                                <select
                                    value={scenario}
                                    onChange={(e) => setScenario(e.target.value as any)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="normal">Normal (~30ms)</option>
                                    <option value="slow">Slow (+400ms delay)</option>
                                    <option value="fail">Failing (30% error rate)</option>
                                    <option value="fail-window">Fail Window (calls 6–12 fail 100%)</option>
                                </select>
                            </div>

                            <div className="pt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => runTest('profile')}
                                        disabled={loading || isSimulating}
                                        className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => runTest('search')}
                                        disabled={loading || isSimulating}
                                        className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        Search
                                    </button>
                                </div>
                                <button
                                    onClick={runBoth}
                                    disabled={loading || isSimulating}
                                    className="w-full border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
                                >
                                    Run Both Once
                                </button>

                                <button
                                    onClick={() => setIsSimulating(!isSimulating)}
                                    className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg transition-all shadow-lg ${isSimulating
                                        ? 'bg-red-600 hover:bg-red-500 text-white'
                                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                                        }`}
                                >
                                    {isSimulating ? (
                                        <><Square className="w-4 h-4 fill-current" /> Stop Simulation</>
                                    ) : (
                                        <><Play className="w-4 h-4 fill-current" /> Start continuous traffic</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Circuit Breaker Status */}
                    <section className="glass p-6">
                        <h3 className="flex items-center gap-2 font-semibold text-white mb-4">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Circuit Breaker Status
                        </h3>
                        {stats ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-black/30 p-2 rounded border border-white/5">
                                    <span className="text-xs text-gray-500">State</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${stats.circuitBreakerState === 'OPEN' ? 'bg-red-500/20 text-red-400' :
                                        stats.circuitBreakerState === 'HALF_OPEN' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                        {stats.circuitBreakerState}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                                    <div className="bg-black/20 p-2 rounded">
                                        <div className="text-gray-600 mb-1">Failure Rate</div>
                                        <div className="text-white font-mono">{stats.failureRate >= 0 ? stats.failureRate + '%' : 'N/A'}</div>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded">
                                        <div className="text-gray-600 mb-1">Calls (F/T)</div>
                                        <div className="text-white font-mono">{stats.failedCalls} / {stats.bufferedCalls}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 py-4 text-xs italic">
                                Connecting to backend metrics...
                            </div>
                        )}
                    </section>

                    <section className="glass p-6 text-sm text-gray-400">
                        <h3 className="flex items-center gap-2 font-semibold text-white mb-3">
                            <Info className="w-4 h-4" /> Lab Configuration
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Timeout: <span className="text-gray-200">200ms</span></li>
                            <li>Bulkhead: <span className="text-gray-200">10 concurrent</span></li>
                            <li>CB Threshold: <span className="text-gray-200">50% failure</span></li>
                            <li>Window: <span className="text-gray-200">10 requests</span></li>
                        </ul>
                    </section>
                </div>

                {/* Results */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-semibold">Live Traffic Trace</h2>
                        <div className="flex items-center gap-4">
                            {isSimulating && (
                                <span className="text-[10px] text-emerald-400 font-bold animate-pulse uppercase tracking-wider">
                                    Autopilot Active
                                </span>
                            )}
                            {loading && (
                                <span className="flex items-center gap-2 text-blue-400 text-sm animate-pulse">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                    Requests in flight...
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {results.length === 0 ? (
                            <div className="glass p-12 text-center text-gray-500">
                                Click a button to start simulating traffic
                            </div>
                        ) : (
                            results.map((res, i) => (
                                <div key={i} className={`glass p-5 border-l-4 transition-all ${res.status >= 500 ? 'status-fail' : (res.latencyMs > 300 ? 'status-warning' : 'status-success')
                                    }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${res.mode === 'hardened' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {res.mode}
                                            </span>
                                            <h3 className="font-bold flex items-center gap-2">
                                                {res.endpoint === 'profile' ? <ShieldCheck className="w-4 h-4 text-blue-400" /> : <Zap className="w-4 h-4 text-yellow-400" />}
                                                /api/{res.endpoint}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="flex items-center gap-1 text-gray-400">
                                                <Timer className="w-3.5 h-3.5" /> {res.latencyMs}ms
                                            </span>
                                            <span className={`font-mono font-bold ${res.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {res.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                                        <div>
                                            <span className="text-gray-500">Scenario:</span> <span className="text-gray-300 capitalize">{res.scenario}</span>
                                            {res.failWindowIndex != null && (
                                                <span className="ml-2 text-gray-500">Call: <span className="text-blue-400 font-mono">#{res.failWindowIndex}</span></span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-gray-500 text-[10px] font-mono">CID: {res.correlationId}</span>
                                        </div>
                                    </div>

                                    <p className="text-sm bg-black/30 p-2 rounded text-gray-300 border border-white/5 italic">
                                        {getExplanation(res)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
