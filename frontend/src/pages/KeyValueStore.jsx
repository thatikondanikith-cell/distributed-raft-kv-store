import React, { useState, useEffect, useMemo } from "react";
import SearchToolbar from "../components/keyValueStore/SearchToolbar";
import KeyValueTable from "../components/keyValueStore/KeyValueTable";
import KeyDetailsDrawer from "../components/keyValueStore/KeyDetailsDrawer";
import EmptyState from "../components/keyValueStore/EmptyState";
import Pagination from "../components/keyValueStore/Pagination";

const INITIAL_MOCK_KEYS = [
  {
    key: "user1",
    value: "John",
    version: "v3",
    leader: "Node 1",
    ttl: "42s",
    ttlType: "ttl",
    ttlSecondsRemaining: 42,
    ttlTotalSeconds: 60,
    lastUpdated: "10:31:25",
    createdAt: "10:25:00",
    logIndex: 584,
    replication: { "Node 1": true, "Node 2": true, "Node 3": true, "Node 4": true, "Node 5": false },
    history: [
      { version: "v1", logIndex: 512, op: "SET user1 = Alex", time: "10:25:00", value: "Alex" },
      { version: "v2", logIndex: 550, op: "SET user1 = Bob", time: "10:28:12", value: "Bob" },
      { version: "v3", logIndex: 584, op: "SET user1 = John", time: "10:31:25", value: "John" }
    ]
  },
  {
    key: "token45",
    value: "abc123789xyz_session_hash_payload",
    version: "v1",
    leader: "Node 1",
    ttl: "Permanent",
    ttlType: "permanent",
    lastUpdated: "10:29:15",
    createdAt: "10:29:15",
    logIndex: 581,
    replication: { "Node 1": true, "Node 2": true, "Node 3": false, "Node 4": false, "Node 5": false },
    history: [
      { version: "v1", logIndex: 581, op: "SET token45 = abc123789xyz_session_hash_payload", time: "10:29:15", value: "abc123789xyz_session_hash_payload" }
    ]
  },
  {
    key: "session12",
    value: "active",
    version: "v2",
    leader: "Node 2",
    ttl: "120s",
    ttlType: "ttl",
    ttlSecondsRemaining: 120,
    ttlTotalSeconds: 180,
    lastUpdated: "10:28:11",
    createdAt: "10:26:00",
    logIndex: 580,
    replication: { "Node 1": true, "Node 2": true, "Node 3": true, "Node 4": true, "Node 5": true },
    history: [
      { version: "v1", logIndex: 562, op: "SET session12 = idle", time: "10:26:00", value: "idle" },
      { version: "v2", logIndex: 580, op: "SET session12 = active", time: "10:28:11", value: "active" }
    ]
  },
  {
    key: "settings",
    value: "dark",
    version: "v5",
    leader: "Node 1",
    ttl: "Permanent",
    ttlType: "permanent",
    lastUpdated: "10:20:00",
    createdAt: "10:05:00",
    logIndex: 574,
    replication: { "Node 1": true, "Node 2": true, "Node 3": true, "Node 4": true, "Node 5": true },
    history: [
      { version: "v1", logIndex: 400, op: "SET settings = light", time: "10:05:00", value: "light" },
      { version: "v2", logIndex: 450, op: "SET settings = dark", time: "10:08:00", value: "dark" },
      { version: "v3", logIndex: 490, op: "SET settings = auto", time: "10:12:00", value: "auto" },
      { version: "v4", logIndex: 530, op: "SET settings = light", time: "10:16:00", value: "light" },
      { version: "v5", logIndex: 574, op: "SET settings = dark", time: "10:20:00", value: "dark" }
    ]
  },
  {
    key: "temp_cache",
    value: "expired_payload_data_v1",
    version: "v1",
    leader: "Node 3",
    ttl: "Expired",
    ttlType: "expired",
    lastUpdated: "10:15:30",
    createdAt: "10:10:30",
    logIndex: 568,
    replication: { "Node 1": true, "Node 2": false, "Node 3": true, "Node 4": false, "Node 5": false },
    history: [
      { version: "v1", logIndex: 568, op: "SET temp_cache = expired_payload_data_v1", time: "10:10:30", value: "expired_payload_data_v1" }
    ]
  },
  {
    key: "db_version",
    value: "1.4.2",
    version: "v2",
    leader: "Node 2",
    ttl: "Permanent",
    ttlType: "permanent",
    lastUpdated: "09:45:00",
    createdAt: "09:00:00",
    logIndex: 510,
    replication: { "Node 1": true, "Node 2": true, "Node 3": true, "Node 4": true, "Node 5": true },
    history: [
      { version: "v1", logIndex: 310, op: "SET db_version = 1.4.1", time: "09:00:00", value: "1.4.1" },
      { version: "v2", logIndex: 510, op: "SET db_version = 1.4.2", time: "09:45:00", value: "1.4.2" }
    ]
  },
  {
    key: "api_key_sec",
    value: "sk_live_51M3nB7t8o90PqWs",
    version: "v1",
    leader: "Node 1",
    ttl: "Permanent",
    ttlType: "permanent",
    lastUpdated: "10:00:15",
    createdAt: "10:00:15",
    logIndex: 554,
    replication: { "Node 1": true, "Node 2": true, "Node 3": true, "Node 4": false, "Node 5": false },
    history: [
      { version: "v1", logIndex: 554, op: "SET api_key_sec = sk_live_51M3nB7t8o90PqWs", time: "10:00:15", value: "sk_live_51M3nB7t8o90PqWs" }
    ]
  },
  {
    key: "feature_flag_multi",
    value: "enabled",
    version: "v3",
    leader: "Node 1",
    ttl: "Permanent",
    ttlType: "permanent",
    lastUpdated: "10:18:45",
    createdAt: "10:10:00",
    logIndex: 572,
    replication: { "Node 1": true, "Node 2": true, "Node 3": true, "Node 4": true, "Node 5": true },
    history: [
      { version: "v1", logIndex: 540, op: "SET feature_flag_multi = disabled", time: "10:10:00", value: "disabled" },
      { version: "v2", logIndex: 558, op: "SET feature_flag_multi = partial", time: "10:14:20", value: "partial" },
      { version: "v3", logIndex: 572, op: "SET feature_flag_multi = enabled", time: "10:18:45", value: "enabled" }
    ]
  },
  {
    key: "analytics_batch",
    value: "batch_4892_metrics",
    version: "v1",
    leader: "Node 3",
    ttl: "15s",
    ttlType: "ttl",
    ttlSecondsRemaining: 15,
    ttlTotalSeconds: 30,
    lastUpdated: "10:31:02",
    createdAt: "10:31:02",
    logIndex: 583,
    replication: { "Node 1": true, "Node 2": true, "Node 3": true, "Node 4": true, "Node 5": false },
    history: [
      { version: "v1", logIndex: 583, op: "SET analytics_batch = batch_4892_metrics", time: "10:31:02", value: "batch_4892_metrics" }
    ]
  },
  {
    key: "auth_retry_count",
    value: "3",
    version: "v4",
    leader: "Node 2",
    ttl: "8s",
    ttlType: "ttl",
    ttlSecondsRemaining: 8,
    ttlTotalSeconds: 20,
    lastUpdated: "10:31:19",
    createdAt: "10:31:00",
    logIndex: 582,
    replication: { "Node 1": true, "Node 2": true, "Node 3": false, "Node 4": false, "Node 5": false },
    history: [
      { version: "v1", logIndex: 577, op: "SET auth_retry_count = 0", time: "10:31:00", value: "0" },
      { version: "v2", logIndex: 578, op: "SET auth_retry_count = 1", time: "10:31:05", value: "1" },
      { version: "v3", logIndex: 579, op: "SET auth_retry_count = 2", time: "10:31:10", value: "2" },
      { version: "v4", logIndex: 582, op: "SET auth_retry_count = 3", time: "10:31:19", value: "3" }
    ]
  },
  {
    key: "garbage_collect_trigger",
    value: "done",
    version: "v1",
    leader: "Node 1",
    ttl: "Expired",
    ttlType: "expired",
    lastUpdated: "10:02:11",
    createdAt: "09:57:11",
    logIndex: 556,
    replication: { "Node 1": true, "Node 2": true, "Node 3": true, "Node 4": true, "Node 5": true },
    history: [
      { version: "v1", logIndex: 556, op: "SET garbage_collect_trigger = done", time: "09:57:11", value: "done" }
    ]
  }
];

