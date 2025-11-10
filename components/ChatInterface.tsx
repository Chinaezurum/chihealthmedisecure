

import React, { useState } from 'react';
import { ChatMessage } from '../types.ts';
import { Message } from './Message.tsx';
import { PromptInput } from './PromptInput.tsx';
import { SuggestedPrompts } from './SuggestedPrompts.tsx';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (input: string) => void;
  error: string | null;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  error,
  selectedFile,
  onFileChange,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessageWrapper = () => {
    onSendMessage(input);
    setInput('');
  }
  
  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 1 && <SuggestedPrompts onPromptSelect={handlePromptSelect} />}
        {messages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="bg-gray-800/70 border-t border-gray-700 p-4 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
           {error && <p className="text-red-400 text-sm mb-2">Error: {error}</p>}
          <PromptInput 
            value={input}
            onChange={setInput}
            onSendMessage={handleSendMessageWrapper} 
            isLoading={isLoading} 
            selectedFile={selectedFile}
            onFileChange={onFileChange}
            />
        </div>
      </div>
    </div>
  );
};
