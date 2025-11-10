import React from 'react';
import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { ReferralSuggestion } from '../../types.ts';
import { RepeatIcon } from '../icons/index.tsx';

interface ReferralSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  suggestion: ReferralSuggestion | null;
  onSave: () => void;
}

const LoadingState: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-text-secondary h-40">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Generating referral suggestion...</p>
    </div>
);

export const ReferralSuggestionModal: React.FC<ReferralSuggestionModalProps> = ({ isOpen, onClose, isLoading, suggestion, onSave }) => {

    const renderContent = () => {
        if (isLoading) {
            return <LoadingState />;
        }
        if (!suggestion) {
            return <div className="text-center p-8 text-text-secondary">No referral suggestion was generated.</div>;
        }

        return (
            <div className="p-4 bg-background-tertiary rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                    <RepeatIcon className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-text-primary">Suggested Referral</h4>
                </div>
                <p className="text-2xl font-bold text-primary pl-8">{suggestion.specialty}</p>
                
                <div className="mt-4 pl-8">
                    <p className="font-semibold text-text-secondary text-sm">Reasoning:</p>
                    <p className="text-text-primary">{suggestion.reason}</p>
                </div>
            </div>
        );
    };
    
    const footer = (
        <>
            <Button onClick={onClose} style={{backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'}}>Close</Button>
            <Button onClick={onSave} disabled={isLoading || !suggestion}>Create Referral</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Referral Suggestion" footer={footer}>
            {renderContent()}
        </Modal>
    );
};
