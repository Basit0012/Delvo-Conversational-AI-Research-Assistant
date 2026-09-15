import { useEffect, useState, useMemo } from 'react';
import {
  Check,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  ExternalLink,
} from 'lucide-react';

export interface Citation {
  title: string;
  url: string;
  snippet?: string;
}

export interface StreamingTextProps {
  content: string;
  citations?: Citation[];
  followUps?: string[];
  instant?: boolean;
  onFollowUpClick?: (prompt: string) => void;
  onCopy?: () => void;
  onRetry?: () => void;
  onRate?: (type: 'up' | 'down') => void;
}

type TokenType = 'word' | 'citation' | 'break' | 'bullet';

interface Token {
  id: string;
  type: TokenType;
  text?: string;
  isBold?: boolean;
  isHeader?: boolean;
  isParagraph?: boolean;
  citeIndex?: number;
}

function extractDomain(url: string): string {
  if (!url) return 'doc';
  if (url.startsWith('#doc-')) {
    return 'document';
  }
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url.slice(0, 18);
  }
}

/**
 * Tokenize assistant response into structured tokens while parsing:
 * - Bold markers (**text**) -> stripped, isBold: true
 * - Citations ([1], [2]) -> type: 'citation'
 * - Line breaks & paragraphs (\n, \n\n) -> type: 'break'
 * - List prefixes (1., 2., -, *) -> styled bullet
 * - Words -> type: 'word'
 */
function tokenizeResponse(content: string): Token[] {
  if (!content) return [];

  const tokens: Token[] = [];
  let tokenCounter = 0;

  // Split content by lines first to preserve structural layout
  const lines = content.split('\n');

  for (let l = 0; l < lines.length; l++) {
    const rawLine = lines[l];
    const trimmed = rawLine.trim();

    // Check for empty line (paragraph separation)
    if (!trimmed) {
      tokens.push({
        id: `br-${tokenCounter++}`,
        type: 'break',
        isParagraph: true,
      });
      continue;
    }

    // Check for markdown headers (### or ##)
    let lineText = rawLine;
    let isHeader = false;
    if (/^#{1,3}\s+/.test(trimmed)) {
      isHeader = true;
      lineText = trimmed.replace(/^#{1,3}\s+/, '');
    }

    // Check for list bullets like "1. " or "- "
    const listMatch = lineText.match(/^(\s*)(\d+\.|\*|-)\s+/);
    if (listMatch) {
      tokens.push({
        id: `bullet-${tokenCounter++}`,
        type: 'bullet',
        text: listMatch[0],
      });
      lineText = lineText.slice(listMatch[0].length);
    }

    // Process bold sections and citation markers within the line
    // Regex matches either bold sections (**...**) or citations ([digits]) or words
    const segmentRegex = /(\*\*[^*]+\*\*|\[\d+\]|[^\s*\[\]]+|\s+)/g;
    let match: RegExpExecArray | null;

    while ((match = segmentRegex.exec(lineText)) !== null) {
      const seg = match[0];
      if (!seg) continue;

      // Citation marker: [1], [2]
      const citeMatch = seg.match(/^\[(\d+)\]$/);
      if (citeMatch) {
        const citeNum = parseInt(citeMatch[1], 10);
        tokens.push({
          id: `cite-${tokenCounter++}`,
          type: 'citation',
          citeIndex: citeNum - 1,
        });
        continue;
      }

      // Bold segment: **bold text**
      if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
        const innerText = seg.slice(2, -2);
        const innerWords = innerText.split(/(\s+)/).filter(Boolean);
        for (const w of innerWords) {
          if (/^\s+$/.test(w)) {
            continue; // Skip whitespace tokens, words are separated in rendering
          }
          tokens.push({
            id: `bold-${tokenCounter++}`,
            type: 'word',
            text: w,
            isBold: true,
            isHeader,
          });
        }
        continue;
      }

      // Whitespace
      if (/^\s+$/.test(seg)) {
        continue;
      }

      // Regular word token
      tokens.push({
        id: `w-${tokenCounter++}`,
        type: 'word',
        text: seg,
        isHeader,
      });
    }

    // Add a newline break at the end of each line (unless it's the last line)
    if (l < lines.length - 1) {
      tokens.push({
        id: `br-${tokenCounter++}`,
        type: 'break',
      });
    }
  }

  return tokens;
}

