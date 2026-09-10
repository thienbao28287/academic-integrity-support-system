import { useEffect, useRef, useState } from "react";

import { formatNumber } from "../utils/journal";

export default function JournalSearch({ lookup }) {
  const searchBoxRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const { query, suggestions, searchStatus, detailStatus, message } = lookup;

  useEffect(() => {
    if (searchStatus === "loading" || searchStatus === "success" || searchStatus === "error") {
      setShowSuggestions(true);
      setActiveSuggestion(suggestions.length ? 0 : -1);
    }
  }, [searchStatus, suggestions]);

  useEffect(() => {
    const closeSuggestions = (event) => {
      if (!searchBoxRef.current?.contains(event.target)) setShowSuggestions(false);
    };
    document.addEventListener("pointerdown", closeSuggestions);
    return () => document.removeEventListener("pointerdown", closeSuggestions);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const suggestion = activeSuggestion >= 0 ? suggestions[activeSuggestion] : null;
    const loaded = await lookup.submit(suggestion);
    if (loaded) setShowSuggestions(false);
    else if (suggestions.length) setShowSuggestions(true);
  };

  const handleKeyDown = (event) => {
    if (!showSuggestions || !suggestions.length) {
      if (event.key === "Escape") setShowSuggestions(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = async (item) => {
    const loaded = await lookup.loadJournal(item.issn);
    if (loaded) setShowSuggestions(false);
  };

  return (
    <div className="journal-search-section">
      <h1 id="journals-title">Tra cứu thông tin tạp chí</h1>
      <form className="journal-search-form" onSubmit={handleSubmit} ref={searchBoxRef} role="search">
        <div className="journal-combobox">
          <input
            ref={lookup.inputRef}
            value={query}
            onChange={(event) => lookup.setQuery(event.target.value)}
            onFocus={() => suggestions.length && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tên tạp chí hoặc mã ISSN (ví dụ: Cell, 0092-8674)"
            role="combobox"
            aria-label="Tên tạp chí hoặc mã ISSN"
            aria-autocomplete="list"
            aria-controls="journal-suggestions"
            aria-expanded={showSuggestions}
            aria-activedescendant={activeSuggestion >= 0 ? `journal-option-${activeSuggestion}` : undefined}
            autoComplete="off"
          />
          {showSuggestions && (
            <div className="journal-suggestions" id="journal-suggestions" role="listbox">
              {searchStatus === "loading" && <p className="suggestion-state">Đang tìm tạp chí...</p>}
              {searchStatus === "error" && <p className="suggestion-state error-text">Không thể tải gợi ý.</p>}
              {searchStatus === "success" && !suggestions.length && <p className="suggestion-state">Không tìm thấy tạp chí phù hợp.</p>}
              {suggestions.map((item, index) => (
                <button
                  id={`journal-option-${index}`}
                  role="option"
                  aria-selected={activeSuggestion === index}
                  className={activeSuggestion === index ? "active" : ""}
                  type="button"
                  key={`${item.openAlexId || item.issn}-${index}`}
                  onMouseEnter={() => setActiveSuggestion(index)}
                  onClick={() => selectSuggestion(item)}
                >
                  <strong>{item.displayName || "Tạp chí chưa có tên"}</strong>
                  <span>{item.publisher || "Chưa rõ nhà xuất bản"} · ISSN {item.issn || "—"} · {formatNumber(item.worksCount)} tác phẩm</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="search-submit" type="submit" disabled={detailStatus === "loading"}>{detailStatus === "loading" ? "Đang tra cứu..." : "Tra cứu"}</button>
      </form>
      {message && <p className="search-message" role="alert">{message}</p>}
    </div>
  );
}
