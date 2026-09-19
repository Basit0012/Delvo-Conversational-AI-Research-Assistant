import { Globe, Loader2 } from 'lucide-react';

/**
 * SearchStatus — displays the "Web search · N results" header
 * or the "Searching the web..." animated state.
 *
 * @param {{ count?: number, isSearching?: boolean }} props
 */
export function SearchStatus({ count = 0, isSearching = false }) {
  return (
    <div className="search-status-row" aria-live="polite">
      <span className="search-status-icon" aria-hidden="true">
        {isSearching ? (
          <Loader2 size={13} className="search-status-spinner" />
        ) : (
          <Globe size={13} />
        )}
      </span>
      <span className="search-status-label">
        {isSearching
          ? 'Searching the web…'
          : `Web search · ${count} ${count === 1 ? 'result' : 'results'}`}
      </span>
    </div>
  );
}

export default SearchStatus;
