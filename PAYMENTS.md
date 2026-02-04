# RLP Payment Design

**Status:** Discussion Document
**Last Updated:** 2026-02-04

---

## 1. Overview

This document explains RLP's approach to payments and settlement, why certain existing protocols (like x402) are not directly applicable, and invites community input on potential solutions.

**Key principle:** RLP intentionally leaves settlement implementation-defined to remain flexible across different payment infrastructures.

---

## 2. RLP Payment Flow

### 2.1 The Claim-Reward Model

RLP uses a **work-first, pay-later** model:

```
1. Agent discovers task (via manifest)
2. Agent completes work
3. Agent submits output to claimUrl
4. Server verifies output quality
5. Server credits reward to agent  ← PAYMENT HAPPENS HERE
```

The critical characteristic: **the server pays the agent**, not the other way around.

### 2.2 Current Specification

From [SPECIFICATION.md](./SPECIFICATION.md), the reward is defined as:

```typescript
interface Task {
  reward: {
    amount: string;  // Decimal string (e.g., "1.00")
    unit: string;    // Currency identifier (e.g., "USD", "USDC", "BTC")
  };
}
```

The `unit` field is intentionally generic. RLP does not mandate:
- Specific currencies or tokens
- Settlement timing (immediate vs. batched)
- Settlement mechanism (on-chain, off-chain, fiat)
- Custody model (escrow, direct transfer, credit system)

This flexibility allows implementations to choose what works best for their use case.

---

## 3. Why Not x402?

### 3.1 What is x402?

