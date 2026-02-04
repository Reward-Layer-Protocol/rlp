# Changelog

All notable changes to the RLP specification are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-02-04

### Added

- **Protocol Operations** — Four named operations: GetManifest, GetTask, SubmitClaim, GetClaimStatus
- **HTTP/REST Binding** — Complete HTTP method and endpoint definitions with examples
- **Error Code Registry** — Semantic error codes (1xxx-5xxx) supplementing HTTP status codes
- **TypeScript Schema** — Normative schema source in `spec/rlp.ts`
- **Extension Framework** — URI-based extension declaration in manifests
- **IANA Considerations** — Link relation and well-known URI documentation
- **Security Threat Model** — Expanded security section with threats and mitigations
- **Governance Files** — GOVERNANCE.md, MAINTAINERS.md, SECURITY.md, CODE_OF_CONDUCT.md

### Changed

- JSON schemas marked as non-normative (derived from TypeScript source)
- ClaimResponse now supports `"pending"` status with `claimId` for async verification
- Expanded Security Considerations with rate limiting guidance

---

## [1.0.0] - 2026-02-03

### Added

- Initial RLP specification
- Task data model with id, description, targetUrl, reward, expiresAt, claimUrl
- Manifest format served at `/.well-known/agent-reward.json`
- ClaimRequest and ClaimResponse schemas
- Discovery via HTML link tag and well-known endpoint
- JSON Schemas for validation
- PAYMENTS.md explaining settlement design rationale
