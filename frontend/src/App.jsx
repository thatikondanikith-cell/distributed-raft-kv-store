import { useState, useEffect, useCallback } from "react";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import DataOperations from "./pages/DataOperations";
import KeyValueStore from "./pages/KeyValueStore";
import Nodes from "./pages/Nodes";
import NodeDetails from "./pages/NodeDetails";
import FailureSimulation from "./pages/FailureSimulation";
import Login from "./pages/Login";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { fetchCluster, toggleNodeOnline, triggerElection, putKeyValue } from "./services/api";

const TOKEN_KEY = "raft_auth_token";

const mapBackendNodes = (backendNodes) => {
  if (!backendNodes) return [];
  return backendNodes.map((n) => {
    const idStr = n.nodeId.replace("Node-", "");
    const id = parseInt(idStr, 10) || 1;

    let role = "Follower";
    if (n.currentState === "LEADER") role = "Leader";
    else if (n.currentState === "CANDIDATE") role = "Candidate";

    return {
      id,
      nodeName: n.nodeId.replace("-", " "),
      role,
      status: n.online ? "Online" : "Offline",
      term: n.currentTerm,
      logIndex: n.lastLogIndex >= 0 ? n.lastLogIndex : 0,
      health: n.health !== undefined ? n.health : (n.online ? 100 : 0),
      communicationMap: n.communicationMap || {},
      logEntries: n.logEntries ? n.logEntries.map((le, idx) => {
        const index = (n.lastIncludedIndex !== undefined ? n.lastIncludedIndex : -1) + 1 + idx;
        return {
          index,
          term: le.term,
          key: le.key,
          value: le.value,
          command: le.value === "__DELETE__" ? "DELETE" : "PUT",
          status: index <= n.commitIndex ? "Committed" : "Replicated",
        };
      }) : [],
    };
  });
};