[x402](https://x402.org) is an open protocol developed by Coinbase that enables instant stablecoin payments over HTTP using the HTTP 402 "Payment Required" status code. It's designed for **pay-to-access** scenarios.

### 3.2 x402 Payment Direction

x402 flow:
```
1. Client requests resource (GET /api/data)
2. Server returns HTTP 402 with payment requirements
3. Client signs EIP-3009 payment authorization
4. Client retries with X-PAYMENT header
5. Server verifies signature, settles on-chain
6. Server returns resource
```

**Direction: Client (payer) → Server (receiver)**

### 3.3 RLP Settlement Direction

RLP settlement flow:
```
1. Agent submits completed work
2. Server verifies quality
3. Server pays agent

Direction: Server (payer) → Agent (receiver)
```

### 3.4 The Mismatch

| Aspect | x402 | RLP Settlement |
|--------|------|----------------|
| **Who pays** | Client/Agent | Server |
| **Who receives** | Server | Agent |
| **Trigger** | Client wants access | Server approves work |
| **Direction** | Client → Server | Server → Agent |

**x402 is designed for the opposite direction.** There is no mechanism in x402 for a server to initiate a payment to a client. The entire protocol assumes the client is the payer.

### 3.5 Where x402 CAN Complement RLP

While x402 cannot handle RLP reward settlement, it can complement RLP in other ways:

| Use Case | Direction | x402 Applicable? |
|----------|-----------|------------------|
| Agent pays to access paid content | Agent → Publisher | ✅ Yes |
| Agent pays claim submission fee (anti-spam) | Agent → Server | ✅ Yes |
| **Server pays agent for completed work** | **Server → Agent** | **❌ No** |

An agent economy might use:
- **RLP** for discovering and completing tasks (earning)
- **x402** for accessing paid resources (spending)

But the actual reward settlement requires a different mechanism.

---

## 4. Settlement Options

Since RLP doesn't mandate a settlement mechanism, implementations have several options:

### 4.1 Centralized Credit System

```
Agent claims reward → Server credits internal balance → Agent withdraws later
```

**Pros:** Simple, batched withdrawals reduce fees
**Cons:** Requires trust in operator, custodial

### 4.2 Direct On-Chain Transfer

```
Agent claims reward → Server calls token.transfer(agent, amount)
```

**Pros:** Immediate, trustless
**Cons:** Gas costs per claim, requires agent wallet

### 4.3 EIP-3009 Server-Initiated

```
Agent claims reward → Server signs transferWithAuthorization → Agent or facilitator settles
```

**Pros:** Gasless for server (if facilitator settles)
**Cons:** Requires EIP-3009 compatible tokens (mainly USDC)

### 4.4 Payment Channels / L2

```
Agent claims reward → Server updates channel state → Periodic settlement
```

**Pros:** Low fees, instant finality
**Cons:** Complexity, channel management

### 4.5 Escrow with Pull Model

```
Task creator escrows funds → Agent claims → Agent pulls from escrow
```

**Pros:** Trustless, funds guaranteed
**Cons:** Capital lockup, smart contract complexity

---

## 5. Design Principles

RLP's payment design follows these principles:

### 5.1 Implementation Freedom

Different use cases have different needs:
- High-frequency micro-tasks → Credit system with batched settlement
- High-value tasks → Immediate on-chain settlement
- Enterprise use → Fiat invoicing

RLP should not force one model on all implementations.

### 5.2 Currency Agnosticism

The `reward.unit` field accepts any string. Implementations decide which units they support:
- Fiat: `"USD"`, `"EUR"`
- Stablecoins: `"USDC"`, `"USDT"`
- Crypto: `"BTC"`, `"ETH"`, `"SOL"`
- Points/Credits: `"POINTS"`, `"CREDITS"`

### 5.3 Verification Before Payment

Unlike x402 (where valid signature = valid payment), RLP requires **semantic verification**:
- Does the output satisfy the task description?
- Is the quality acceptable?

This verification step is why RLP can't simply adopt a "sign and settle" model—the server must evaluate the work before deciding to pay.

---

## 6. Open Questions

We invite community input on these questions:

### 6.1 Standard Settlement Extension?

Should RLP define an optional settlement extension for on-chain payments?

```typescript
// Possible extension
interface Task {
  reward: { amount, unit };
  settlement?: {
    protocol: "eip3009" | "permit2" | "native";
    network: string;      // CAIP-2 chain ID
    asset: string;        // Token contract address
    recipient?: string;   // Agent's wallet (if known)
  };
}
```

### 6.2 Agent Wallet Discovery?

How should agents communicate their wallet addresses?
- In the claim request?
- Via A2A agent card extension?
- Separate registration flow?

### 6.3 Escrow Standards?

Should RLP define an escrow interface for trustless settlement?

```typescript
interface Escrow {
  deposit(taskId, amount, token): void;
  release(taskId, agent, amount): void;
  refund(taskId): void;
}
```

### 6.4 Reverse x402?

Is there interest in proposing a "reverse x402" or similar protocol for server-to-client payments? This could be:
- HTTP header for "payment incoming"
- Webhook-based settlement notification
- Pull-based claim mechanism

---

## 7. Related Protocols

| Protocol | Focus | RLP Relationship |
|----------|-------|------------------|
| [x402](https://x402.org) | Pay-to-access resources | Complementary (agent spending) |
| [AP2](https://ap2-protocol.org) | Agent payment authorization | Potential integration for authorization |
| [A2A](https://github.com/a2aproject/A2A) | Agent identity & communication | RLP builds on A2A for identity |
| [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) | Gasless token transfers | Potential settlement primitive |

---

## 8. Conclusion

RLP intentionally keeps settlement implementation-defined because:

1. **Different use cases need different solutions** - micro-tasks vs. high-value work
2. **Payment infrastructure is evolving** - new protocols emerge regularly
3. **x402 solves a different problem** - client-to-server, not server-to-client
4. **Flexibility enables adoption** - implementations can start simple and evolve

We welcome community proposals for:
- Standard settlement extensions
- Escrow contract interfaces
- Server-to-agent payment protocols

---

## Contributing

To discuss payment design:
- Open an issue: [github.com/Reward-Layer-Protocol/rlp/issues](https://github.com/Reward-Layer-Protocol/rlp/issues)
- Join discussions: [github.com/Reward-Layer-Protocol/rlp/discussions](https://github.com/Reward-Layer-Protocol/rlp/discussions)

---

## References

- [RLP Specification](./SPECIFICATION.md)
- [x402 Protocol](https://x402.org)
- [x402 Technical Spec](https://github.com/coinbase/x402)
- [AP2 Protocol](https://ap2-protocol.org)
- [A2A x402 Extension](https://github.com/google-agentic-commerce/a2a-x402)
- [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009)
