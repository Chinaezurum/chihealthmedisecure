
import React, { useState } from 'react';
import { Patient } from '../../types.ts';
import { HeartPulseIcon, StepIcon, MoonIcon, RefreshCwIcon, HeartIcon, ActivityIcon, BedIcon, ClockIcon } from '../../components/icons/index.tsx';
import { Button } from '../../components/common/Button.tsx';
import { ConfirmationModal } from '../../components/common/ConfirmationModal.tsx';
import { ConnectWearableModal } from './ConnectWearableModal.tsx';
import { HealthChart } from '../../components/common/HealthChart.tsx';
import * as api from '../../services/apiService.ts';

interface WearablesViewProps {
    patient: Patient;
    onSimulateData: () => Promise<void>;
}

const MetricCard: React.FC<{ 
    icon: React.ElementType, 
    title: string, 
    value: string, 
    unit: string, 
    gradientFrom: string,
    gradientTo: string,
    lastUpdated?: string, 
    sparkData?: number[], 
    sparkColor?: string 
}> = ({ icon: Icon, title, value, unit, gradientFrom, gradientTo, lastUpdated, sparkData, sparkColor }) => {
    const hasData = value !== 'N/A' && value !== '--';
    
    return (
        <div className="health-metric-card">
            <div className="health-metric-header">
                <div className="health-metric-icon-wrapper" style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }}>
                    <Icon className="w-6 h-6" />
            </div>
                <div className="health-metric-content">
                    <p className="health-metric-label">{title}</p>
                    <div className="health-metric-value-wrapper">
                        <p className="health-metric-value">
                            {value}
                            <span className="health-metric-unit">{unit}</span>
                        </p>
                        {hasData && <span className="health-metric-live-badge">Live</span>}
                    </div>
                    {lastUpdated && (
                        <div className="health-metric-timestamp">
                            <ClockIcon className="w-3 h-3" />
                            <span>{new Date(lastUpdated).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    )}
                </div>
            </div>
            {sparkData && sparkData.length > 0 && (
                <div className="health-metric-sparkline">
                    <Chart data={sparkData} color={sparkColor || 'rgba(107,114,128,0.2)'} />
                </div>
            )}
    </div>
);
};

const Chart: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
    const height = 120;
    if (data.length < 2) return <div style={{height: `${height}px`}} className="flex items-center justify-center text-text-tertiary text-xs">Not enough data for chart</div>;
    
    const maxVal = Math.max(...data, 1);

    return (
        <div className="flex items-end h-full gap-2 pt-4">
            {data.map((val, i) => (
                <div key={i} className="flex-1 rounded-t-md transition-all duration-300" style={{ height: `${(val / maxVal) * 100}%`, backgroundColor: color }}></div>
            ))}
        </div>
    );
};

