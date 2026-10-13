// Errors the tools throw on purpose. ToolError becomes an MCP tool result with isError: true and a
// structured body the agent can act on; RpcError becomes a JSON-RPC protocol error.

export class ToolError extends Error {
  constructor(message, { code = 'tool_error', data = null } = {}) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.data = data;
  }
}

export class RpcError extends Error {
  constructor(code, message, data = null) {
    super(message);
    this.name = 'RpcError';
    this.code = code;
    this.data = data;
  }
}
