import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import DataOperations from "./pages/DataOperations";
import KeyValueStore from "./pages/KeyValueStore";

function App() {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [nodes, setNodes] = useState([
    { id: 1, nodeName: "Node 1", role: "Leader", status: "Online", term: 18, logIndex: 584 },
    { id: 2, nodeName: "Node 2", role: "Follower", status: "Online", term: 18, logIndex: 584 },
    { id: 3, nodeName: "Node 3", role: "Follower", status: "Online", term: 18, logIndex: 584 },
  ]);

  const [activities, setActivities] = useState([
    { id: 1, type: "election", message: "Node 1 elected as Leader for term 18", time: "2 mins ago" },
    { id: 2, type: "commit", message: "Log entry committed at index 584", time: "5 mins ago" },
    { id: 3, type: "heartbeat", message: "Leader heartbeat sent to all followers", time: "8 mins ago" },
    { id: 4, type: "sync", message: "Node 3 synced log entries up to index 584", time: "12 mins ago" },
    { id: 5, type: "sync", message: "Node 2 synced log entries up to index 584", time: "14 mins ago" },
  ]);

  const [logHistory, setLogHistory] = useState([578, 579, 580, 581, 583, 584]);

  // Track client write animations (stage: 0 = idle, 1 = client-to-leader, 2 = leader-to-followers)
  const [writingState, setWritingState] = useState({ active: false, key: "", val: "", stage: 0 });

  // Helper to log console activities
  const logActivity = useCallback((type, message) => {
    setActivities((prev) => [
      {
        id: Date.now() + Math.random(),
        type,
        message,
        time: "Just now",
      },
      ...prev.slice(0, 15),
    ]);
  }, []);

  // Compute cluster status
  const activeNodesCount = nodes.filter((n) => n.status === "Online").length;
  const leaderNode = nodes.find((n) => n.role === "Leader" && n.status === "Online");
  const leaderName = leaderNode ? leaderNode.nodeName : "None";

  let clusterHealth = "Healthy";
  if (activeNodesCount === 2) {
    clusterHealth = "Degraded";
  } else if (activeNodesCount < 2) {
    clusterHealth = "Unhealthy";
  }

  // Handle Crash/Recover Node Toggle
  const handleToggleNode = useCallback((nodeId) => {
    setNodes((prevNodes) => {
      // Flag to see if the crashed node was the leader
      let leaderCrashed = false;

      const updated = prevNodes.map((n) => {
        if (n.id === nodeId) {
          const isGoingOffline = n.status === "Online";
          const newStatus = isGoingOffline ? "Offline" : "Online";
          
          if (isGoingOffline && n.role === "Leader") {
            leaderCrashed = true;
          }

          logActivity(
            isGoingOffline ? "heartbeat" : "sync",
            `${n.nodeName} has ${isGoingOffline ? "crashed (offline)" : "recovered (online)"}.`
          );

          return { 
            ...n, 
            status: newStatus, 
            role: "Follower" // reset to follower on any transition to keep things simple
          };
        }
        return n;
      });

      // If leader crashed, make sure it is follower in the output
      if (leaderCrashed) {
        return updated.map(n => n.id === nodeId ? { ...n, role: "Follower" } : n);
      }
      return updated;
    });
  }, [logActivity]);

  // Handle Force Election
  const handleForceElection = useCallback(() => {
    const onlineNodes = nodes.filter((n) => n.status === "Online");
    if (onlineNodes.length < 2) {
      logActivity("election", "Election failed: Quorum lost. Need at least 2 online nodes.");
      return;
    }

    const randomIndex = Math.floor(Math.random() * onlineNodes.length);
    const chosenNode = onlineNodes[randomIndex];

    setNodes((prev) => {
      const nextTerm = Math.max(...prev.map((n) => n.term)) + 1;
      logActivity("election", `Manual trigger: ${chosenNode.nodeName} initiated election and became Leader for term ${nextTerm}.`);

      return prev.map((n) => {
        if (n.status === "Online") {
          return {
            ...n,
            role: n.id === chosenNode.id ? "Leader" : "Follower",
            term: nextTerm,
          };
        } else {
          return { ...n, role: "Follower" };
        }
      });
    });
  }, [nodes, logActivity]);

  // Auto Election Timeout (if Leader is offline, followers promote a new one after 2.5s)
  useEffect(() => {
    const hasLeader = nodes.some((n) => n.role === "Leader" && n.status === "Online");
    const onlineCount = nodes.filter((n) => n.status === "Online").length;

    if (!hasLeader && onlineCount >= 2) {
      const timer = setTimeout(() => {
        setNodes((currentNodes) => {
          const stillNoLeader = !currentNodes.some((n) => n.role === "Leader" && n.status === "Online");
          const stillQuorum = currentNodes.filter((n) => n.status === "Online").length >= 2;

          if (stillNoLeader && stillQuorum) {
            const online = currentNodes.filter((n) => n.status === "Online");
            const winner = online[Math.floor(Math.random() * online.length)];
            const nextTerm = Math.max(...currentNodes.map((n) => n.term)) + 1;

            logActivity("election", `Election timeout! ${winner.nodeName} won candidate promotion for term ${nextTerm}.`);

            return currentNodes.map((n) => {
              if (n.status === "Online") {
                return {
                  ...n,
                  role: n.id === winner.id ? "Leader" : "Follower",
                  term: nextTerm,
                };
              }
              return { ...n, role: "Follower" };
            });
          }
          return currentNodes;
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [nodes, logActivity]);

  // Periodic visual heartbeat logger
  useEffect(() => {
    const interval = setInterval(() => {
      const activeLeader = nodes.find((n) => n.role === "Leader" && n.status === "Online");
      if (activeLeader) {
        logActivity("heartbeat", `Leader ${activeLeader.nodeName} broadcasting heartbeat ping.`);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [nodes, logActivity]);

  // Client Write PUT Simulation (replicates across cluster)
  const handleTriggerWrite = useCallback((key, value) => {
    const activeLeader = nodes.find((n) => n.role === "Leader" && n.status === "Online");
    if (!activeLeader) {
      logActivity("sync", `Write PUT(${key}=${value}) failed: No active Leader to write to.`);
      return false;
    }

    const onlineNodes = nodes.filter((n) => n.status === "Online");
    if (onlineNodes.length < 2) {
      logActivity("sync", `Write PUT(${key}=${value}) failed: Write blocked due to Quorum loss.`);
      return false;
    }

    logActivity("sync", `Client PUT request for Key "${key}" sent to Leader (${activeLeader.nodeName}).`);
    setWritingState({ active: true, key, val: value, stage: 1 });

    // Step 1: Leader appends locally
    setTimeout(() => {
      setNodes((prevNodes) => {
        // Ensure leader is still online before appending
        const leaderStillAlive = prevNodes.find((n) => n.id === activeLeader.id && n.status === "Online" && n.role === "Leader");
        if (!leaderStillAlive) {
          logActivity("sync", "Write failed: Leader crashed during replication process.");
          setWritingState({ active: false, key: "", val: "", stage: 0 });
          return prevNodes;
        }

        const nextIndex = Math.max(...prevNodes.map(n => n.logIndex)) + 1;
        logActivity("sync", `Leader appended entry at index ${nextIndex}. Initiating cluster replication...`);
        setWritingState(prev => ({ ...prev, stage: 2 }));

        // Step 2: Replicate to Followers
        setTimeout(() => {
          setNodes((currentNodes) => {
            const currentLeader = currentNodes.find((n) => n.id === activeLeader.id && n.status === "Online" && n.role === "Leader");
            if (!currentLeader) {
              logActivity("sync", "Write failed: Leader crashed before commits could resolve.");
              setWritingState({ active: false, key: "", val: "", stage: 0 });
              return currentNodes;
            }

            const updatedNodes = currentNodes.map((n) => {
              if (n.status === "Online") {
                return { ...n, logIndex: nextIndex };
              }
              return n;
            });

            // Step 3: Quorum check
            const onlineCount = updatedNodes.filter(n => n.status === "Online" && n.logIndex === nextIndex).length;
            if (onlineCount >= 2) {
              logActivity("commit", `Log index ${nextIndex} committed by majority quorum (${onlineCount}/3 nodes).`);
              setLogHistory((history) => [...history.slice(1), nextIndex]);
            } else {
              logActivity("sync", "Write failed: Quorum lost during follower synchronization.");
            }

            setWritingState({ active: false, key: "", val: "", stage: 0 });
            return updatedNodes;
          });
        }, 1200);

        return prevNodes.map(n => n.id === activeLeader.id ? { ...n, logIndex: nextIndex } : n);
      });
    }, 800);

    return true;
  }, [nodes, logActivity]);

  return (
    <MainLayout 
      clusterHealth={clusterHealth} 
      leaderName={leaderName}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    >
      {currentPage === "Dashboard" && (
        <Dashboard
          nodes={nodes}
          activities={activities}
          logHistory={logHistory}
          writingState={writingState}
          onToggleNode={handleToggleNode}
          onTriggerWrite={handleTriggerWrite}
          onForceElection={handleForceElection}
        />
      )}
      {currentPage === "Data Operations" && (
        <DataOperations />
      )}
      {currentPage === "Key-Value Store" && (
        <KeyValueStore />
      )}
      {currentPage !== "Dashboard" && currentPage !== "Data Operations" && currentPage !== "Key-Value Store" && (
        <div className="glass-card rounded-2xl p-8 max-w-lg mx-auto mt-12 text-center border border-white/5">
          <h2 className="text-xl font-bold text-slate-200 mb-2">Feature Under Development</h2>
          <p className="text-slate-400 text-xs">
            The "{currentPage}" panel is currently under development. Please check back later.
          </p>
        </div>
      )}
    </MainLayout>
  );
}

export default App;