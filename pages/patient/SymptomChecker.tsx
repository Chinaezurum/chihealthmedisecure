import React, { useState } from 'react';
import { ChatMessage, MessageRole, TriageSuggestion } from '../../types.ts';
import { runChat, getTriageSuggestion } from '../../services/geminiService.ts';
import { AISuggestionCard } from '../../components/patient/AISuggestionCard.tsx';
import { Button } from '../../components/common/Button.tsx';
import { HealthAssistantIcon, UserIcon, SendIcon as SendIconSVG, SparklesIcon } from '../../components/icons/index.tsx';

interface SymptomCheckerProps {
    onBookAppointmentWithSuggestion: (specialty: string) => void;
}

const UserAvatar: React.FC = () => (
    <div className="ai-chat-user-avatar">
        <UserIcon className="w-4 h-4" />
    </div>
);

const AIAvatar: React.FC = () => (
    <div className="ai-chat-ai-avatar">
        <HealthAssistantIcon className="w-5 h-5" />
    </div>
);

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isModel = message.role === MessageRole.MODEL;
  
  return (
    <div className={`ai-chat-message ${isModel ? 'ai-chat-message-ai' : 'ai-chat-message-user'}`}>
      {isModel && <AIAvatar />}
      <div className={`ai-chat-bubble ${isModel ? 'ai-chat-bubble-ai' : 'ai-chat-bubble-user'}`}>
        <div className="ai-chat-bubble-content">
          <p className="ai-chat-text">{message.content}</p>
        </div>
      </div>
      {!isModel && <UserAvatar />}
    </div>
  );
};

const SendIcon: React.FC<{ isLoading: boolean }> = ({ isLoading }) => (
  isLoading ? (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ) : (
    <SendIconSVG className="w-5 h-5" />
  )
);

export const SymptomChecker: React.FC<SymptomCheckerProps> = ({ onBookAppointmentWithSuggestion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: MessageRole.MODEL, content: "Hello! I'm your AI Health Assistant. Please describe your symptoms, and I'll provide you with some information. \n\n**Remember, this is not a medical diagnosis. Please consult a qualified healthcare professional for any health concerns.**" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<TriageSuggestion | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiSuggestion]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: MessageRole.USER, content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setError(null);
    setAiSuggestion(null);

    try {
      // Get conversational response
      const response = await runChat(currentInput);
      const modelMessage: ChatMessage = { role: MessageRole.MODEL, content: response };
      setMessages((prev) => [...prev, modelMessage]);

      // Get structured triage suggestion in the background
      const suggestion = await getTriageSuggestion(currentInput);
      let parsed: any = suggestion;
      try { parsed = typeof suggestion === 'string' ? JSON.parse(suggestion) : suggestion; } catch {}
      if (parsed && parsed.recommendation === 'appointment') {
        setAiSuggestion(parsed as TriageSuggestion);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = 'Sorry, I encountered an error while processing your request. Please try again.';
      setError(errorMessage);
      setMessages((prev) => [...prev, { role: MessageRole.MODEL, content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-assistant-container">
      <div className="ai-assistant-header">
        <div className="ai-assistant-header-icon">
          <HealthAssistantIcon className="w-6 h-6" />
        </div>
        <div className="ai-assistant-header-content">
          <h2 className="ai-assistant-title">AI Health Assistant</h2>
          <p className="ai-assistant-subtitle">Get instant information and guidance about your symptoms</p>
        </div>
        <div className="ai-assistant-header-badge">
          <SparklesIcon className="w-4 h-4" />
          <span>AI Powered</span>
        </div>
      </div>
      
      <div className="ai-assistant-disclaimer">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>This is not a medical diagnosis. Please consult a qualified healthcare professional for any health concerns.</span>
      </div>
      
      <div className="ai-assistant-messages">
        <div className="ai-assistant-messages-inner">
          {messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} />
          ))}
          {isLoading && (
            <div className="ai-chat-message ai-chat-message-ai">
              <AIAvatar />
              <div className="ai-chat-bubble ai-chat-bubble-ai">
                <div className="ai-chat-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          {aiSuggestion && (
            <div className="ai-assistant-suggestion-wrapper">
              <AISuggestionCard suggestion={aiSuggestion} onBookAppointment={onBookAppointmentWithSuggestion} />
            </div>
          )}
          {error && (
            <div className="ai-assistant-error">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="ai-assistant-input-area">
        <form onSubmit={handleSendMessage} className="ai-assistant-form">
          <div className="ai-assistant-input-wrapper">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your symptoms or ask a question..."
              className="ai-assistant-input"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading && input.trim()) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button 
              type="submit" 
              className="ai-assistant-send-button"
              disabled={!input.trim() || isLoading}
            >
              <SendIcon isLoading={isLoading} />
            </button>
          </div>
          <p className="ai-assistant-input-hint">Press Enter to send, Shift+Enter for new line</p>
        </form>
      </div>
    </div>
  );
};