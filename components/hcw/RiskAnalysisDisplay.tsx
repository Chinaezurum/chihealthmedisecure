import React from 'react';
import { PredictiveRiskResult } from '../../types.ts';
import { RiskGauge } from '../common/RiskGauge.tsx';

interface RiskAnalysisDisplayProps {
  results: PredictiveRiskResult[];
}

const RiskCard: React.FC<{ result: PredictiveRiskResult }> = ({ result }) => {
    const getRiskLevelClasses = (level: 'Low' | 'Medium' | 'High') => {
        switch (level) {
            case 'Low': return 'border-green-500/50 bg-green-500/5 text-green-600 dark:text-green-400';
            case 'Medium': return 'border-amber-500/50 bg-amber-500/5 text-amber-600 dark:text-amber-400';
            case 'High': return 'border-red-500/50 bg-red-500/5 text-red-600 dark:text-red-400';
        }
    };

    return (
        <div className={`risk-analysis-card ${getRiskLevelClasses(result.riskLevel)}`}>
            <div className="risk-analysis-card-header">
                <h4 className="font-bold text-lg text-text-primary">{result.condition}</h4>
                <div className={`px-3 py-1 text-xs font-bold rounded-full ${getRiskLevelClasses(result.riskLevel).replace('text-green-600','!text-green-700').replace('dark:text-green-400', 'dark:!text-green-300')}`}>
                    {result.riskLevel.toUpperCase()} RISK
                </div>
            </div>
            <div className="risk-analysis-card-body">
                <RiskGauge score={result.riskScore} />
                <div>
                    <h5 className="text-sm font-semibold text-text-primary mb-1">Justification</h5>
                    <p className="text-sm text-text-secondary">{result.justification}</p>
                </div>
            </div>
        </div>
    );
};

export const RiskAnalysisDisplay: React.FC<RiskAnalysisDisplayProps> = ({ results }) => {
    if (!results || results.length === 0) {
        return <p className="text-center text-text-secondary p-4">No risk analysis data available.</p>;
    }
    
    return (
        <div className="risk-analysis-container">
            {results.map((result, index) => (
                <RiskCard key={index} result={result} />
            ))}
        </div>
    );
};