const getItemsPerPage = () => {
  if (typeof window === "undefined") return 7;
  return Math.max(5, Math.min(9, Math.floor((window.innerHeight - 330) / 76)));
};

function KeyValueStore() {
  const [dbKeys, setDbKeys] = useState(INITIAL_MOCK_KEYS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKeyName, setSelectedKeyName] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage);

  useEffect(() => {
    const updatePageSize = () => setItemsPerPage(getItemsPerPage());
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  // Live real-time TTL decrement countdown logic
  useEffect(() => {
    const timer = setInterval(() => {
      setDbKeys((prevKeys) =>
        prevKeys.map((item) => {
          if (item.ttlType === "ttl") {
            const nextRemaining = item.ttlSecondsRemaining - 1;
            if (nextRemaining <= 0) {
              const expireTime = new Date().toLocaleTimeString([], { hour12: false });
              return {
                ...item,
                ttlType: "expired",
                ttl: "Expired",
                ttlSecondsRemaining: 0,
                lastUpdated: expireTime,
                history: [
                  ...item.history,
                  {
                    version: `v${item.history.length + 1}`,
                    logIndex: item.logIndex + 1,
                    op: `EXPIRE KEY "${item.key}"`,
                    time: expireTime,
                    value: item.value,
                  },
                ],
              };
            } else {
              return {
                ...item,
                ttlSecondsRemaining: nextRemaining,
                ttl: `${nextRemaining}s`,
              };
            }
          }
          return item;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter keys based on Search and Tabs
  const filteredKeys = useMemo(() => {
    return dbKeys.filter((item) => {
      const matchesSearch = item.key.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeFilter === "All") return matchesSearch;
      if (activeFilter === "Permanent") return matchesSearch && item.ttlType === "permanent";
      if (activeFilter === "TTL") return matchesSearch && item.ttlType === "ttl";
      if (activeFilter === "Expired") return matchesSearch && item.ttlType === "expired";
      
      return matchesSearch;
    });
  }, [dbKeys, searchQuery, activeFilter]);

  // Reset pagination on search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  // Pagination bounds calculation
  const totalPages = Math.ceil(filteredKeys.length / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedKeys = useMemo(() => {
    return filteredKeys.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredKeys, startIndex, itemsPerPage]);

  // Retrieve current selected key details live (to reflect real-time counts)
  const selectedKeyData = useMemo(() => {
    if (!selectedKeyName) return null;
    return dbKeys.find((k) => k.key === selectedKeyName) || null;
  }, [dbKeys, selectedKeyName]);

  const handleRowClick = (item) => {
    setSelectedKeyName(item.key);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  // Simulates refreshing database state from cluster leader
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Restore initial database keys (resets expired/ticking items for demo convenience)
      setDbKeys(INITIAL_MOCK_KEYS.map(k => ({
        ...k,
        // Make copies of deep nested history arrays to avoid reference mutations
        history: [...k.history]
      })));
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="w-full max-w-[1540px] mx-auto min-h-full flex flex-col gap-6 select-none">
      
      {/* 1. Page Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-white/[0.03]">
        <div>
          <h1 className="text-[30px] font-extrabold text-slate-100 tracking-tight">
            Key-Value Store
          </h1>
          <p className="mt-2 text-[15px] text-slate-500">
            Browse and inspect all key-value pairs currently stored in the distributed cluster.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-[#0d162c] border border-indigo-500/15 text-[11px] text-indigo-400 font-extrabold font-mono tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.05)]">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
          DATABASE STATE
        </div>
      </div>

      {/* 2. Top Toolbar */}
      <SearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 3. Main Data Container */}
      <div className="flex flex-1 min-h-[440px] flex-col">
        {filteredKeys.length === 0 ? (
          <EmptyState searchQuery={searchQuery} activeFilter={activeFilter} />
        ) : (
          <div className="glass-card flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.04] shadow-[0_12px_36px_rgba(0,0,0,0.32)]">
            <KeyValueTable
              keys={paginatedKeys}
              onRowClick={handleRowClick}
              selectedRowKey={selectedKeyName}
            />
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              startIndex={startIndex}
              endIndex={startIndex + itemsPerPage}
              totalItems={filteredKeys.length}
            />
          </div>
        )}
      </div>

      {/* 4. Details Slide-over Drawer Panel */}
      <KeyDetailsDrawer
        isOpen={drawerOpen}
        keyData={selectedKeyData}
        onClose={handleCloseDrawer}
      />
      
    </div>
  );
}

export default KeyValueStore;
