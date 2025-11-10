import React, { useState } from 'react';
// Fix: Add .tsx extension to local module import.
import { PatientView } from '../../pages/patient/PatientDashboard.tsx';
import { HealthAssistantIcon } from '../icons/index.tsx';

interface MiniSymptomCheckerProps {
    setActiveView: (view: PatientView) => void;
}

export const MiniSymptomChecker: React.FC<MiniSymptomCheckerProps> = ({ setActiveView }) => {
    const [symptomInput, setSymptomInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // A future improvement could be to pass the symptomInput to the next view
        setActiveView('symptom-checker');
    };

    return (
        <div className="modern-card symptom-checker-modern">
            <div className="symptom-checker-header">
                <div className="symptom-checker-icon-wrapper">
                    <HealthAssistantIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h3 className="modern-card-title">How are you feeling today?</h3>
                    <p className="symptom-checker-subtitle">Get instant information from our AI Health Assistant.</p>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="symptom-checker-form">
                <div className="symptom-input-wrapper">
                    <input
                        type="text"
                        value={symptomInput}
                        onChange={(e) => setSymptomInput(e.target.value)}
                        placeholder="e.g., 'I have a headache and a fever...'"
                        className="symptom-input-modern"
                    />
                </div>
                <button 
                    type="submit" 
                    className="symptom-check-button"
                    disabled={!symptomInput.trim()}
                >
                    <span>Check Symptoms</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </form>
        </div>
    );
};