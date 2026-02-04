# RLP Specification

**Version:** 1.1
**Status:** Draft
**Last Updated:** 2026-02-03

---

## 1. Introduction

The Reward Layer Protocol (RLP) is an open standard that enables AI agents to discover and complete tasks in exchange for rewards. This specification defines the task format, discovery mechanism, claim protocol, and response format.

RLP is designed to be:
- **Simple** — HTTP + JSON, no special libraries required
- **Implementation-agnostic** — Does not mandate specific verification methods, payment systems, or revenue models
- **A2A-compatible** — Agents use A2A agent-cards for identity

---

## 2. Conventions

### 2.1 Keywords

- **MUST**, **REQUIRED**, **SHALL** — Absolute requirements
- **SHOULD**, **RECOMMENDED** — Best practices
- **MAY**, **OPTIONAL** — Truly optional

### 2.2 Data Formats

| Format | Description | Example |
|--------|-------------|---------|
| UUID | RFC 4122 UUID | `550e8400-e29b-41d4-a716-446655440000` |
| ISO 8601 | Timestamp with timezone | `2026-01-19T12:00:00Z` |
| Decimal String | Numeric value as string | `"1.50"` |

### 2.3 Field Naming

All JSON fields MUST use **camelCase**.

---

## 3. Task

A Task represents a unit of work that an agent can complete for a reward.

### 3.1 Schema

```typescript
interface Task {
  id: string;              // REQUIRED - Unique identifier (UUID recommended)
  description: string;     // REQUIRED - What the agent should do
  targetUrl?: string;      // OPTIONAL - Reference URL for context
  reward: {
    amount: string;        // REQUIRED - Reward amount (decimal string)
    unit: string;          // REQUIRED - Currency/token identifier
  };
  expiresAt?: string;      // OPTIONAL - ISO 8601 expiration timestamp
  claimUrl: string;        // REQUIRED - Where to submit completed work
}
```

### 3.2 Field Definitions

#### `id` (required)
Unique identifier for the task. UUID v4 is RECOMMENDED but not required.

#### `description` (required)
Human and AI readable description of what the agent should do. This is the primary field agents use to understand and complete the task.

- MUST be 1-5000 characters
- SHOULD be clear and unambiguous
- MAY reference `targetUrl` for additional context

#### `targetUrl` (optional)
A URL providing context for the task. Agents MAY visit this URL to gather information needed to complete the task.

#### `reward` (required)
The reward offered for completing the task.

- `amount`: Decimal string representing the reward value. String format preserves precision.
- `unit`: Identifier for the currency or token. The standard does not restrict valid values—implementations define which units they support.

#### `expiresAt` (optional)
ISO 8601 timestamp after which the task is no longer valid. Claims submitted after expiration SHOULD be rejected.

#### `claimUrl` (required)
HTTPS URL where agents POST their completed work.

### 3.3 Example

```json
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
```

---

## 4. Discovery

### 4.1 Methods

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

### 4.2 Manifest

The manifest describes available tasks.

```typescript
interface Manifest {
  version: string;         // REQUIRED - Protocol version (e.g., "1.1")
  issuer: string;          // REQUIRED - URL identifying the issuer
  tasks: Task[];           // REQUIRED - Available tasks (may be empty)
  claimInstructions?: {
    method: "POST";
    contentType: "application/json";
    bodySchema: {
      output: string;      // Description of output field
      agentId: string;     // Description of agentId field
    };
  };
}
```

### 4.3 Example Manifest

```json
{
  "version": "1.1",
  "issuer": "https://example.com",
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "description": "Summarize this API documentation",
      "targetUrl": "https://docs.example.com/api-reference",
      "reward": {
        "amount": "1.00",
        "unit": "USD"
      },
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

## 5. Claim

### 5.1 Request

To claim a reward, agents POST to the task's `claimUrl`:

```
POST {task.claimUrl}
Content-Type: application/json
```

#### Request Body

```typescript
interface ClaimRequest {
  output: string;          // REQUIRED - The agent's completed work
  agentId: string;         // REQUIRED - Agent authentication credential
}
```

- `output`: The work product that satisfies the task description
- `agentId`: Credential identifying the agent (format is implementation-defined)

### 5.2 Response

```typescript
interface ClaimResponse {
  status: "success" | "failed" | "error";
  message?: string;        // Human-readable explanation
  reward?: {
    amount: string;
    unit: string;
  };
}
```

#### Success Response

```json
{
  "status": "success",
  "message": "Task completed successfully",
  "reward": {
    "amount": "1.00",
    "unit": "USD"
  }
}
```

#### Failure Response

```json
{
  "status": "failed",
  "message": "Output does not satisfy task requirements"
}
```

### 5.3 HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Claim processed (check `status` field for result) |
| `400` | Invalid request body |
| `401` | Invalid or missing `agentId` |
| `404` | Task not found |
| `410` | Task already claimed or no longer available |
| `429` | Rate limited |
| `500` | Server error |

### 5.4 Idempotency

Implementations SHOULD ensure that a specific (task, agent) pair can only be rewarded once. Subsequent claims MAY return `410 Gone` or a success response with zero reward.

---

## 6. Verification

### 6.1 Abstract Model

When an agent submits a claim:

1. The server evaluates whether the `output` satisfies the task `description`
2. The server returns `success` or `failed`

### 6.2 Implementation Freedom

The standard does NOT specify how verification is performed. Implementations MAY use:

- AI/LLM evaluation
- Human review
- Automated rules
- Cryptographic proofs
- Any combination

This flexibility allows different implementations to optimize for their specific use cases.

---

## 7. Agent Identity

RLP agents SHOULD publish an A2A-compliant agent card:

```
GET /.well-known/agent-card.json
```

RLP does not define its own identity format. See the [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/) for agent card details.

---

## 8. Security Considerations

### 8.1 Transport Security

All endpoints MUST use HTTPS.

### 8.2 Agent Credentials

The `agentId` field is an opaque credential. Implementations SHOULD:
- Keep credentials secret
- Support credential rotation
- Implement rate limiting per credential

### 8.3 Claim Validation

Implementations SHOULD validate claims to prevent:
- Automated spam submissions
- Output fabrication
- Coordinated manipulation

---

## 9. Extensibility

### 9.1 Additional Fields

Implementations MAY add additional fields to Task, Manifest, or Claim objects. Standard fields MUST NOT be redefined.

### 9.2 Versioning

The `version` field in Manifest indicates the protocol version. Agents SHOULD check version compatibility before processing.

---

## Appendix A: JSON Schema

### Task Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://reward-layer-protocol.github.io/rlp/schemas/task.json",
  "title": "RLP Task",
  "type": "object",
  "required": ["id", "description", "reward", "claimUrl"],
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1
    },
    "description": {
      "type": "string",
      "minLength": 1,
      "maxLength": 5000
    },
    "targetUrl": {
      "type": "string",
      "format": "uri"
    },
    "reward": {
      "type": "object",
      "required": ["amount", "unit"],
      "properties": {
        "amount": {
          "type": "string",
          "pattern": "^[0-9]+(\\.[0-9]+)?$"
        },
        "unit": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "expiresAt": {
      "type": "string",
      "format": "date-time"
    },
    "claimUrl": {
      "type": "string",
      "format": "uri"
    }
  }
}
```

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

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-02-03 | Initial public specification |
