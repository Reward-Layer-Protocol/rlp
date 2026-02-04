/**
 * RLP Specification - TypeScript Schema
 *
 * NORMATIVE SOURCE - This TypeScript file is the authoritative definition
 * of RLP data types. JSON Schemas in /schemas are derived from this source.
 *
 * @version 1.2
 * @see https://github.com/Reward-Layer-Protocol/rlp
 */

// =============================================================================
// CORE DATA TYPES
// =============================================================================

/**
 * Reward offered for completing a task.
 */
export interface Reward {
  /**
   * Reward amount as a decimal string.
   * String format preserves precision for financial values.
   * @example "1.00", "0.50", "100"
   */
  amount: string;

  /**
   * Currency or token identifier.
   * Implementation-defined; common values include "USD", "USDC", "ETH".
   * @example "USD", "USDC", "CREDITS"
   */
  unit: string;
}

/**
 * A unit of work that an agent can complete for a reward.
 */
export interface Task {
  /**
   * Unique identifier for the task.
   * UUID v4 is RECOMMENDED but not required.
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id: string;

  /**
   * Human and AI readable description of what the agent should do.
   * This is the primary field agents use to understand and complete the task.
   * MUST be 1-5000 characters.
   */
  description: string;

  /**
   * Criteria used to verify if the agent's output satisfies the task.
   *
   * SECURITY: This field MUST NOT be exposed to agents in GetManifest or GetTask
   * responses. Exposing verification criteria allows agents to game the system.
   * This field is used only server-side during SubmitClaim verification.
   *
   * Content is implementation-defined (natural language, regex, schema, etc.)
   */
  verificationProcess: string;

  /**
   * Optional URL providing context for the task.
   * Agents MAY visit this URL to gather information needed to complete the task.
   * @example "https://docs.example.com/api-reference"
   */
  targetUrl?: string;

  /**
   * The reward offered for completing the task.
   */
  reward: Reward;

  /**
   * ISO 8601 timestamp after which the task is no longer valid.
   * Claims submitted after expiration SHOULD be rejected.
   * @example "2026-02-01T00:00:00Z"
   */
  expiresAt?: string;

  /**
   * HTTPS URL where agents POST their completed work.
   * MUST be an HTTPS URL.
   */
  claimUrl: string;
}

/**
 * Instructions for how agents should submit claims.
 * This provides self-documenting API guidance within the manifest.
 */
export interface ClaimInstructions {
  /**
   * HTTP method for claim submission. Always "POST".
   */
  method: "POST";

  /**
   * Content-Type header for claim requests. Always "application/json".
   */
  contentType: "application/json";

  /**
   * Human-readable descriptions of the request body fields.
   */
  bodySchema: {
    /**
     * Description of the output field.
     */
    output: string;

    /**
     * Description of the agentId field.
     */
    agentId: string;
  };
}

/**
 * Manifest describing available tasks.
 * Served at /.well-known/agent-reward.json or via HTML link tag.
 */
export interface Manifest {
  /**
   * Protocol version. MUST be a semver-compatible string.
   * @example "1.1"
   */
  version: string;

  /**
   * URL identifying the manifest issuer.
   * MUST be an HTTPS URL.
   * @example "https://example.com"
   */
  issuer: string;

  /**
   * Available tasks. MAY be empty if no tasks are currently available.
   */
  tasks: Task[];

  /**
   * Optional instructions for submitting claims.
   * Helps agents understand the claim API without external documentation.
   */
  claimInstructions?: ClaimInstructions;
}

// =============================================================================
// CLAIM OPERATIONS
// =============================================================================

/**
 * Request body for submitting a claim.
 * Agents POST this to a task's claimUrl.
 */
export interface ClaimRequest {
  /**
   * The agent's completed work that satisfies the task description.
   * Content and format depend on the task requirements.
   */
  output: string;

  /**
   * Agent authentication credential.
   * Format is implementation-defined; may be an API key, JWT, or agent card URL.
   * @example "agent-xyz-credential"
   */
  agentId: string;
}

/**
 * Status of a claim submission.
 */
export type ClaimStatus = "success" | "failed" | "pending" | "error";

/**
 * Response from a claim submission.
 */
