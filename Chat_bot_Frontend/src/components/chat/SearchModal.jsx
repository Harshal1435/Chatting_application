import { useState, useEffect, useRef } from "react";
import { Search, X, Loader } from "lucide-react";
import useSearch from "../../hooks/useSearch";
import { decryptText } from "../../utils/cryptoUtils";

/**
 * Search Modal — full dark/light mode support.
 */
const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [decryptedResults, setDecryptedResults] = useState([]);
  const { loading, results, searchMessages, clearResults } = useSearch();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length === 0) {
      clearResults();
      setDecryptedResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchMessages(query.trim());
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Decrypt results when they arrive
  useEffect(() => {
    if (!results || results.length === 0) {
      setDecryptedResults([]);
      return;
    }

    let cancelled = false;

    Promise.all(
      results.map(async (msg) => {
        try {
          const text = await decryptText(msg.message, msg.iv);
          return { ...msg, decryptedText: text };
        } catch {
          return { ...msg, decryptedText: "[Encrypted message]" };
        }
      })
    ).then((decrypted) => {
      if (!cancelled) setDecryptedResults(decrypted);
    });

    return () => { cancelled = true; };
  }, [results]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleClose = () => {
    setQuery("");
    clearResults();
    setDecryptedResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Modal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[75vh] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages…"
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          />
          {loading && (
            <Loader size={16} className="animate-spin text-blue-500 flex-shrink-0" />
          )}
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {query.trim().length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
              <Search size={32} className="mb-3 opacity-40" />
              <p className="text-sm">Type to search your messages</p>
            </div>
          )}

          {query.trim().length > 0 && !loading && decryptedResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-sm">No messages found for <span className="font-medium text-gray-600 dark:text-gray-300">"{query}"</span></p>
            </div>
          )}

          {decryptedResults.length > 0 && (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {decryptedResults.map((msg) => (
                <li
                  key={msg._id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <img
                    src={
                      msg.senderId?.avatar ||
                      "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png"
                    }
                    alt={msg.senderId?.fullname}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
                    onError={(e) => {
                      e.target.src =
                        "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {msg.senderId?.fullname || "Unknown"}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {msg.decryptedText}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {decryptedResults.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 text-center">
            {decryptedResults.length} result{decryptedResults.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
