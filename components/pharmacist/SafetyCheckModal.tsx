import React from 'react';
import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { PharmacySafetyCheckResult } from '../../types.ts';
import { CheckCircleIcon, AlertTriangleIcon } from '../icons/index.tsx';

interface SafetyCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  result: PharmacySafetyCheckResult | null;
}

const LoadingState: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-text-secondary h-40">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Running safety check...</p>
    </div>
);

export const SafetyCheckModal: React.FC<SafetyCheckModalProps> = ({ isOpen, onClose, isLoading, result }) => {

    const renderContent = () => {
        if (isLoading) {
            return <LoadingState />;
        }
        if (!result) {
            return <div className="text-center p-8">No results to display.</div>;
        }

        if (result.status === 'pass') {
            return (
                <div className="text-center p-8">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-text-primary">No Interactions Found</h3>
                    <p className="text-text-secondary mt-2">The AI safety check did not detect any significant drug-to-drug interactions.</p>
                </div>
            );
        }

        const severityClass = `severity-${result.interactionSeverity?.toLowerCase()}`;

        return (
            <div className={`safety-check-modal ${severityClass}`}>
                <div className="safety-check-header">
                    <AlertTriangleIcon className="w-8 h-8" />
                    <h3 className="text-xl font-bold">Potential Interaction Detected</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="font-semibold text-text-secondary">Severity</p>
                        <p className="font-bold text-lg">{result.interactionSeverity}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-text-secondary">Details</p>
                        <p>{result.interactionDetails}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-text-secondary">AI Recommendation</p>
                        <p>{result.recommendation}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Pharmacy Safety Check">
            {renderContent()}
            <div className="mt-6 flex justify-end">
                <Button onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
};
