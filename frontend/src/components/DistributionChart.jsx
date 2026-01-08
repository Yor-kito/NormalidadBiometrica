import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';

const generateNormalDist = (mean, std, points = 100) => {
    if (!std || std === 0) return [];
    const min = mean - 4 * std;
    const max = mean + 4 * std;
    const step = (max - min) / points;

    const data = [];
    for (let x = min; x <= max; x += step) {
        const exponent = -0.5 * Math.pow((x - mean) / std, 2);
        const y = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
        data.push({ x, y });
    }
    return data;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border border-slate-200 shadow-md rounded text-sm">
                <p className="font-semibold">{`Value: ${Number(label).toFixed(2)}`}</p>
                <p className="text-slate-500">{`Density: ${Number(payload[0].value).toFixed(4)}`}</p>
            </div>
        );
    }
    return null;
};

const DistributionChart = ({ title, mean, std, patientValue, zScore }) => {
    const data = useMemo(() => generateNormalDist(mean, std), [mean, std]);

    // Color logic based on Z-score
    const isAbnormal = Math.abs(zScore) > 2;
    const markColor = isAbnormal ? '#ef4444' : '#22c55e'; // Red if > 2SD, Green if normal

    const domainMin = mean - 3.5 * std;
    const domainMax = mean + 3.5 * std;

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
            <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                        <defs>
                            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="x"
                            type="number"
                            domain={[domainMin, domainMax]}
                            tickFormatter={(val) => val.toFixed(2)}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="y"
                            stroke="#0ea5e9"
                            fillOpacity={1}
                            fill={`url(#grad-${title})`}
                        />

                        {/* Mean Line */}
                        <ReferenceLine x={mean} stroke="#94a3b8" strokeDasharray="3 3">
                            <Label value="Mean" position="top" fontSize={10} fill="#64748b" />
                        </ReferenceLine>

                        {/* Patient Value Line */}
                        {patientValue !== undefined && (
                            <ReferenceLine x={patientValue} stroke={markColor} strokeWidth={3} isFront={true}>
                                <Label
                                    value={`Test: ${patientValue}`}
                                    position="top"
                                    fill={markColor}
                                    fontWeight="bold"
                                    fontSize={11}
                                    offset={10}
                                />
                            </ReferenceLine>
                        )}

                        {/* SD Markers (Optional, for visual context) */}
                        <ReferenceLine x={mean + 2 * std} stroke="#cbd5e1" strokeDasharray="2 2" />
                        <ReferenceLine x={mean - 2 * std} stroke="#cbd5e1" strokeDasharray="2 2" />

                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-2 text-center text-sm">
                <span className="text-slate-500">Z-Score: </span>
                <span className={`font-mono font-bold ${Math.abs(zScore) > 2 ? 'text-red-500' : 'text-green-500'}`}>
                    {zScore?.toFixed(2) || '0.00'}
                </span>
            </div>
        </div>
    );
};

export default DistributionChart;
