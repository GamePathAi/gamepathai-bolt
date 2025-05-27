import React from 'react';
import { xssProtection } from '../../lib/security/xssProtection';

interface SafeHTMLProps {
  html: string;
  className?: string;
  allowedTags?: string[];
  allowedAttrs?: string[];
}

export const SafeHTML: React.FC<SafeHTMLProps> = ({
  html,
  className,
  allowedTags,
  allowedAttrs
}) => {
  const sanitizedHTML = xssProtection.sanitizeHTML(html, {
    allowedTags,
    allowedAttrs
  });

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};