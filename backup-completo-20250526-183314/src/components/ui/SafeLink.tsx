import React from 'react';
import { xssProtection } from '../../lib/security/xssProtection';

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export const SafeLink: React.FC<SafeLinkProps> = ({
  href,
  children,
  ...props
}) => {
  const sanitizedHref = xssProtection.sanitizeURL(href);

  if (!sanitizedHref) {
    return null;
  }

  return (
    <a
      href={sanitizedHref}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    >
      {children}
    </a>
  );
};