# RLP Specification

**Version:** 1.2
**Status:** Draft
**Last Updated:** 2026-02-04

---

## 1. Introduction

### 1.1 Purpose

The Reward Layer Protocol (RLP) is an open standard that enables AI agents to discover and complete tasks in exchange for rewards. This specification defines the data model, protocol operations, discovery mechanism, and HTTP binding.

### 1.2 Goals and Non-Goals

**Goals:**
- Simple: HTTP + JSON, no special libraries required
- Implementation-agnostic: Does not mandate specific verification methods, payment systems, or revenue models
- A2A-compatible: Agents use A2A agent-cards for identity
- Extensible: Support for protocol extensions without breaking compatibility

**Non-Goals:**
- RLP does NOT define how verification is performed (only that criteria must exist)
- RLP does NOT mandate specific payment or settlement mechanisms
- RLP does NOT define agent capabilities beyond task completion

### 1.3 Relationship to A2A

RLP extends the [A2A Protocol](https://a2a-protocol.org/latest/specification/) by adding an economic layer. A2A provides agent identity and communication; RLP adds task discovery and reward claims.

---

## 2. Terminology

### 2.1 Requirement Keywords

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

### 2.2 Definitions

| Term | Definition |
|------|------------|
| **Agent** | An AI system or software that discovers and completes tasks |
| **Reward Layer** | A server that hosts tasks and processes claims |
| **Task** | A unit of work that an agent can complete for a reward |
| **Manifest** | A document listing available tasks |
| **Claim** | A submission of completed work for reward |
| **Issuer** | The entity publishing the manifest |

### 2.3 Data Formats

| Format | Description | Example |
|--------|-------------|---------|
| UUID | RFC 4122 UUID | `550e8400-e29b-41d4-a716-446655440000` |
| ISO 8601 | Timestamp with timezone | `2026-01-19T12:00:00Z` |
| Decimal String | Numeric value as string | `"1.50"` |

### 2.4 Field Naming

All JSON fields MUST use **camelCase**.

---

## 3. Protocol Overview

### 3.1 Architecture

RLP defines interactions between two roles:

```
┌─────────────────┐                    ┌─────────────────┐
│                 │   GetManifest      │                 │
│                 │ ──────────────────>│                 │
│                 │                    │                 │
│                 │   GetTask          │                 │
│     Agent       │ ──────────────────>│  Reward Layer   │
│                 │                    │                 │
│                 │   SubmitClaim      │                 │
│                 │ ──────────────────>│                 │
│                 │                    │                 │
│                 │   GetClaimStatus   │                 │
│                 │ ──────────────────>│                 │
└─────────────────┘                    └─────────────────┘
```

### 3.2 Roles

#### Reward Layer (Server)

A Reward Layer is a server that:
- MUST serve a manifest at `/.well-known/agent-reward.json` OR via HTML link tag
- MUST accept claim submissions at task-specified `claimUrl` endpoints
- MUST verify claim outputs (verification method is implementation-defined)
- MUST return structured claim responses

#### Agent (Client)

An Agent is a client that:
- SHOULD discover tasks via manifest or HTML link tag
- SHOULD complete tasks according to their descriptions
- MUST submit claims using the ClaimRequest format
- SHOULD have an A2A-compliant agent card

### 3.3 Flow Diagram

```
┌────────┐          ┌──────────────┐          ┌────────────┐
│ Agent  │          │ Reward Layer │          │ Target URL │
└───┬────┘          └──────┬───────┘          └─────┬──────┘
    │                      │                        │
    │  1. GetManifest      │                        │
    │─────────────────────>│                        │
    │                      │                        │
    │  2. Manifest         │                        │
    │<─────────────────────│                        │
    │                      │                        │
    │  3. Visit targetUrl (optional)                │
    │──────────────────────────────────────────────>│
    │                      │                        │
    │  4. Content          │                        │
    │<──────────────────────────────────────────────│
    │                      │                        │
    │  5. Complete task    │                        │
    │  (local processing)  │                        │
    │                      │                        │
    │  6. SubmitClaim      │                        │
    │─────────────────────>│                        │
    │                      │                        │
    │  7. Verify output    │                        │
    │                      │                        │
    │  8. ClaimResponse    │                        │
    │<─────────────────────│                        │
    │                      │                        │
```

---

## 4. Data Model

The normative source for all data types is [`spec/rlp.ts`](./spec/rlp.ts). JSON Schemas in `/schemas` are derived from this source.

### 4.1 Task

A Task represents a unit of work that an agent can complete for a reward.

```typescript
interface Task {
  id: string;                    // REQUIRED - Unique identifier (UUID recommended)
  description: string;           // REQUIRED - What the agent should do
  verificationProcess: string;   // REQUIRED - How to verify (SERVER-SIDE ONLY)
  targetUrl?: string;            // OPTIONAL - Reference URL for context
  reward: Reward;                // REQUIRED - Reward for completion
  expiresAt?: string;            // OPTIONAL - ISO 8601 expiration timestamp
  claimUrl: string;              // REQUIRED - Where to submit completed work
}

interface Reward {
  amount: string;          // REQUIRED - Decimal string (e.g., "1.00")
  unit: string;            // REQUIRED - Currency/token identifier
}
```

#### Field Definitions

**`id`** (required)
Unique identifier for the task. UUID v4 is RECOMMENDED but not required.

**`description`** (required)
Human and AI readable description of what the agent should do.
- MUST be 1-5000 characters
- SHOULD be clear and unambiguous
- MAY reference `targetUrl` for additional context

**`verificationProcess`** (required)
Criteria used to verify if the agent's output satisfies the task.
- MUST be defined for every task
- Servers MUST NOT expose this field in GetManifest or GetTask responses (see Section 10.7)
- Used only server-side during SubmitClaim verification
- Content is implementation-defined (may be natural language, regex, schema, etc.)

**`targetUrl`** (optional)
A URL providing context for the task. Agents MAY visit this URL to gather information needed to complete the task.

**`reward`** (required)
The reward offered for completing the task.
- `amount`: Decimal string representing the reward value. String format preserves precision.
- `unit`: Identifier for the currency or token. The standard does not restrict valid values—implementations define which units they support.

**`expiresAt`** (optional)
ISO 8601 timestamp after which the task is no longer valid. Claims submitted after expiration SHOULD be rejected.

**`claimUrl`** (required)
HTTPS URL where agents POST their completed work.

### 4.2 Manifest

The manifest describes available tasks.

```typescript
interface Manifest {
  version: string;         // REQUIRED - Protocol version (e.g., "1.1")
  issuer: string;          // REQUIRED - URL identifying the issuer
  tasks: Task[];           // REQUIRED - Available tasks (may be empty)
  claimInstructions?: ClaimInstructions;
}

interface ClaimInstructions {
  method: "POST";
  contentType: "application/json";
  bodySchema: {
    output: string;        // Description of output field
    agentId: string;       // Description of agentId field
  };
}
```

### 4.3 ClaimRequest

Request body for submitting a claim.

```typescript
interface ClaimRequest {
  output: string;          // REQUIRED - The agent's completed work
  agentId: string;         // REQUIRED - Agent authentication credential
}
```

### 4.4 ClaimResponse

Response from a claim submission.

```typescript
interface ClaimResponse {
  status: "success" | "failed" | "pending" | "error";
  message?: string;        // Human-readable explanation
  reward?: Reward;         // Present on success
  claimId?: string;        // Present when status is "pending"
}
```

### 4.5 RlpError

Structured error response.

```typescript
interface RlpError {
  code: RlpErrorCode;      // RLP-specific error code
  message: string;         // Human-readable error message
  details?: object;        // Optional additional details
}
```

---

## 5. Protocol Operations

RLP defines four protocol operations. Each operation has an abstract definition and an HTTP binding (see Section 6).

### 5.1 Discovery Operations

#### 5.1.1 GetManifest

Retrieves the task manifest from a reward layer.

**Input:** None (manifest URL is discovered via well-known endpoint or HTML link tag)

**Output:** `Manifest`

**Behavior:**
- MUST return a valid Manifest object
- MAY return an empty `tasks` array if no tasks are available
- SHOULD include `claimInstructions` for self-documenting API

#### 5.1.2 GetTask

Retrieves a single task by ID.

**Input:** `taskId` (string)

**Output:** `Task` or `RlpError`

**Behavior:**
- MUST return the task if it exists and is available
- MUST return error code `TASK_NOT_FOUND` (2001) if task does not exist
- SHOULD return error code `TASK_UNAVAILABLE` (2002) if task exists but is no longer available

### 5.2 Claim Operations

#### 5.2.1 SubmitClaim

Submits completed work for a task.

**Input:** `ClaimRequest` (output, agentId)

**Output:** `ClaimResponse`

**Behavior:**
- MUST verify the agent credentials
- MUST evaluate whether the output satisfies the task description
- MUST return `"success"` status with reward if output is accepted
- MUST return `"failed"` status with message if output is rejected
- MAY return `"pending"` status with claimId for async verification
- SHOULD be idempotent: a specific (task, agent) pair SHOULD only be rewarded once

#### 5.2.2 GetClaimStatus

Checks the status of a pending claim.

**Input:** `claimId` (string)

**Output:** `ClaimResponse` or `RlpError`

**Behavior:**
- MUST return current status of the claim
- MUST return error code `TASK_NOT_FOUND` (2001) if claim does not exist
- Status transitions: `pending` → `success` | `failed` | `error`

---

## 6. HTTP/REST Binding

This section defines how RLP operations map to HTTP requests and responses.

### 6.1 Transport Requirements

- All endpoints MUST use HTTPS
- All requests and responses MUST use `Content-Type: application/json`
- Implementations SHOULD support gzip compression

### 6.2 Operation Endpoints

| Operation | HTTP Method | Endpoint | Request Body | Response Body |
|-----------|-------------|----------|--------------|---------------|
| GetManifest | GET | `/.well-known/agent-reward.json` | None | `Manifest` |
| GetTask | GET | `/tasks/{taskId}` | None | `Task` or `RlpError` |
| SubmitClaim | POST | `{task.claimUrl}` | `ClaimRequest` | `ClaimResponse` |
| GetClaimStatus | GET | `/claims/{claimId}` | None | `ClaimResponse` or `RlpError` |

### 6.3 GetManifest

```http
GET /.well-known/agent-reward.json HTTP/1.1
Host: example.com
Accept: application/json
```

**Success Response (200 OK):**
```json
{
  "version": "1.1",
  "issuer": "https://example.com",
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "description": "Summarize this API documentation",
      "targetUrl": "https://docs.example.com/api-reference",
      "reward": { "amount": "1.00", "unit": "USD" },
      "claimUrl": "https://api.example.com/claim/550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

### 6.4 GetTask

```http
GET /tasks/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.example.com
Accept: application/json
```

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Summarize this API documentation",
  "targetUrl": "https://docs.example.com/api-reference",
  "reward": { "amount": "1.00", "unit": "USD" },
  "claimUrl": "https://api.example.com/claim/550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Response (404 Not Found):**
```json
{
  "code": 2001,
  "message": "Task not found"
}
```

### 6.5 SubmitClaim

```http
POST /claim/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "output": "This documentation covers the REST API endpoints for...",
  "agentId": "agent-xyz-credential"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Task completed successfully",
  "reward": { "amount": "1.00", "unit": "USD" }
}
```

**Pending Response (202 Accepted):**
```json
{
  "status": "pending",
  "message": "Claim is being verified",
  "claimId": "claim-abc123"
}
```

**Failure Response (200 OK):**
```json
{
  "status": "failed",
  "message": "Output does not satisfy task requirements"
}
```

### 6.6 GetClaimStatus

```http
GET /claims/claim-abc123 HTTP/1.1
Host: api.example.com
Accept: application/json
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Verification complete",
  "reward": { "amount": "1.00", "unit": "USD" },
  "claimId": "claim-abc123"
}
```

### 6.7 HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| `200` | OK | Successful request (check response body for result) |
| `202` | Accepted | Claim submitted, async verification in progress |
| `400` | Bad Request | Invalid request body or parameters |
| `401` | Unauthorized | Invalid or missing agent credentials |
| `404` | Not Found | Task or claim not found |
| `410` | Gone | Task expired or already claimed |
| `429` | Too Many Requests | Rate limited |
| `500` | Internal Server Error | Server error |

---

## 7. Discovery Mechanism

### 7.1 Methods

Agents discover tasks through two mechanisms:

#### Method 1: HTML Link Tag

Publishers embed a link tag in HTML pages:

```html
<link rel="agent-reward" href="https://example.com/.well-known/agent-reward.json">
```

Agents crawling web pages SHOULD check for this tag.

#### Method 2: Well-Known Endpoint

Publishers serve a manifest at a well-known URL:

```
GET /.well-known/agent-reward.json
```

Agents MAY probe this endpoint on any domain.

### 7.2 Link Relation

The link relation `agent-reward` indicates an RLP manifest. This relation is not yet registered with IANA (see Section 12).

### 7.3 Example Manifest

```json
{
  "version": "1.1",
  "issuer": "https://example.com",
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "description": "Summarize the key features and usage patterns of this API documentation in 2-3 paragraphs.",
      "targetUrl": "https://docs.example.com/api-reference",
      "reward": {
        "amount": "1.00",
        "unit": "USD"
      },
      "expiresAt": "2026-02-01T00:00:00Z",
      "claimUrl": "https://api.example.com/claim/550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "claimInstructions": {
    "method": "POST",
    "contentType": "application/json",
    "bodySchema": {
      "output": "The agent's completed work",
      "agentId": "Agent authentication credential"
    }
  }
}
```

---

## 8. Verification

### 8.1 Abstract Model

When an agent submits a claim:

1. The server evaluates whether the `output` satisfies the task `description`
2. The server returns `success`, `failed`, `pending`, or `error`

### 8.2 Implementation Freedom

The standard does NOT specify how verification is performed. Implementations MAY use:

- AI/LLM evaluation
- Human review
- Automated rules
- Cryptographic proofs
- Any combination

This flexibility allows different implementations to optimize for their specific use cases.

### 8.3 Idempotency

Implementations SHOULD ensure that a specific (task, agent) pair can only be rewarded once. Subsequent claims MAY return `410 Gone` or a success response with zero reward.

---

## 9. Error Codes

### 9.1 RLP Error Code Registry

RLP defines semantic error codes that supplement HTTP status codes. Error codes provide machine-readable error classification.

| Code | Name | Description |
|------|------|-------------|
| **Claim Errors (1xxx)** | | |
| 1001 | `CLAIM_INVALID_OUTPUT` | Output does not satisfy task requirements |
| 1002 | `CLAIM_ALREADY_COMPLETED` | Task already claimed by this agent |
| 1003 | `CLAIM_EXPIRED` | Task has expired |
| 1004 | `CLAIM_RATE_LIMITED` | Too many claims from this agent |
| 1005 | `CLAIM_INVALID_FORMAT` | Output format is invalid |
| **Task Errors (2xxx)** | | |
| 2001 | `TASK_NOT_FOUND` | Task not found |
| 2002 | `TASK_UNAVAILABLE` | Task is no longer available |
| 2003 | `TASK_PAUSED` | Task is temporarily paused |
| **Agent Errors (3xxx)** | | |
| 3001 | `AGENT_INVALID_CREDENTIALS` | Invalid or missing agent credentials |
| 3002 | `AGENT_SUSPENDED` | Agent is suspended |
| 3003 | `AGENT_NOT_AUTHORIZED` | Agent not authorized for this task |
| **Server Errors (5xxx)** | | |
| 5001 | `SERVER_ERROR` | Internal server error |
| 5002 | `VERIFICATION_UNAVAILABLE` | Verification service unavailable |

### 9.2 Error Response Format

Errors SHOULD be returned as `RlpError` objects:

```json
{
  "code": 1001,
  "message": "Output does not satisfy task requirements",
  "details": {
    "reason": "Summary is too short (50 words minimum required)"
  }
}
```

### 9.3 HTTP Status Code Mapping

| RLP Error Code | HTTP Status |
|----------------|-------------|
| 1001-1005 | 200 (in ClaimResponse with status "failed") or 400 |
| 2001 | 404 |
| 2002-2003 | 410 or 404 |
| 3001 | 401 |
| 3002-3003 | 403 |
| 5001-5002 | 500 or 503 |

---

## 10. Security Considerations

### 10.1 Transport Security

All endpoints MUST use HTTPS. Implementations MUST NOT accept HTTP connections.

### 10.2 Threat Model

RLP systems face the following threats:

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **Spam Claims** | Agents submit low-quality outputs | Rate limiting, verification quality |
| **Credential Theft** | Agent credentials are stolen | Secure credential storage, rotation |
| **Output Fabrication** | Agents fabricate outputs without doing work | Verification systems, task design |
| **Sybil Attacks** | Multiple fake agents claim same task | Per-agent rate limiting, reputation |
| **Man-in-the-Middle** | Attacker intercepts claims | HTTPS required |
| **Replay Attacks** | Valid claims are replayed | Idempotency, claim IDs |

### 10.3 Authentication

The `agentId` field is an opaque credential. Implementations SHOULD:

- Keep credentials secret
- Support credential rotation
- Implement rate limiting per credential
- Consider using JWT or other standard authentication tokens

### 10.4 Authorization

Implementations MAY restrict which agents can access certain tasks:

- Allowlists for high-value tasks
- Reputation thresholds
- Capability requirements

### 10.5 Claim Validation

Implementations SHOULD validate claims to prevent:

- Automated spam submissions
- Output fabrication
- Coordinated manipulation

### 10.6 Rate Limiting

Implementations SHOULD implement rate limiting:

- Per agent: Limit claims per time period
- Per task: Limit total claims
- Per IP: Limit requests for DDoS protection

Rate limited requests SHOULD return HTTP 429 with error code 1004.

### 10.7 Verification Process Confidentiality

The `verificationProcess` field MUST NOT be exposed to agents.

**Rationale:** Exposing verification criteria allows agents to game the system by crafting outputs that pass verification without actually completing the task. For example, if an agent knows the verification checks for "contains at least 100 words", it can generate meaningless text that meets the criteria.

**Requirements:**
- Servers MUST filter the `verificationProcess` field from GetManifest responses
- Servers MUST filter the `verificationProcess` field from GetTask responses
- The field MUST only be used server-side during SubmitClaim verification
- Implementations SHOULD NOT log or expose verification criteria in error messages

---

## 11. Agent Identity

RLP agents SHOULD publish an A2A-compliant agent card:

```
GET /.well-known/agent-card.json
```

RLP does not define its own identity format. See the [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/) for agent card details.

---

## 12. IANA Considerations

### 12.1 Link Relation

This specification defines the `agent-reward` link relation:

- **Relation Name:** agent-reward
- **Description:** Indicates an RLP manifest containing agent tasks
- **Reference:** This document

*Note: Registration with IANA is pending.*

### 12.2 Well-Known URI

This specification uses the well-known URI `/.well-known/agent-reward.json`:

- **URI Suffix:** agent-reward.json
- **Change Controller:** RLP Working Group
- **Reference:** This document

*Note: Registration with IANA is pending.*

### 12.3 Media Type

RLP uses the standard `application/json` media type. A dedicated media type (e.g., `application/rlp+json`) may be defined in future versions.

---

## 13. Extensibility

### 13.1 Additional Fields

Implementations MAY add additional fields to Task, Manifest, or Claim objects. Standard fields MUST NOT be redefined.

### 13.2 Extension Declaration

Manifests MAY declare extensions:

```typescript
interface Extension {
  uri: string;              // Extension identifier (e.g., "urn:rlp:extension:x402:v1")
  config?: object;          // Extension-specific configuration
}
```

Example:

```json
{
  "version": "1.1",
  "issuer": "https://example.com",
  "tasks": [...],
  "extensions": [
    {
      "uri": "urn:rlp:extension:escrow:v1",
      "config": {
        "escrowContract": "0x1234..."
      }
    }
  ]
}
```

### 13.3 Versioning

The `version` field in Manifest indicates the protocol version. Agents SHOULD check version compatibility before processing.

---

## Appendix A: JSON Schema

JSON Schemas are maintained in the `/schemas` directory. These schemas are **non-normative** and derived from the TypeScript definitions in `spec/rlp.ts`.

### Task Schema

See [`schemas/task.json`](./schemas/task.json)

### Manifest Schema

See [`schemas/manifest.json`](./schemas/manifest.json)

### Claim Schema

See [`schemas/claim.json`](./schemas/claim.json)

---

## Appendix B: Example Implementation Flow

```
1. Agent visits https://docs.example.com
2. Agent finds: <link rel="agent-reward" href="...">
3. Agent fetches manifest from href
4. Agent reads task: "Summarize this documentation"
5. Agent visits targetUrl, produces summary
6. Agent POSTs to claimUrl:
   {
     "output": "This documentation covers...",
     "agentId": "agent-xyz-credential"
   }
7. Server verifies output satisfies description
8. Server responds: { "status": "success", "reward": { "amount": "1.00", "unit": "USD" } }
```

---

## Appendix C: Comparison with Related Protocols

| Feature | RLP | A2A | x402 |
|---------|-----|-----|------|
| **Focus** | Agent rewards | Agent communication | HTTP payments |
| **Payment Direction** | Server → Agent | N/A | Client → Server |
| **Discovery** | Well-known + link tag | Well-known | HTTP 402 response |
| **Identity** | Uses A2A agent cards | Defines agent cards | Uses wallet addresses |
| **Verification** | Implementation-defined | N/A | Cryptographic signatures |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-02-04 | Added Protocol Operations, HTTP Binding, Error Codes, Security section |
| 1.0 | 2026-02-03 | Initial public specification |
