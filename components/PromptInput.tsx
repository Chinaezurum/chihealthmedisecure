import React, { useRef } from 'react';

interface PromptInputProps {
  onSendMessage: () => void;
  isLoading: boolean;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  value: string;
  onChange: (value: string) => void;
}

const SendIcon: React.FC<{ isLoading: boolean }> = ({ isLoading }) => (
  isLoading ? (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
  )
);

const PaperclipIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a3 3 0 10-6 0v4a1 1 0 102 0V7a1 1 0 112 0v4a3 3 0 11-6 0V7a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);


export const PromptInput: React.FC<PromptInputProps> = ({ onSendMessage, isLoading, selectedFile, onFileChange, value, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    if(textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((value.trim() || selectedFile) && !isLoading) {
      onSendMessage();
       if(textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };

  return (
    <div>
        {selectedFile && (
            <div className="bg-gray-700/50 p-2 rounded-md mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate pr-2">
                    {selectedFile.name}
                </span>
                <button
                    onClick={() => {
                        onFileChange(null)
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-gray-400 hover:text-white"
                    aria-label="Remove file"
                >
                    &times;
                </button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-start space-x-3 bg-gray-900 border border-gray-600 rounded-xl p-2">
        <button
            type="button"
            onClick={handleFileButtonClick}
            disabled={isLoading}
            className="text-gray-400 hover:text-cyan-400 disabled:text-gray-600 p-3 transition-colors duration-200"
            aria-label="Attach file"
        >
            <PaperclipIcon />
        </button>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            disabled={isLoading}
        />
        <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Discuss a feature or ask a question..."
            className="flex-1 bg-transparent focus:outline-none resize-none text-gray-200 placeholder-gray-500 max-h-48 px-2 self-center"
            rows={1}
            disabled={isLoading}
        />
        <button
            type="submit"
            disabled={isLoading || (!value.trim() && !selectedFile)}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold p-3 rounded-lg transition-colors duration-200 flex items-center justify-center self-end"
            aria-label="Send message"
        >
            <SendIcon isLoading={isLoading} />
        </button>
        </form>
    </div>
  );
};