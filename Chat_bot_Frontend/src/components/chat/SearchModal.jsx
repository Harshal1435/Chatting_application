import { useState, useEffect } from "react";
import { Search, X, Loader } from "lucide-react";
import useSearch from "../../hooks/useSearch";
import { decryptText } from "../../utils/cryptoUtils";

/**
 * Search Modal Component
 * Allows searching messages across all conversations
 */
const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { loading, results, searchMessages, clearResults } = useSearch();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      searchMessages(debouncedQuery);
    } else {
      clearResults();
    }
  }, [debouncedQuery]);

  const handleClose = () => {
    setQuery("");
    clearResults();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-base-100 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center gap-3">
          <Search size={20} className="text-base-content/60" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent outline-none text-base"
            autoFocus
          />
          {loading && <Loader size={20} className="animate-spin text-primary" />}
          <button onClick={handleClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={20} />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {results.length === 0 && query.trim().length > 0 && !loading && (
            <div className="text-center text-base-content/60 py-8">
              No messages found for "{query}"
            </div>
          )}

          {results.length === 0 && query.trim().length === 0 && (
            <div className="text-center text-base-content/60 py-8">
              Type to search messages...
            </div>
          )}

          <div className="space-y-3">
            {results.map((msg) => {
              let decryptedText = "[Encrypted message]";
              
              // Decrypt message asynchronously
              decryptText(msg.message, msg.iv)
                .then(text => {
                  decryptedText = text;
                })
                .catch(() => {
                  decryptedText = "[Unable to decrypt]";
                });

              return (
                <div
                  key={msg._id}
                  className="p-3 bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={msg.senderId?.avatar || "/default-avatar.png"}
                      alt={msg.senderId?.fullname}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {msg.senderId?.fullname || "Unknown"}
                        </span>
                        <span className="text-xs text-base-content/60">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-base-content/80 line-clamp-2">
                        {decryptedText}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="p-3 border-t border-base-300 text-center text-sm text-base-content/60">
            Found {results.length} message{results.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