function SourceChip({ source, index }: { source?: Citation; index: number }) {
  const isDoc = source?.url?.startsWith('#doc-');
  const domain = source ? extractDomain(source.url) : `Source ${index + 1}`;

  return (
    <a
      href={source?.url || '#'}
      target={isDoc ? '_self' : '_blank'}
      rel="noreferrer"
      title={source ? `${source.title}\n${source.snippet || ''}` : `Source [${index + 1}]`}
      className="ml-0.5 mr-1 inline-flex h-4.5 translate-y-[-1px] items-center gap-1 rounded-[5px]
        bg-[var(--color-surface-subtle,#f1f2f3)] border border-[var(--color-border,#e0e2e5)] pr-1.5 pl-[4px] align-middle font-mono text-[10.5px] font-medium text-[var(--color-primary,#0075DE)] shadow-hairline
        transition-colors duration-150 hover:bg-[var(--color-primary-surface,#e6f3fe)] hover:text-[var(--color-primary-strong,#005BAB)] no-underline"
      style={{ animation: 'pop-in 250ms cubic-bezier(0.23,1,0.32,1) both' }}
    >
      {isDoc ? (
        <FileText size={10} className="shrink-0" />
      ) : (
        <Globe size={10} className="shrink-0" />
      )}
      <span>[{index + 1}]</span>
      <span className="text-[10px] text-[var(--color-ink-secondary,#62656b)] font-normal">{domain}</span>
    </a>
  );
}

export default function StreamingText({
  content = '',
  citations = [],
  followUps = [],
  instant = false,
  onFollowUpClick,
  onCopy,
  onRetry,
  onRate,
}: StreamingTextProps) {
  const tokens = useMemo(() => tokenizeResponse(content), [content]);

  // When instant, reveal all tokens immediately; otherwise start at 1
  const [revealedCount, setRevealedCount] = useState(instant ? tokens.length : 1);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<'up' | 'down' | null>(null);

  const done = revealedCount >= tokens.length;

  useEffect(() => {
    if (instant) {
      setRevealedCount(tokens.length);
      return;
    }

    if (done) return;

    // Organic, smooth word-by-word blur-to-clear cadence
    // Advance 1-2 tokens every 28ms for fluid, natural speed
    const timer = setTimeout(() => {
      setRevealedCount((c) => Math.min(c + 1, tokens.length));
    }, 28);

    return () => clearTimeout(timer);
  }, [revealedCount, done, instant, tokens.length]);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopy) onCopy();
  };

  const handleRate = (type: 'up' | 'down') => {
    const newRating = rating === type ? null : type;
    setRating(newRating);
    if (onRate && newRating) onRate(newRating);
  };

  const visibleTokens = instant ? tokens : tokens.slice(0, revealedCount);

  return (
    <div className="w-full max-w-full text-left font-sans">
      {/* Animated Text Body: Words emerge smoothly out of blur */}
      <div className="text-[14px] leading-relaxed text-[var(--color-ink,#1f2124)] select-text">
        {visibleTokens.map((token, i) => {
          if (token.type === 'break') {
            if (token.isParagraph) {
              return <span key={token.id} className="block h-3" />;
            }
            return <br key={token.id} />;
          }

          if (token.type === 'bullet') {
            return (
              <span
                key={token.id}
                className="inline font-semibold text-[var(--color-primary,#0075DE)] pr-1"
                style={instant ? undefined : { animation: 'fade-in 250ms ease-out both' }}
              >
                {token.text}
              </span>
            );
          }

          if (token.type === 'citation' && token.citeIndex !== undefined) {
            const cite = citations[token.citeIndex];
            return <SourceChip key={token.id} source={cite} index={token.citeIndex} />;
          }

          return (
            <span
              key={token.id}
              className={`inline ${token.isBold ? 'font-semibold text-[var(--color-ink,#111827)]' : ''} ${token.isHeader ? 'font-bold text-[15.5px] text-[var(--color-ink,#111827)] block mt-2 mb-0.5' : ''}`}
              style={
                instant
                  ? undefined
                  : { animation: 'fade-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both' }
              }
            >
              {token.text}{' '}
            </span>
          );
        })}

        {/* Soft pulsing cursor while revealing */}
        {!done && (
          <span
            className="ml-0.5 inline-block h-3.5 w-1 translate-y-0.5 rounded-full bg-[var(--color-primary,#0075DE)]"
            style={{ animation: 'fade-in 150ms ease-out both' }}
          />
        )}
      </div>

      {/* Action Row & Sources Button (fades in once text completes) */}
      <div
        className="mt-3 flex items-center flex-wrap gap-1 transition-opacity duration-400"
        style={{
          opacity: done ? 1 : 0,
          pointerEvents: done ? 'auto' : 'none',
        }}
      >
        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopyClick}
          aria-label="Copy response"
          title={copied ? 'Copied to clipboard' : 'Copy message'}
          className="flex size-7 items-center justify-center rounded-[6px] text-[var(--color-ink-secondary,#62656b)]
            transition-colors duration-150 hover:bg-[var(--color-surface-subtle,#f4f5f6)] hover:text-[var(--color-ink,#1f2124)]"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
        </button>

        {/* Retry button */}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            aria-label="Retry prompt"
            title="Retry response"
            className="flex size-7 items-center justify-center rounded-[6px] text-[var(--color-ink-secondary,#62656b)]
              transition-colors duration-150 hover:bg-[var(--color-surface-subtle,#f4f5f6)] hover:text-[var(--color-ink,#1f2124)]"
          >
            <RotateCcw size={14} />
          </button>
        )}

        {/* Thumbs up */}
        <button
          type="button"
          onClick={() => handleRate('up')}
          aria-label="Thumbs up"
          title="Good response"
          className={`flex size-7 items-center justify-center rounded-[6px] transition-colors duration-150
            ${rating === 'up' ? 'text-[var(--color-primary,#0075DE)] bg-[var(--color-primary-surface,#e6f3fe)]' : 'text-[var(--color-ink-secondary,#62656b)] hover:bg-[var(--color-surface-subtle,#f4f5f6)]'}`}
        >
          <ThumbsUp size={14} />
        </button>

        {/* Thumbs down */}
        <button
          type="button"
          onClick={() => handleRate('down')}
          aria-label="Thumbs down"
          title="Bad response"
          className={`flex size-7 items-center justify-center rounded-[6px] transition-colors duration-150
            ${rating === 'down' ? 'text-red-500 bg-red-50' : 'text-[var(--color-ink-secondary,#62656b)] hover:bg-[var(--color-surface-subtle,#f4f5f6)]'}`}
        >
          <ThumbsDown size={14} />
        </button>

        {/* Collapsible sources trigger */}
        {citations.length > 0 && (
          <button
            type="button"
            aria-expanded={sourcesOpen}
            onClick={() => setSourcesOpen((prev) => !prev)}
            className="ml-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-medium
              bg-[var(--color-surface-subtle,#f4f5f6)] border border-[var(--color-border,#e0e2e5)]
              text-[var(--color-ink-secondary,#62656b)] hover:text-[var(--color-ink,#1f2124)]
              hover:bg-[var(--color-primary-surface,#e6f3fe)] transition-colors duration-150"
          >
            <Globe size={12} className="text-[var(--color-primary,#0075DE)]" />
            <span>
              {citations.length} {citations.length === 1 ? 'source' : 'sources'}
            </span>
            {sourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Expandable Sources Drawer */}
      {citations.length > 0 && sourcesOpen && (
        <div className="mt-2 p-2.5 rounded-lg border border-[var(--color-border,#e0e2e5)] bg-[var(--color-surface-subtle,#f9fafb)] space-y-1.5 text-xs animate-in fade-in-50 duration-200">
          <div className="font-semibold text-[11px] uppercase tracking-wider text-[var(--color-muted,#9a9da3)] mb-1">
            Referenced Sources & Documents
          </div>
          {citations.map((cite, idx) => {
            const isDoc = cite.url?.startsWith('#doc-');
            const domain = extractDomain(cite.url);

            return (
              <a
                key={idx}
                href={cite.url}
                target={isDoc ? '_self' : '_blank'}
                rel="noreferrer"
                className="flex items-start justify-between gap-2 p-1.5 rounded hover:bg-white hover:shadow-xs transition-colors border border-transparent hover:border-gray-200 no-underline"
              >
                <div className="flex items-start gap-2 overflow-hidden">
                  <span className="font-mono text-[11px] font-bold text-[var(--color-primary,#0075DE)] shrink-0">
                    [{idx + 1}]
                  </span>
                  <div className="truncate">
                    <div className="font-medium text-gray-800 truncate">{cite.title || 'Untitled Source'}</div>
                    {cite.snippet && (
                      <div className="text-[11px] text-gray-500 line-clamp-1">{cite.snippet}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10.5px] text-gray-400 shrink-0">
                  <span>{domain}</span>
                  {!isDoc && <ExternalLink size={10} />}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Suggested Follow-ups */}
      {followUps.length > 0 && (
        <div
          className="mt-3.5 transition-opacity duration-400"
          style={{
            opacity: done ? 1 : 0,
            pointerEvents: done ? 'auto' : 'none',
          }}
        >
          <div className="text-xs font-semibold text-[var(--color-ink-secondary,#62656b)] mb-1.5">
            Suggested Follow-ups
          </div>
          <div className="flex flex-col gap-1">
            {followUps.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onFollowUpClick && onFollowUpClick(text)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-left text-xs rounded-md
                  border border-[var(--color-border,#e0e2e5)] bg-[var(--color-surface,#ffffff)]
                  text-[var(--color-ink,#1f2124)] hover:bg-[var(--color-primary-surface,#e6f3fe)]
                  hover:border-[var(--color-primary,#0075DE)] transition-all duration-150 group"
                style={{
                  animation: `fade-up 350ms cubic-bezier(0.23,1,0.32,1) ${i * 70}ms both`,
                }}
              >
                <span className="text-[var(--color-primary,#0075DE)] font-bold">↳</span>
                <span className="group-hover:text-[var(--color-primary,#0075DE)]">{text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
