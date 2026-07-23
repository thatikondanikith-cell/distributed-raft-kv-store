import React, { useState } from "react";
import OperationSelector from "../components/dataOperations/OperationSelector";
import OperationForm from "../components/dataOperations/OperationForm";
import ResponseCard from "../components/dataOperations/ResponseCard";
import RecentOperations from "../components/dataOperations/RecentOperations";
import { putKeyValue, getKeyValue, deleteKeyValue } from "../services/api";

function DataOperations() {
  const [selectedOperation, setSelectedOperation] = useState("PUT");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [recentOperations, setRecentOperations] = useState([
    { operation: "GET", key: "cluster_name", status: "SUCCESS", time: "5 mins ago" },
    { operation: "PUT", key: "env", status: "SUCCESS", time: "12 mins ago" },
    { operation: "DELETE", key: "old_setting", status: "FAILURE", time: "18 mins ago" },
    { operation: "GET", key: "admin_user", status: "SUCCESS", time: "25 mins ago" },
  ]);

  const handleSelectOperation = (op) => {
    setSelectedOperation(op);
    // Clear response and inputs when switching tabs for a clean UI
    setResponse(null);
    setKey("");
    setValue("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResponse(null);

    let result;
    try {
      if (selectedOperation === "PUT") {
        await putKeyValue(key, value);
        result = {
          status: "SUCCESS",
          statusCode: 200,
          message: `Success: Key "${key}" successfully replicated and written via Raft consensus.`,
          key,
          value,
        };
      } else if (selectedOperation === "GET") {
        const res = await getKeyValue(key);
        result = res.found
          ? { status: "SUCCESS", statusCode: 200, message: `Success: Key "${key}" found in store.`, key, value: res.value }
          : { status: "FAILURE", statusCode: 404, message: `Error: Key "${key}" does not exist.`, key, value: null };
      } else if (selectedOperation === "DELETE") {
        const text = await deleteKeyValue(key);
        result = {
          status: "SUCCESS",
          statusCode: 200,
          message: text || `Success: Key "${key}" successfully scheduled for deletion via Raft.`,
          key,
          value: null,
        };
      }

      setResponse(result);

      // Add to recent operations history table
      setRecentOperations((prev) => [
        { operation: selectedOperation, key, status: result.status, time: "Just now" },
        ...prev,
      ].slice(0, 5));

      if (selectedOperation !== "PUT") setValue("");

    } catch (err) {
      const errorResult = {
        status: "FAILURE",
        statusCode: 503,
        message: `Error: Backend unreachable — ${err.message}. Make sure the Spring Boot server is running.`,
        key,
        value: null,
      };
      setResponse(errorResult);
      setRecentOperations((prev) => [
        { operation: selectedOperation, key, status: "FAILURE", time: "Just now" },
        ...prev,
      ].slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  const SectionLabel = ({ children }) => (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-1 h-5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
      <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider font-sans">
        {children}
      </h2>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-white/[0.03]">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Data Operations
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Execute key-value operations on the distributed store.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/5 border border-indigo-500/15 text-[10px] text-indigo-400 font-extrabold font-mono tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
          CRUD CONSOLE
        </div>
      </div>

      {/* Main Console Section */}
      <section className="flex flex-col gap-6">
        
        {/* Selector */}
        <div className="flex justify-center sm:justify-start">
          <OperationSelector
            selectedOperation={selectedOperation}
            onSelectOperation={handleSelectOperation}
          />
        </div>

        {/* Dynamic Input Form */}
        <div className="w-full">
          <OperationForm
            selectedOperation={selectedOperation}
            inputKey={key}
            inputValue={value}
            onKeyChange={setKey}
            onValueChange={setValue}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>

      </section>

      {/* Response Card Section */}
      <section>
        <SectionLabel>Response Output</SectionLabel>
        <ResponseCard response={response} />
      </section>

      {/* Recent Activity Section */}
      <section>
        <SectionLabel>Recent Operations Log</SectionLabel>
        <RecentOperations recentOperations={recentOperations} />
      </section>

    </div>
  );
}

export default DataOperations;
