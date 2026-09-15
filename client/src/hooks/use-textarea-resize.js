import { useEffect, useRef } from 'react';

export function useTextareaResize(value, minRows = 1, maxRows = 6) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const computed = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computed.lineHeight) || 20;
    const padding = (parseFloat(computed.paddingTop) || 8) + (parseFloat(computed.paddingBottom) || 8);
    const minHeight = minRows * lineHeight + padding;
    const maxHeight = maxRows * lineHeight + padding;

    const scrollHeight = textarea.scrollHeight;
    const targetHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${targetHeight}px`;
    textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, minRows, maxRows]);

  return textareaRef;
}

export default useTextareaResize;
