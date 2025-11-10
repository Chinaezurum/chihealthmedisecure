import React from 'react';
import { CarePlan } from '../../types.ts';
import { DietIcon, ActivityIcon, RepeatIcon, MicroscopeIcon } from '../icons/index.tsx';

interface CarePlanDisplayProps {
    plan: CarePlan;
}

const Section: React.FC<{ title: string, icon: React.ElementType, children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="care-plan-section">
        <div className="care-plan-section-header">
            <Icon className="care-plan-section-header-icon" />
            <h4>{title}</h4>
        </div>
        <ul className="care-plan-list">
            {children}
        </ul>
    </div>
);

export const CarePlanDisplay: React.FC<CarePlanDisplayProps> = ({ plan }) => {
    return (
        <div className="care-plan-container">
            <h3 className="font-semibold text-lg text-text-primary mb-4 text-center">Generated Proactive Care Plan</h3>
            <div className="care-plan-grid">
                <Section title="Lifestyle Recommendations" icon={DietIcon}>
                    {plan.lifestyleRecommendations.map((item, index) => (
                        <li key={index} className="care-plan-item">
                            <strong>{item.recommendation} ({item.category})</strong>
                            <p>{item.details}</p>
                        </li>
                    ))}
                </Section>
                 <Section title="Monitoring Suggestions" icon={ActivityIcon}>
                    {plan.monitoringSuggestions.map((item, index) => (
                        <li key={index} className="care-plan-item">
                            <strong>{item.parameter}</strong>
                            <p>Frequency: {item.frequency}</p>
                            <p>Notes: {item.notes}</p>
                        </li>
                    ))}
                </Section>
                <Section title="Follow-Up Appointments" icon={RepeatIcon}>
                     {plan.followUpAppointments.map((item, index) => (
                        <li key={index} className="care-plan-item">
                            <strong>{item.specialty}</strong>
                            <p>When: {item.timeframe}</p>
                            <p>Reason: {item.reason}</p>
                        </li>
                    ))}
                </Section>
                {(plan.diagnosticSuggestions?.length ?? 0) > 0 && (
                     <Section title="Diagnostic Suggestions" icon={MicroscopeIcon}>
                         {plan.diagnosticSuggestions?.map((item, index) => (
                            <li key={index} className="care-plan-item">
                                <strong>{item.testName}</strong>
                                <p>Reason: {item.reason}</p>
                            </li>
                        ))}
                    </Section>
                )}
            </div>
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-600 dark:text-amber-300">
                <strong>Disclaimer:</strong> This AI-generated care plan is a suggestion based on the available data. It requires clinical review and approval by a qualified healthcare professional.
            </div>
        </div>
    );
};