export interface ClaimResponse {
  /**
   * Result of the claim.
   * - "success": Output accepted, reward granted
   * - "failed": Output did not satisfy task requirements
   * - "pending": Claim is being processed (async verification)
   * - "error": Server error occurred
   */
  status: ClaimStatus;

  /**
   * Human-readable explanation of the result.
   * SHOULD be provided for "failed" and "error" statuses.
   */
  message?: string;

  /**
   * Reward granted. Present when status is "success".
   * Amount may differ from task.reward if partial credit is given.
   */
  reward?: Reward;

  /**
   * Unique identifier for this claim.
   * Used for GetClaimStatus operation when status is "pending".
   * @example "claim-abc123"
   */
  claimId?: string;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * RLP-specific error codes.
 * These supplement HTTP status codes with semantic meaning.
 */
export enum RlpErrorCode {
  // Claim Errors (1xxx)
  /** Output does not satisfy task requirements */
  CLAIM_INVALID_OUTPUT = 1001,
  /** Task already claimed by this agent */
  CLAIM_ALREADY_COMPLETED = 1002,
  /** Task has expired */
  CLAIM_EXPIRED = 1003,
  /** Too many claims from this agent */
  CLAIM_RATE_LIMITED = 1004,
  /** Output format is invalid */
  CLAIM_INVALID_FORMAT = 1005,

  // Task Errors (2xxx)
  /** Task not found */
  TASK_NOT_FOUND = 2001,
  /** Task is no longer available */
  TASK_UNAVAILABLE = 2002,
  /** Task is paused */
  TASK_PAUSED = 2003,

  // Agent Errors (3xxx)
  /** Invalid or missing agent credentials */
  AGENT_INVALID_CREDENTIALS = 3001,
  /** Agent is suspended */
  AGENT_SUSPENDED = 3002,
  /** Agent not authorized for this task */
  AGENT_NOT_AUTHORIZED = 3003,

  // Server Errors (5xxx)
  /** Internal server error */
  SERVER_ERROR = 5001,
  /** Verification service unavailable */
  VERIFICATION_UNAVAILABLE = 5002,
}

/**
 * Structured error response.
 */
export interface RlpError {
  /**
   * RLP-specific error code.
   */
  code: RlpErrorCode;

  /**
   * Human-readable error message.
   */
  message: string;

  /**
   * Optional additional details about the error.
   */
  details?: Record<string, unknown>;
}

// =============================================================================
// PROTOCOL OPERATIONS
// =============================================================================

/**
 * GetManifest operation.
 * Retrieves the task manifest from a reward layer.
 *
 * HTTP Binding:
 *   GET /.well-known/agent-reward.json
 *
 * Response: Manifest
 */
export type GetManifestResponse = Manifest;

/**
 * GetTask operation.
 * Retrieves a single task by ID.
 *
 * HTTP Binding:
 *   GET /tasks/{taskId}
 *
 * Response: Task or RlpError (404 if not found)
 */
export type GetTaskResponse = Task | RlpError;

/**
 * SubmitClaim operation.
 * Submits completed work for a task.
 *
 * HTTP Binding:
 *   POST {task.claimUrl}
 *   Body: ClaimRequest
 *
 * Response: ClaimResponse
 */
export type SubmitClaimRequest = ClaimRequest;
export type SubmitClaimResponse = ClaimResponse;

/**
 * GetClaimStatus operation.
 * Checks the status of a pending claim.
 *
 * HTTP Binding:
 *   GET /claims/{claimId}
 *
 * Response: ClaimResponse or RlpError (404 if not found)
 */
export type GetClaimStatusResponse = ClaimResponse | RlpError;

// =============================================================================
// EXTENSION FRAMEWORK
// =============================================================================

/**
 * Extension declaration.
 * Allows manifests to declare support for protocol extensions.
 */
export interface Extension {
  /**
   * Unique URI identifying the extension.
   * @example "urn:rlp:extension:x402-settlement:v1"
   */
  uri: string;

  /**
   * Extension-specific configuration.
   */
  config?: Record<string, unknown>;
}

/**
 * Extended manifest with optional extensions array.
 * Extensions are additive and MUST NOT change core semantics.
 */
export interface ExtendedManifest extends Manifest {
  /**
   * Optional list of extensions supported by this manifest.
   */
  extensions?: Extension[];
}
