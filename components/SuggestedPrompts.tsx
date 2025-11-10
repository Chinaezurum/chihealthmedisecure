
import React from 'react';

const prompts = [
    "Outline the database schema for patient records.",
    "Design a secure authentication flow using RBAC.",
    "What's the best approach for offline data sync?",
    "Suggest a tech stack for the telemedicine module.",
];

interface SuggestedPromptsProps {
    onPromptSelect: (prompt: string) => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onPromptSelect }) => {
    return (
        <div className="suggested-prompts-container">
            <p className="suggested-prompts-title">Start a conversation</p>
            <div className="suggested-prompts-grid">
                {prompts.map((prompt, i) => (
                    <button key={i} onClick={() => onPromptSelect(prompt)} className="suggested-prompt-button">
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
};
