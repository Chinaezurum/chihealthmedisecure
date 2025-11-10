import React from 'react';

// A simple markdown parser function
const parseMarkdown = (text: string): string => {
    if (!text) return '';
    
    let html = text
        // Escape HTML to prevent injection, except for our own tags
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italics: *text*
    html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // Code blocks: ```code```
    html = html.replace(/```([\s\S]*?)```/g, (_match, code) => `<pre><code>${code.trim()}</code></pre>`);
    // Inline code: `code`
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    // Unordered lists from * or -
    html = html.replace(/^\s*[-*]\s+(.*)/gm, '<li>$1</li>');
    html = html.replace(/(<\/li>\n<li>)/g, '</li><li>');
    html = html.replace(/((?:<li>.*<\/li>)+)/gs, '<ul>$1</ul>');
    // Newlines to <br>
    html = html.replace(/\n/g, '<br />');
    // Remove <br> inside lists and pre blocks
    html = html.replace(/<ul><br \/>/g, '<ul>').replace(/<br \/>\n<\/ul>/g, '</ul>');
    html = html.replace(/<li><br \/>/g, '<li>');
    html = html.replace(/<pre>(.*?)<\/pre>/gs, (_m, content) => `<pre>${content.replace(/<br \s*\/?>/g, '\n')}</pre>`);

    return html;
};


interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    const html = parseMarkdown(content);
    return (
        <div 
            className={`prose ${className}`} 
            dangerouslySetInnerHTML={{ __html: html }} 
        />
    );
};
