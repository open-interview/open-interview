import { cloneElement, ReactElement } from 'react';

interface FocusRingProps {
  children: ReactElement<{ className?: string }>;
  /** Extra classes to merge onto the child */
  className?: string;
}

/**
 * Wraps a single interactive element with an MD3-compliant visible focus ring:
 * 3dp outline, 2dp offset, using the primary color token.
 * Uses CSS class injection so no wrapper DOM node is added.
 */
export function FocusRing({ children, className = '' }: FocusRingProps) {
  const existing = children.props.className ?? '';
  return cloneElement(children, {
    className: `focus-ring ${existing} ${className}`.trim(),
  });
}
