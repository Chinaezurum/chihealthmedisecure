import React from 'react';
import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { LifestyleRecommendation } from '../../types.ts';
import { DietIcon, ActivityIcon } from '../icons/index.tsx';

interface LifestylePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  recommendations: LifestyleRecommendation[] | null;
  onSave: () => void;
}

const LoadingState: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-text-secondary h-40">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Generating personalized lifestyle plan...</p>
    </div>
);

export const LifestylePlanModal: React.FC<LifestylePlanModalProps> = ({ isOpen, onClose, isLoading, recommendations, onSave }) => {

    const renderContent = () => {
        if (isLoading) {
            return <LoadingState />;
        }
        if (!recommendations || recommendations.length === 0) {
            return <div className="text-center p-8 text-text-secondary">No specific lifestyle recommendations were generated.</div>;
        }

        const dietRecs = recommendations.filter(r => r.category === 'Diet');
        const exerciseRecs = recommendations.filter(r => r.category === 'Exercise');

        return (
            <div className="space-y-6">
                {dietRecs.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2"><DietIcon className="w-5 h-5 text-primary" /> Diet Recommendations</h4>
                        <ul className="space-y-3 pl-4">
                            {dietRecs.map((rec, i) => (
                                <li key={`diet-${i}`} className="p-3 bg-background-tertiary rounded-md">
                                    <p className="font-medium text-text-primary">{rec.recommendation}</p>
                                    <p className="text-sm text-text-secondary">{rec.details}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {exerciseRecs.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2"><ActivityIcon className="w-5 h-5 text-primary" /> Exercise Recommendations</h4>
                         <ul className="space-y-3 pl-4">
                            {exerciseRecs.map((rec, i) => (
                                <li key={`ex-${i}`} className="p-3 bg-background-tertiary rounded-md">
                                    <p className="font-medium text-text-primary">{rec.recommendation}</p>
                                    <p className="text-sm text-text-secondary">{rec.details}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };
    
    const footer = (
        <>
            <Button onClick={onClose} style={{backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'}}>Close</Button>
            <Button onClick={onSave} disabled={isLoading || !recommendations || recommendations.length === 0}>Save to Care Plan</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Lifestyle & Diet Plan" footer={footer}>
            {renderContent()}
        </Modal>
    );
};
