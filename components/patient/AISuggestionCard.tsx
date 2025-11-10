import React from 'react';
import { TriageSuggestion } from '../../types.ts';
import { Button } from '../common/Button.tsx';
import { CheckCircleIcon, ArrowRightIcon } from '../icons/index.tsx';

interface AISuggestionCardProps {
  suggestion: TriageSuggestion;
  onBookAppointment: (specialty: string) => void;
}

export const AISuggestionCard: React.FC<AISuggestionCardProps> = ({ suggestion, onBookAppointment }) => {
  return (
    <div className="ai-suggestion-card">
      <div className="ai-suggestion-icon">
        <CheckCircleIcon />
      </div>
      <div className="ai-suggestion-content">
        <h4 className="ai-suggestion-title">AI Suggestion</h4>
        <p className="ai-suggestion-text">{suggestion.reasoning}</p>
        <div className="ai-suggestion-actions">
          <Button onClick={() => onBookAppointment(suggestion.specialty)}>
            Book an appointment with a {suggestion.specialty}
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};