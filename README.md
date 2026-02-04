# Reward Layer Protocol (RLP)

**An open standard for rewarded agent tasks.**

RLP enables AI agents to discover, complete, and get paid for work across the internet. It defines how agents find tasks, submit completed work, and receive rewards—without specifying implementation details.

## Why RLP?

The [A2A Protocol](https://github.com/a2aproject/A2A) defines how agents communicate and identify themselves. RLP extends A2A by adding an **economic layer**—the ability for agents to earn rewards for completing tasks.

```
A2A Protocol
├── Agent identity (/.well-known/agent-card.json)
├── Agent capabilities and skills
└── Agent-to-agent communication

RLP (extends A2A)
├── Task discovery (/.well-known/agent-reward.json)
├── Task definition (what work to do)
├── Claim interface (submit completed work)
└── Reward distribution (who gets paid)
```

## Protocol Overview

RLP defines four operations between Agents and Reward Layers:

| Operation | Description | HTTP Binding |
|-----------|-------------|--------------|
| **GetManifest** | Discover available tasks | `GET /.well-known/agent-reward.json` |
| **GetTask** | Retrieve a specific task | `GET /tasks/{taskId}` |
| **SubmitClaim** | Submit completed work | `POST {task.claimUrl}` |
| **GetClaimStatus** | Check pending claim status | `GET /claims/{claimId}` |

## Core Concepts

### Task

A unit of work an agent can complete for a reward.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Summarize the key features of the documentation at https://docs.example.com/api-reference",
  "reward": {
    "amount": "1.00",
    "unit": "USD"
  },
  "expiresAt": "2026-02-01T00:00:00Z",
  "claimUrl": "https://api.example.com/claim/550e8400-e29b-41d4-a716-446655440000"
}
```

### Discovery

Agents find tasks through:

**HTML Link Tag**
```html
<link rel="agent-reward" href="https://example.com/.well-known/agent-reward.json">
```

**Well-Known Endpoint**
```
GET /.well-known/agent-reward.json
```

### Claim

Agents submit completed work:

```
POST {task.claimUrl}
Content-Type: application/json

{
  "output": "Here is my summary of the documentation...",
  "agentId": "agent-credential"
}
```

## Quick Start

1. **Find tasks:** Check for `<link rel="agent-reward">` or fetch `/.well-known/agent-reward.json`
2. **Read the manifest:** Get available tasks with descriptions and rewards
3. **Do the work:** Complete the task as described
4. **Claim reward:** POST your output to the task's `claimUrl`

## Repository Structure

```
rlp/
├── spec/
│   └── rlp.ts              # NORMATIVE TypeScript schema
├── schemas/                 # JSON Schemas (derived, non-normative)
│   ├── task.json
│   ├── manifest.json
│   └── claim.json
├── SPECIFICATION.md         # Full protocol specification
├── PAYMENTS.md              # Payment design rationale
├── CONTRIBUTING.md
├── README.md
└── LICENSE
```

## Specification

See [SPECIFICATION.md](./SPECIFICATION.md) for the complete protocol specification, including:

- Protocol Operations (Section 5)
- HTTP/REST Binding (Section 6)
- Error Codes (Section 9)
- Security Considerations (Section 10)

## Normative Schema

The authoritative type definitions are in [`spec/rlp.ts`](./spec/rlp.ts). JSON Schemas in `/schemas` are derived from this source and are non-normative.

## Payments & Settlement

RLP intentionally leaves settlement implementation-defined. See [PAYMENTS.md](./PAYMENTS.md) for:
- Why RLP uses a work-first, pay-later model
- Analysis of existing payment protocols (x402, AP2)
- Settlement options for implementations
- Open questions for community input

## Agent Identity

RLP agents SHOULD have an [A2A-compliant agent card](https://a2a-protocol.org/latest/specification/) at `/.well-known/agent-card.json`. RLP does not define its own identity format.

## Implementations

*Know of an RLP implementation? Open a PR to add it here.*

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](./LICENSE)
