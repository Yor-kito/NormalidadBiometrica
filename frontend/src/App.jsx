import React, { useState, useEffect } from 'react';
import { Settings, Activity, Eye, Info } from 'lucide-react';
import DistributionChart from './components/DistributionChart';

function App() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Patient Inputs
    const [inputs, setInputs] = useState({
        wtw: 11.88, // Default roughly near mean
        acd: 3.38,
        al: 25.00,
        source: 'Topo' // 'Topo' or 'Bio'
    });

    // Fetch Stats on Mount
    useEffect(() => {
        fetch('http://127.0.0.1:8000/normality-stats')
            .then(res => {
                if (!res.ok) throw new Error("Failed to connect to backend");
                return res.json();
            })
            .then(data => {
                setStats(data);
                setLoading(false);
                // Initialize inputs with means if available? Optional.
                // But preset values are fine.
            })
            .catch(err => {
                console.error(err);
                setError("Could not load database statistics. Ensure backend is running.");
                setLoading(false);
            });
    }, []);

    // Calculate Metrics Locally (Real-time)
    const calculateAnalysis = () => {
        if (!stats) return {};

        const suffix = inputs.source === 'Topo' ? '_Topo' : '_Bio';
        const wtwKey = `WTW${suffix}`;
        const acdKey = `ACD${suffix}`;
        const alKey = `AL`;

        const analyzeMetric = (value, key) => {
            if (!stats[key]) return null;
            const { mean, std } = stats[key];
            const z = (value - mean) / std;
            return { mean, std, z, value };
        };

        const ratioValue = (inputs.wtw && inputs.acd) ? (inputs.wtw / inputs.acd) : 0;
        const ratioStatKey = inputs.source === 'Topo' ? 'Ratio_Topo' : 'Ratio_Bio';

        return {
            wtw: analyzeMetric(inputs.wtw, wtwKey),
            acd: analyzeMetric(inputs.acd, acdKey),
            al: analyzeMetric(inputs.al, alKey),
            ratio: analyzeMetric(ratioValue, ratioStatKey)
        };
    };

    const results = calculateAnalysis();

    const handleSliderChange = (e) => {
        setInputs({
            ...inputs,
            [e.target.name]: parseFloat(e.target.value)
        });
    };

    const AnalysisSection = ({ label, result }) => {
        if (!result) return null;
        return (
            <div className="flex-1 min-w-[300px]">
                <DistributionChart
                    title={label}
                    mean={result.mean}
                    std={result.std}
                    patientValue={result.value}
                    zScore={result.z}
                />
            </div>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading database...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-brand-500 text-white p-2 rounded-lg">
                            <Eye size={24} />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Biometric Analysis AI</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            className="bg-slate-100 border-none rounded-md px-3 py-1 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-brand-500"
                            value={inputs.source}
                            onChange={(e) => setInputs({ ...inputs, source: e.target.value })}
                        >
                            <option value="Topo">Source: Topography (Pentacam)</option>
                            <option value="Bio">Source: Biometer</option>
                        </select>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Controls Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Settings className="text-brand-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-800">Test Eye Parameters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* WTW Input */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-semibold text-slate-500">White-to-White (WTW)</label>
                                <span className="text-2xl font-bold text-brand-600">{inputs.wtw.toFixed(2)} <span className="text-sm text-slate-400 font-normal">mm</span></span>
                            </div>
                            <input
                                type="range"
                                name="wtw"
                                min="10.0"
                                max="14.0"
                                step="0.01"
                                value={inputs.wtw}
                                onChange={handleSliderChange}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>10.0</span>
                                <span>14.0</span>
                            </div>
                        </div>

                        {/* ACD Input */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-semibold text-slate-500">Anterior Chamber (ACD)</label>
                                <span className="text-2xl font-bold text-brand-600">{inputs.acd.toFixed(2)} <span className="text-sm text-slate-400 font-normal">mm</span></span>
                            </div>
                            <input
                                type="range"
                                name="acd"
                                min="2.0"
                                max="5.0"
                                step="0.01"
                                value={inputs.acd}
                                onChange={handleSliderChange}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>2.00</span>
                                <span>5.00</span>
                            </div>
                        </div>

                        {/* AL Input */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-semibold text-slate-500">Axial Length (AL)</label>
                                <span className="text-2xl font-bold text-brand-600">{inputs.al.toFixed(2)} <span className="text-sm text-slate-400 font-normal">mm</span></span>
                            </div>
                            <input
                                type="range"
                                name="al"
                                min="18.0"
                                max="32.0"
                                step="0.01"
                                value={inputs.al}
                                onChange={handleSliderChange}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>18.00</span>
                                <span>32.00</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Results Section */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="text-brand-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-800">Normality Analysis</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <AnalysisSection label="WTW Analysis" result={results.wtw} />
                        <AnalysisSection label="ACD Analysis" result={results.acd} />
                        <AnalysisSection label="AL Analysis" result={results.al} />
                        <AnalysisSection label="WTW/ACD Ratio" result={results.ratio} />
                    </div>

                </section>

                {/* Summary Card */}
                <section className="bg-white rounded-xl p-6 border-l-4 border-brand-500 shadow-sm flex items-start gap-4">
                    <Info className="text-brand-500 shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-slate-800 mb-1">Interpretation Guide</h3>
                        <p className="text-slate-600 text-sm">
                            Values within the green bell curve are considered normal.
                            The <span className="font-bold text-brand-600">vertical line</span> represents the patient's current measurement.
                            Z-scores greater than +2.0 or less than -2.0 indicate statistically significant deviation (p &lt; 0.05).
                        </p>
                    </div>
                </section>

            </main>
        </div>
    )
}

export default App
