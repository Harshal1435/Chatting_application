import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Users, Wifi, UserCheck } from "lucide-react";
import UserItem from "./UserItem";
import useGetAllUsers from "../../../hooks/useGetAllUsers";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { useSocketContext } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthProvider";
import useConversation from "../../../store/useConversation";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_AVATAR =
  "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png";

// ── Filter chip definitions ───────────────────────────────────────────────────
const FILTERS = [
  { id: "all",     label: "All",     Icon: Users },
  { id: "online",  label: "Online",  Icon: Wifi },
  { id: "friends", label: "Friends", Icon: UserCheck },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function UserList() {
  const [allUsers, loading] = useGetAllUsers();
  const { onlineUsers }     = useSocketContext();
  const [authUser]          = useAuth();
  const currentUser         = authUser?.user;

  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("all");
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef   = useRef(null);
  const wrapperRef = useRef(null);

  // ── Friends = following ∪ followers ──────────────────────────────────────
  const friendIds = useMemo(() => {
    const following = (currentUser?.following || []).map((f) => f?._id ?? f);
    const followers = (currentUser?.followers || []).map((f) => f?._id ?? f);
    return new Set([...following, ...followers]);
  }, [currentUser]);

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    let list = allUsers;

    if (filter === "online")  list = list.filter((u) => onlineUsers.includes(u._id));
    if (filter === "friends") list = list.filter((u) => friendIds.has(u._id));

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.fullname?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    // Sort: online > friend > rest, then alphabetical within each tier
    return [...list].sort((a, b) => {
      const score = (u) =>
        (onlineUsers.includes(u._id) ? 2 : 0) + (friendIds.has(u._id) ? 1 : 0);
      const diff = score(b) - score(a);
      return diff !== 0 ? diff : (a.fullname || "").localeCompare(b.fullname || "");
    });
  }, [allUsers, search, filter, onlineUsers, friendIds]);

  // ── Dropdown suggestions (top 5 while typing) ────────────────────────────
  const suggestions = useMemo(
    () => (search.trim() ? filteredUsers.slice(0, 5) : []),
    [filteredUsers, search]
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onlineCount = allUsers.filter((u) => onlineUsers.includes(u._id)).length;
  const friendCount = allUsers.filter((u) => friendIds.has(u._id)).length;

  const clearSearch = () => {
    setSearch("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // ── Section label text ────────────────────────────────────────────────────
  const sectionLabel =
    filter === "online"  ? `Online · ${onlineCount}` :
    filter === "friends" ? `Friends · ${friendCount}` :
    `All · ${allUsers.length}`;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">

      {/* ── Search input + dropdown ─────────────────────────────────────── */}
      <div ref={wrapperRef} className="relative px-3 pt-2 pb-1">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2.5 gap-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <Search size={15} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search people…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => { if (search) setShowDropdown(true); }}
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                key="clear"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.1 }}
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {showDropdown && suggestions.length > 0 && (
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              className="absolute left-3 right-3 top-full mt-1 z-30 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Suggestions
              </p>
              {suggestions.map((user) => (
                <SuggestionRow
                  key={user._id}
                  user={user}
                  isOnline={onlineUsers.includes(user._id)}
                  isFriend={friendIds.has(user._id)}
                  onSelect={clearSearch}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Filter chips ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 px-3 py-2 overflow-x-auto">
        {FILTERS.map(({ id, label, Icon }) => {
          const count =
            id === "online"  ? onlineCount :
            id === "friends" ? friendCount :
            allUsers.length;
          const active = filter === id;

          return (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                active
                  ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Icon size={12} />
              {label}
              {count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Section label ────────────────────────────────────────────────── */}
      {!search && filteredUsers.length > 0 && (
        <div className="px-4 pb-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {sectionLabel}
          </p>
        </div>
      )}

      {/* ── List ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="medium" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            search={search}
            filter={filter}
            onClear={clearSearch}
            onResetFilter={() => setFilter("all")}
          />
        ) : (
          filteredUsers.map((user) => (
            <UserItem
              key={user._id}
              user={user}
              isFriend={friendIds.has(user._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Suggestion dropdown row ───────────────────────────────────────────────────
function SuggestionRow({ user, isOnline, isFriend, onSelect }) {
  const { setSelectedConversation } = useConversation();

  return (
    <button
      onClick={() => { setSelectedConversation(user); onSelect(); }}
      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={user.avatar || DEFAULT_AVATAR}
          alt={user.fullname}
          className="w-9 h-9 rounded-full object-cover"
          onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.fullname}
          </span>
          {isFriend && (
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
              Friend
            </span>
          )}
          {isOnline && (
            <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
              Online
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
          {user.email}
        </p>
      </div>
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ search, filter, onClear, onResetFilter }) {
  if (search) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
          <Search size={22} className="text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          No results for "{search}"
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Try a different name or email
        </p>
        <button
          onClick={onClear}
          className="mt-3 text-xs text-blue-500 hover:text-blue-600 font-medium"
        >
          Clear search
        </button>
      </div>
    );
  }

  if (filter === "online") {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
        <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
          <Wifi size={22} className="text-green-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          No one online right now
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Check back later</p>
        <button
          onClick={onResetFilter}
          className="mt-3 text-xs text-blue-500 hover:text-blue-600 font-medium"
        >
          Show all people
        </button>
      </div>
    );
  }

  if (filter === "friends") {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-3">
          <UserCheck size={22} className="text-blue-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          No friends yet
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Follow people to see them here
        </p>
        <button
          onClick={onResetFilter}
          className="mt-3 text-xs text-blue-500 hover:text-blue-600 font-medium"
        >
          Show all people
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
        <Users size={22} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No people found</p>
    </div>
  );
}