export const WearablesView: React.FC<WearablesViewProps> = ({ patient, onSimulateData }) => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [deviceToRemove, setDeviceToRemove] = useState<string | null>(null);
    const [_isRemoving, setIsRemoving] = useState(false);

    const handleSimulation = async () => {
        setIsSimulating(true);
        await onSimulateData();
        setIsSimulating(false);
    };

    const data = patient.wearableData || [];
    const today = new Date().toISOString().split('T')[0];
    
    const todaysData = data.find(d => d.timestamp.startsWith(today)) || data[data.length - 1];
    const lastNightData = data.find(d => new Date(d.timestamp).getDate() === new Date().getDate() - 1);

    const heartRateHistory = data.map(d => d.heartRate || 0).slice(-7);
    const stepHistory = data.map(d => d.steps || 0).slice(-7);

    const hasData = data.length > 0;
    const heartRateChartData = data.slice(-7).map((d, i) => ({
        value: d.heartRate || 0,
        label: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
    const stepsChartData = data.slice(-7).map((d, i) => ({
        value: d.steps || 0,
        label: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    return (
        <div className="health-metrics-page">
            <div className="health-metrics-header">
                <div className="health-metrics-header-content">
                    <div className="health-metrics-header-icon-wrapper">
                        <HeartPulseIcon className="w-6 h-6" />
                    </div>
        <div>
                        <h2 className="health-metrics-title">Health Metrics</h2>
                        <p className="health-metrics-subtitle">Real-time data from your connected wearable devices</p>
                </div>
                </div>
                <button onClick={() => setModalOpen(true)} className="health-metrics-connect-button">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Connect Device</span>
                </button>
            </div>
            
            {hasData ? (
                <>
                    <div className="health-metrics-grid">
                        <MetricCard 
                            icon={HeartIcon} 
                            title="Heart Rate" 
                            value={todaysData?.heartRate?.toString() ?? 'N/A'} 
                            unit="bpm" 
                            gradientFrom="#ef4444"
                            gradientTo="#dc2626"
                            lastUpdated={todaysData?.timestamp} 
                            sparkData={heartRateHistory} 
                            sparkColor="#ef4444" 
                        />
                        <MetricCard 
                            icon={ActivityIcon} 
                            title="Steps Today" 
                            value={todaysData?.steps?.toLocaleString() ?? 'N/A'} 
                            unit="steps" 
                            gradientFrom="#0284c7"
                            gradientTo="#0369a1"
                            lastUpdated={todaysData?.timestamp} 
                            sparkData={stepHistory} 
                            sparkColor="#0284c7" 
                        />
                        <MetricCard 
                            icon={BedIcon} 
                            title="Last Night's Sleep" 
                            value={lastNightData?.sleepHours?.toString() ?? 'N/A'} 
                            unit="hours" 
                            gradientFrom="#8b5cf6"
                            gradientTo="#7c3aed"
                            lastUpdated={lastNightData?.timestamp} 
                        />
            </div>
            
                    <div className="health-trends-grid">
                        <div className="health-trend-card">
                            <div className="health-trend-header">
                                <div className="health-trend-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                                    <HeartIcon className="w-5 h-5" />
            </div>
                                <div>
                                    <h4 className="health-trend-title">Heart Rate Trend</h4>
                                    <p className="health-trend-subtitle">Last 7 days</p>
                                </div>
                            </div>
                            <div className="health-trend-chart">
                                {heartRateChartData.length >= 2 ? (
                                    <HealthChart data={heartRateChartData} color="#ef4444" unit="bpm" />
                                ) : (
                                    <div className="health-chart-empty">Not enough data to display chart</div>
                                )}
                            </div>
                        </div>
                        <div className="health-trend-card">
                            <div className="health-trend-header">
                                <div className="health-trend-icon" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
                                    <ActivityIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="health-trend-title">Steps Trend</h4>
                                    <p className="health-trend-subtitle">Last 7 days</p>
                                </div>
                            </div>
                            <div className="health-trend-chart">
                                {stepsChartData.length >= 2 ? (
                                    <HealthChart data={stepsChartData} color="#0284c7" unit="steps" />
                                ) : (
                                    <div className="health-chart-empty">Not enough data to display chart</div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="health-simulator-card">
                        <div className="health-simulator-header">
                            <div className="health-simulator-icon">
                                <RefreshCwIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="health-simulator-title">Wearable Device Simulator</h4>
                                <p className="health-simulator-subtitle">Simulate receiving new data from your connected health device</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleSimulation} 
                            disabled={isSimulating}
                            className="health-simulator-button"
                        >
                            <RefreshCwIcon className={`w-5 h-5 ${isSimulating ? 'animate-spin' : ''}`} />
                            <span>{isSimulating ? 'Simulating...' : 'Simulate New Data'}</span>
                        </button>
                    </div>
                    
                    {patient.wearableDevices && patient.wearableDevices.length > 0 && (
                        <div className="health-devices-section">
                            <div className="health-devices-header">
                                <h4 className="health-devices-title">Connected Devices</h4>
                                <p className="health-devices-subtitle">Devices currently registered to your account</p>
                            </div>
                            <div className="health-devices-grid">
                                {patient.wearableDevices.map((d: any) => (
                                    <div key={d.id} className="health-device-card">
                                        <div className="health-device-info">
                                            <div className="health-device-icon">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                            <div className="health-device-details">
                                                <div className="health-device-name">{d.name}</div>
                                                <div className="health-device-meta">
                                                    <span>{d.type}</span>
                                                    <span>•</span>
                                                    <span>Added {new Date(d.addedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setDeviceToRemove(d.id)} 
                                            className="health-device-remove-button"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="health-empty-state">
                    <HeartPulseIcon className="w-16 h-16" />
                    <h3 className="health-empty-title">No Health Data Available</h3>
                    <p className="health-empty-message">Connect a wearable device to start tracking your health metrics in real-time.</p>
                    <button onClick={() => setModalOpen(true)} className="health-empty-connect-button">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Connect Your First Device</span>
                    </button>
                </div>
            )}
            <ConfirmationModal isOpen={!!deviceToRemove} onClose={() => setDeviceToRemove(null)} onConfirm={async () => {
                if (!deviceToRemove) return;
                setIsRemoving(true);
                try {
                    await api.removeWearableDevice(deviceToRemove);
                    setDeviceToRemove(null);
                    // trigger refresh
                    if (onSimulateData) await onSimulateData(); else await api.simulateWearableData();
                } catch (err) {
                    console.error('Failed to remove device', err);
                    // show toast if available
                } finally {
                    setIsRemoving(false);
                }
            }} title="Remove device" message="Are you sure you want to remove this device?" confirmText="Remove" cancelText="Cancel" type="danger" />
            <ConnectWearableModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onConnected={async () => {
                // After connecting, trigger a fetch/refresh. Prefer the provided simulate handler if available.
                try {
                    if (onSimulateData) await onSimulateData();
                    else await api.simulateWearableData();
                } catch (err) {
                    console.warn('Failed to refresh wearable data after connect', err);
                }
            }} />
        </div>
    );
};