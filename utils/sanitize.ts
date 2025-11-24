/**
 * Sanitization utilities for preventing XSS attacks
 */

import React from 'react';
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks using DOMPurify
 * @param dirty - Potentially unsafe HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (
  dirty: string,
  options?: {
    ALLOWED_TAGS?: string[];
    ALLOWED_ATTR?: string[];
  }
): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: options?.ALLOWED_TAGS || ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: options?.ALLOWED_ATTR || ['href'],
    ...options,
  });
};

/**
 * Sanitize text content (strip all HTML tags)
 * @param dirty - Potentially unsafe string
 * @returns Plain text with all HTML removed
 */
export const sanitizeText = (dirty: string): string => {
  return dirty.replace(/<[^>]*>/g, '');
};

/**
 * Safely highlight keywords in text without using dangerouslySetInnerHTML
 * Splits text on keywords and returns array of strings and JSX elements
 * @param text - Input text
 * @param keywords - Array of keywords to highlight
 * @returns Array of React nodes for safe rendering
 */
export const highlightKeywords = (
  text: string,
  keywords: string[]
): (string | React.ReactElement)[] => {
  if (!keywords.length) return [text];
  
  const pattern = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(pattern);
  
  return parts.map((part, i) => {
    const isKeyword = keywords.some(
      keyword => keyword.toLowerCase() === part.toLowerCase()
    );
    return isKeyword ? React.createElement('strong', { key: i }, part) : part;
  });
};