// ─── Authenticated shell ────────────────────────────────────────────────────
function AppContent({ onLogout }) {
  const location   = useLocation();
  const navigate   = useNavigate();

  const currentPage =
    location.pathname.startsWith("/nodes")            ? "Nodes" :
    location.pathname === "/data-operations"          ? "Data Operations" :
    location.pathname === "/key-value-store"          ? "Key-Value Store" :
    location.pathname === "/failure-simulation"       ? "Failure Simulation" :
                                                        "Dashboard";

  const setCurrentPage = (page) => {
    const paths = {
      Dashboard:            "/",
      Nodes:                "/nodes",
      "Data Operations":    "/data-operations",
      "Key-Value Store":    "/key-value-store",
      "Failure Simulation": "/failure-simulation",
    };
    navigate(paths[page] || "/");
  };

  const [nodes, setNodes] = useState([
    { id: 1, nodeName: "Node 1", role: "Leader",   status: "Online", term: 0, logIndex: 0, health: 100, communicationMap: {}, logEntries: [] },
    { id: 2, nodeName: "Node 2", role: "Follower", status: "Online", term: 0, logIndex: 0, health: 100, communicationMap: {}, logEntries: [] },
    { id: 3, nodeName: "Node 3", role: "Follower", status: "Online", term: 0, logIndex: 0, health: 100, communicationMap: {}, logEntries: [] },
  ]);

  const [activities, setActivities] = useState([
    { id: 1, type: "election", message: "Connecting to Raft Backend cluster...", time: "Just now" },
  ]);

  const [logHistory,   setLogHistory]   = useState([0, 0, 0, 0, 0, 0]);
  const [writingState, setWritingState] = useState({ active: false, key: "", val: "", stage: 0 });

  const logActivity = useCallback((type, message) => {
    setActivities((prev) => [
      { id: Date.now() + Math.random(), type, message, time: "Just now" },
      ...prev.slice(0, 15),
    ]);
  }, []);

  const refreshCluster = useCallback(async () => {
    try {
      const data = await fetchCluster();
      if (data && data.nodes) {
        const mapped = mapBackendNodes(data.nodes);
        setNodes((prevNodes) => {
          mapped.forEach(node => {
            const prev = prevNodes.find(pn => pn.id === node.id);
            if (prev) {
              if (prev.role   !== node.role)     logActivity("election", `${node.nodeName} → ${node.role} (Term ${node.term})`);
              if (prev.status !== node.status)   logActivity("sync",     `${node.nodeName} is now ${node.status.toUpperCase()}`);
              if (prev.logIndex !== node.logIndex) logActivity("commit", `${node.nodeName} log index → ${node.logIndex}`);
            }
          });
          return mapped;
        });
        const maxIdx = Math.max(...mapped.map(n => n.logIndex));
        setLogHistory(h => (!h.includes(maxIdx) && maxIdx > 0) ? [...h.slice(1), maxIdx] : h);
      }
    } catch (err) {
      // If 401 token expired — force logout
      if (err.message && err.message.includes("401")) onLogout();
      console.error("Cluster refresh error:", err);
    }
  }, [logActivity, onLogout]);

  useEffect(() => {
    refreshCluster();
    const interval = setInterval(refreshCluster, 1500);
    return () => clearInterval(interval);
  }, [refreshCluster]);

  const activeNodesCount = nodes.filter(n => n.status === "Online").length;
  const leaderNode       = nodes.find(n => n.role === "Leader" && n.status === "Online");
  const leaderName       = leaderNode ? leaderNode.nodeName : "None";

  const clusterHealth =
    activeNodesCount >= 3 ? "Healthy" :
    activeNodesCount === 2 ? "Degraded" : "Unhealthy";

  const handleToggleNode = useCallback(async (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const nextOnline   = node.status !== "Online";
    const backendNodeId = `Node-${nodeId}`;
    try {
      logActivity(!nextOnline ? "heartbeat" : "sync",
        `Setting ${node.nodeName} ${!nextOnline ? "Offline" : "Online"}...`);
      await toggleNodeOnline(backendNodeId, nextOnline);
      await refreshCluster();
    } catch (err) {
      logActivity("sync", `Failed to toggle Node ${nodeId}: ${err.message}`);
    }
  }, [nodes, logActivity, refreshCluster]);

  const handleForceElection = useCallback(async () => {
    const onlineNodes = nodes.filter(n => n.status === "Online");
    if (onlineNodes.length < 2) {
      logActivity("election", "Election failed: Quorum lost. Need at least 2 online nodes.");
      return;
    }
    const chosenNode   = onlineNodes[Math.floor(Math.random() * onlineNodes.length)];
    const backendNodeId = `Node-${chosenNode.id}`;
    try {
      logActivity("election", `Requesting ${chosenNode.nodeName} to initiate election...`);
      await triggerElection(backendNodeId);
      await refreshCluster();
    } catch (err) {
      logActivity("election", `Failed: ${err.message}`);
    }
  }, [nodes, logActivity, refreshCluster]);

  useEffect(() => {
    const interval = setInterval(() => {
      const activeLeader = nodes.find(n => n.role === "Leader" && n.status === "Online");
      if (activeLeader) logActivity("heartbeat", `Leader ${activeLeader.nodeName} broadcasting heartbeat.`);
    }, 10000);
    return () => clearInterval(interval);
  }, [nodes, logActivity]);

  const handleTriggerWrite = useCallback(async (key, value) => {
    const activeLeader = nodes.find(n => n.role === "Leader" && n.status === "Online");
    if (!activeLeader) { logActivity("sync", `Write PUT(${key}) failed: No active Leader.`); return false; }
    if (nodes.filter(n => n.status === "Online").length < 2) {
      logActivity("sync", `Write PUT(${key}) failed: Quorum lost.`); return false;
    }
    logActivity("sync", `Client PUT "${key}" → Leader (${activeLeader.nodeName}).`);
    setWritingState({ active: true, key, val: value, stage: 1 });
    setTimeout(() => {
      setWritingState(p => ({ ...p, stage: 2 }));
      setTimeout(async () => {
        try {
          await putKeyValue(key, value);
          logActivity("commit", `PUT(${key}=${value}) committed across majority.`);
          await refreshCluster();
        } catch (err) {
          logActivity("sync", `Write PUT(${key}) failed: ${err.message}`);
        } finally {
          setWritingState({ active: false, key: "", val: "", stage: 0 });
        }
      }, 1200);
    }, 800);
    return true;
  }, [nodes, logActivity, refreshCluster]);

  return (
    <MainLayout
      clusterHealth={clusterHealth}
      leaderName={leaderName}
      nodes={nodes}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onLogout={onLogout}
    >
      <Routes>
        <Route path="/"                    element={<Dashboard nodes={nodes} activities={activities} logHistory={logHistory} writingState={writingState} onToggleNode={handleToggleNode} onTriggerWrite={handleTriggerWrite} onForceElection={handleForceElection} />} />
        <Route path="/nodes"               element={<Nodes nodes={nodes} onToggleNode={handleToggleNode} />} />
        <Route path="/nodes/:id"           element={<NodeDetails nodes={nodes} />} />
        <Route path="/data-operations"     element={<DataOperations />} />
        <Route path="/key-value-store"     element={<KeyValueStore nodes={nodes} />} />
        <Route path="/failure-simulation"  element={<FailureSimulation nodes={nodes} onActivity={logActivity} />} />
        <Route path="*"                    element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}

// ─── Root with auth gate ────────────────────────────────────────────────────
function App() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  function handleLogin(email) {
    console.log(`[AUTH] Logged in as ${email}`);
    setAuthed(true);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("raft_email");
    localStorage.removeItem("raft_username");
    setAuthed(false);
  }

  return (
    <BrowserRouter>
      {authed
        ? <AppContent onLogout={handleLogout} />
        : <Login onLogin={handleLogin} />
      }
    </BrowserRouter>
  );
}

export default App;
