// Mock in-memory database
const mockDb = {
  "cluster_name": "Raft-KV-Store-Alpha",
  "replication_factor": "3",
  "admin_user": "nikith",
  "api_version": "v1.0.0",
  "env": "production"
};

// Simulate network latency (1000ms delay)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates writing a key-value pair to the cluster.
 */
export async function mockPut(key, value) {
  await delay(1000);
  
  if (!key) {
    return {
      status: "FAILURE",
      statusCode: 400,
      message: "Error: Key cannot be empty.",
      key: "",
      value: null
    };
  }

  mockDb[key] = value;
  
  return {
    status: "SUCCESS",
    statusCode: 200,
    message: `Success: Key "${key}" successfully replicated and written.`,
    key,
    value
  };
}

/**
 * Simulates retrieving a value by key.
 */
export async function mockGet(key) {
  await delay(1000);
  
  if (!key) {
    return {
      status: "FAILURE",
      statusCode: 400,
      message: "Error: Key cannot be empty.",
      key: "",
      value: null
    };
  }

  if (Object.prototype.hasOwnProperty.call(mockDb, key)) {
    return {
      status: "SUCCESS",
      statusCode: 200,
      message: `Success: Key "${key}" found in store.`,
      key,
      value: mockDb[key]
    };
  } else {
    return {
      status: "FAILURE",
      statusCode: 404,
      message: `Error: Key "${key}" does not exist.`,
      key,
      value: null
    };
  }
}

/**
 * Simulates deleting a key from the store.
 */
export async function mockDelete(key) {
  await delay(1000);
  
  if (!key) {
    return {
      status: "FAILURE",
      statusCode: 400,
      message: "Error: Key cannot be empty.",
      key: "",
      value: null
    };
  }

  if (Object.prototype.hasOwnProperty.call(mockDb, key)) {
    const oldValue = mockDb[key];
    delete mockDb[key];
    return {
      status: "SUCCESS",
      statusCode: 200,
      message: `Success: Key "${key}" successfully deleted from the store.`,
      key,
      value: oldValue
    };
  } else {
    return {
      status: "FAILURE",
      statusCode: 404,
      message: `Error: Key "${key}" not found (nothing to delete).`,
      key,
      value: null
    };
  }
}
