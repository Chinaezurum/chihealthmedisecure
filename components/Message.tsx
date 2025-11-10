

import React from 'react';
import { ChatMessage, MessageRole } from '../types.ts';

interface MessageProps {
  message: ChatMessage;
}

const UserIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white flex-shrink-0">
      U
    </div>
);

const ModelIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
    </div>
);

// A simple markdown parser function
const parseMarkdown = (text: string): string => {
    let html = text
        // Escape HTML to prevent injection, except for our own tags
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italics: *text* (more specific regex to avoid conflicts)
    html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // Code blocks: ```code```
    html = html.replace(/```([\s\S]*?)```/g, (_match, code) => `<pre><code>${code.trim()}</code></pre>`);
    // Inline code: `code`
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    // Unordered lists: - item or * item
    html = html.replace(/^(?:\s*)[-*]\s(.*)/gm, '<li>$1</li>');
    html = html.replace(/(<\/li>\n<li>)/g, '</li><li>'); // Join adjacent list items
    html = html.replace(/((?:<li>.*<\/li>)+)/gs, '<ul>$1</ul>');
    // Newlines to <br>
    html = html.replace(/\n/g, '<br />');
    // Remove <br> inside lists and pre blocks
    html = html.replace(/<ul><br \/>/g, '<ul>').replace(/<br \/>\n<\/ul>/g, '</ul>');
    html = html.replace(/<pre>(.*?)<\/pre>/gs, (_m, content) => `<pre>${content.replace(/<br \s*\/?>/g, '\n')}</pre>`);

    return html;
};


export const Message: React.FC<MessageProps> = ({ message }) => {
  const isModel = message.role === MessageRole.MODEL;

  const containerClasses = `flex items-start gap-4 ${
    isModel ? '' : 'flex-row-reverse'
  }`;
  
  const bubbleClasses = `max-w-2xl px-5 py-3 rounded-2xl ${
    isModel
      ? 'bg-gray-800 text-gray-200 rounded-tl-none'
      : 'bg-cyan-700 text-white rounded-tr-none'
  }`;
  
  const contentHtml = parseMarkdown(message.content || '');


  return (
    <div className={containerClasses}>
      {isModel ? <ModelIcon /> : <UserIcon />}
      <div className={bubbleClasses}>
        {message.imageUrl && (
            <img 
                src={message.imageUrl} 
                alt="User upload" 
                className="mb-3 rounded-lg max-w-xs h-auto"
            />
        )}
        {message.content && <div className="prose" dangerouslySetInnerHTML={{ __html: contentHtml }} />}
      </div>
    </div>
  );
};
