// Service to communicate with the Spring Boot Raft Backend
// All protected endpoints automatically attach the stored JWT token.

const TOKEN_KEY = 'raft_auth_token';

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function sendOtp(email) {
  const response = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to send OTP');
  }
  return response.json();
}

export async function verifyOtp(email, otp) {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'OTP verification failed');
  return data; // { token, email }
}

// ─── Cluster ─────────────────────────────────────────────────────────────────

export async function fetchCluster() {
  const response = await fetch('/api/raft/cluster', { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch cluster state');
  return response.json();
}

export async function toggleNodeOnline(nodeId, online) {
  const endpoint = online ? `/api/raft/online/${nodeId}` : `/api/raft/offline/${nodeId}`;
  const response = await fetch(endpoint, { method: 'POST', headers: getAuthHeaders() });
  if (!response.ok) throw new Error(`Failed to toggle node online status for ${nodeId}`);
  return response.text();
}

export async function triggerElection(nodeId) {
  const response = await fetch(`/api/raft/election/${nodeId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to trigger election for ${nodeId}`);
  return response.text();
}

// ─── Network Partition ───────────────────────────────────────────────────────

export async function createPartition(nodeA, nodeB) {
  const response = await fetch(`/api/raft/partition/${nodeA}/${nodeB}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to create partition between ${nodeA} and ${nodeB}`);
  return response.text();
}

export async function healPartition(nodeA, nodeB) {
  const response = await fetch(`/api/raft/heal/${nodeA}/${nodeB}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to heal partition between ${nodeA} and ${nodeB}`);
  return response.text();
}

// ─── Key-Value ───────────────────────────────────────────────────────────────

export async function listKeyValues() {
  const response = await fetch('/api/kv/list', { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to list key-values');
  return response.json();
}

export async function putKeyValue(key, value) {
  const response = await fetch('/api/kv/put', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ key, value }),
  });
  if (!response.ok) throw new Error('Failed to put key-value entry');
  return response.text();
}

export async function getKeyValue(key) {
  const response = await fetch(`/api/raft/get/${key}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error(`Failed to get key: ${key}`);
  const text = await response.text();
  if (text === 'Key not found') return { found: false, value: null };
  return { found: true, value: text };
}

export async function deleteKeyValue(key) {
  const response = await fetch(`/api/raft/delete/${key}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to delete key: ${key}`);
  return response.text();
}
