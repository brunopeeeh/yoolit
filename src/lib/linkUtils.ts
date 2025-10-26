import React from 'react';

// Regex para detectar URLs
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Converte texto com URLs em elementos React com links clicáveis
 */
export const renderTextWithLinks = (text: string): React.ReactNode => {
  if (!text) return text;
  
  const parts = text.split(URL_REGEX);
  
  return parts.map((part, index) => {
    // Reset regex para cada teste
    URL_REGEX.lastIndex = 0;
    
    if (URL_REGEX.test(part)) {
      return React.createElement(
        'a',
        {
          key: index,
          href: part,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'text-blue-500 hover:text-blue-700 underline break-all',
        },
        part
      );
    }
    return React.createElement('span', { key: index }, part);
  });
};

/**
 * Verifica se o texto contém URLs
 */
export const hasLinks = (text: string): boolean => {
  URL_REGEX.lastIndex = 0;
  return URL_REGEX.test(text);
};