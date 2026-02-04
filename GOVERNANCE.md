# RLP Governance

This document describes the governance model for the Reward Layer Protocol (RLP) specification.

---

## Decision Making

RLP uses a **consensus-based** decision-making model.

### Proposal Process

1. **Open an Issue** — Create a GitHub issue with the `proposal` label describing the proposed change
2. **Discussion Period** — Community and maintainers discuss the proposal
3. **Review Period**:
   - Non-breaking changes: 7 days minimum
   - Breaking changes: 14 days minimum
4. **Decision** — Maintainers approve, request changes, or reject with documented rationale

### Consensus

- Proposals require agreement from all active maintainers
- Silence after the review period is considered implicit approval
- Objections must include specific concerns and suggested alternatives
- Maintainers may call for a formal vote if consensus cannot be reached

### Types of Changes

| Change Type | Review Period | Examples |
|-------------|---------------|----------|
| **Clarification** | 7 days | Typo fixes, wording improvements |
| **Non-breaking** | 7 days | New optional fields, additional examples |
| **Breaking** | 14 days | Required field changes, semantic changes |

---

## Release Process

RLP follows semantic versioning for specification releases.

### Version Numbers

- **MAJOR** (e.g., 2.0) — Breaking changes that require implementation updates
- **MINOR** (e.g., 1.2) — New features, non-breaking additions

### Release Steps

1. Maintainer creates a release PR with:
   - Updated version in SPECIFICATION.md
   - Updated CHANGELOG.md
2. Review period (7 days minimum)
3. Merge and tag release (e.g., `v1.2.0`)
4. Create GitHub Release with release notes

---

## Becoming a Maintainer

### Requirements

- Consistent, quality contributions over time
- Demonstrated understanding of the protocol
- Positive community interactions

### Process

1. Nominated by an existing maintainer
2. Discussion among current maintainers
3. Approved by consensus
4. Added to MAINTAINERS.md

### Stepping Down

Maintainers may step down at any time by opening a PR to remove themselves from MAINTAINERS.md.

---

## Code of Conduct

All participants must follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## Changes to Governance

Changes to this governance document follow the same proposal process as specification changes, with a 14-day review period.
