import {useState, useCallback} from 'react';

export function useCopyToClipboard(timeout = 1800) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      if (!navigator.clipboard) {
        fallbackCopy(text);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      } catch {
        fallbackCopy(text);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      }
    },
    [timeout],
  );

  return {copy, copied};
}

function fallbackCopy(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {}
  document.body.removeChild(ta);
}
