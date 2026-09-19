import { ExternalLink } from 'lucide-react';

/**
 * Extracts readable domain from a URL.
 * @param {string} url
 * @returns {string}
 */
function extractDomain(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 30);
  }
}

/**
 * Returns a favicon URL via Google's favicon service.
 * Falls back gracefully if unavailable.
 * @param {string} domain
 * @returns {string}
 */
function faviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
}

/**
 * NewsResultCard — renders a single web search source as a lightweight,
 * interactive news-style result item.
 *
 * Uses ONLY real data from the Tavily source: title, url, snippet.
 * No timestamps or categories are fabricated.
 *
 * @param {{ source: { title: string, url: string, snippet?: string }, index: number }} props
 */
export function NewsResultCard({ source, index }) {
  const domain = extractDomain(source.url);
  const isExternal = source.url && !source.url.startsWith('#');

  return (
    <a
      href={source.url || '#'}
      target={isExternal ? '_blank' : '_self'}
      rel="noreferrer noopener"
      className="news-result-card"
      aria-label={`Result ${index + 1}: ${source.title}`}
    >
      {/* Index badge + title row */}
      <div className="news-result-header">
        <span className="news-result-index" aria-hidden="true">
          {index + 1}
        </span>
        <h3 className="news-result-title">{source.title || 'Untitled'}</h3>
        {isExternal && (
          <ExternalLink
            size={13}
            className="news-result-external-icon"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Summary / snippet */}
      {source.snippet && (
        <p className="news-result-summary">{source.snippet}</p>
      )}

      {/* Metadata row: domain */}
      <div className="news-result-meta">
        {domain && (
          <>
            <img
              src={faviconUrl(domain)}
              alt=""
              className="news-result-favicon"
              aria-hidden="true"
              width={14}
              height={14}
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="news-result-domain">{domain}</span>
          </>
        )}
      </div>
    </a>
  );
}

export default NewsResultCard;
