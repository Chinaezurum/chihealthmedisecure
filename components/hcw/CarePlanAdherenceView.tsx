
import React from 'react';
import { CarePlan, CarePlanAdherence } from '../../types.ts';

interface CarePlanAdherenceViewProps {
  plan: CarePlan;
  adherence: CarePlanAdherence;
}

const AdherenceItem: React.FC<{ item: CarePlanAdherence['details'][0] }> = ({ item }) => {
    const getStatusClasses = (status: 'On Track' | 'Needs Improvement' | 'Off Track') => {
        switch(status) {
            case 'On Track': return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300';
            case 'Needs Improvement': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300';
            case 'Off Track': return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300';
            default: return 'bg-slate-100 dark:bg-slate-700';
        }
    };
    return (
        <li className="p-4 bg-background-tertiary rounded-lg">
            <div className="flex justify-between items-center">
                <p className="font-semibold text-text-primary">{item.category}</p>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusClasses(item.status)}`}>
                    {item.status}
                </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">Target: {item.target}</p>
        </li>
    );
};

export const CarePlanAdherenceView: React.FC<CarePlanAdherenceViewProps> = ({ plan: _plan, adherence }) => {
    const scoreColor = adherence.adherenceScore > 75 ? 'bg-green-500' : adherence.adherenceScore > 50 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div className="mt-6 border-t border-border-primary pt-6">
            <h4 className="text-lg font-semibold text-text-primary mb-4 text-center">Care Plan Adherence Report</h4>

            <div className="flex items-center gap-6 p-4 bg-background-tertiary rounded-lg mb-6">
                <div className="flex-shrink-0">
                    <div className="relative w-24 h-24">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                                className="text-border-primary"
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                className={`transition-all duration-500 ${scoreColor.replace('bg-', 'text-')}`}
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${adherence.adherenceScore}, 100`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-text-primary">{adherence.adherenceScore}%</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h5 className="font-semibold text-text-primary">Overall Adherence Score</h5>
                    <p className="text-sm text-text-secondary mt-1">{adherence.comment}</p>
                </div>
            </div>

            <h5 className="font-semibold text-text-primary mb-3">Adherence Details by Category</h5>
            <ul className="space-y-3">
                {adherence.details.map((item, index) => (
                    <AdherenceItem key={index} item={item} />
                ))}
            </ul>
        </div>
    );
};
