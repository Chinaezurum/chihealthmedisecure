import React from 'react';
import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { DiagnosticSuggestion } from '../../types.ts';
import { MicroscopeIcon } from '../icons/index.tsx';

interface DiagnosticSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  suggestions: DiagnosticSuggestion[] | null;
  onSave: () => void;
}

const LoadingState: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-text-secondary h-40">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Generating diagnostic suggestions...</p>
    </div>
);

export const DiagnosticSuggestionsModal: React.FC<DiagnosticSuggestionsModalProps> = ({ isOpen, onClose, isLoading, suggestions, onSave }) => {

    const renderContent = () => {
        if (isLoading) {
            return <LoadingState />;
        }
        if (!suggestions || suggestions.length === 0) {
            return <div className="text-center p-8 text-text-secondary">No specific diagnostic suggestions were generated based on the current data.</div>;
        }

        return (
            <ul className="space-y-4">
                {suggestions.map((item, index) => (
                    <li key={index} className="p-4 bg-background-tertiary rounded-lg">
                        <div className="flex items-center gap-3">
                            <MicroscopeIcon className="w-5 h-5 text-primary" />
                            <h4 className="font-semibold text-text-primary">{item.testName}</h4>
                        </div>
                        <p className="text-sm text-text-secondary mt-1 pl-8">{item.reason}</p>
                    </li>
                ))}
            </ul>
        );
    };
    
    const footer = (
        <>
            <Button onClick={onClose} style={{backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'}}>Close</Button>
            <Button onClick={onSave} disabled={isLoading || !suggestions || suggestions.length === 0}>Save to Note</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Diagnostic Suggestions" footer={footer}>
            {renderContent()}
        </Modal>
    );
};
