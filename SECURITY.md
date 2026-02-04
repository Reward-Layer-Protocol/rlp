# Security Policy

This document describes how to report security vulnerabilities in the Reward Layer Protocol specification and related implementations.

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

Use [GitHub Security Advisories](https://github.com/Reward-Layer-Protocol/rlp/security/advisories/new) to report vulnerabilities privately.

When reporting, please include:

1. **Description** — What is the vulnerability?
2. **Impact** — What could an attacker do?
3. **Steps to Reproduce** — How can we verify the issue?
4. **Affected Versions** — Which versions are affected?
5. **Suggested Fix** — If you have one (optional)

---

## Disclosure Timeline

We follow a coordinated disclosure process:

| Step | Timeline |
|------|----------|
| **Acknowledgment** | Within 48 hours of report |
| **Initial Assessment** | Within 7 days |
| **Fix Development** | Within 90 days (may vary by severity) |
| **Public Disclosure** | After fix is available |

### Severity Levels

| Severity | Response Time | Examples |
|----------|---------------|----------|
| **Critical** | 24-48 hours | RCE in reference implementation |
| **High** | 7 days | Authentication bypass |
| **Medium** | 30 days | Information disclosure |
| **Low** | 90 days | Minor spec ambiguity |

---

## Scope

This security policy covers:

- **RLP Specification** — Vulnerabilities in the protocol design
- **Reference Implementations** — Official SDKs and examples (when available)
- **This Repository** — Infrastructure, CI/CD, documentation

### Out of Scope

- Third-party implementations of RLP
- Vulnerabilities in dependencies (report to upstream)
- Social engineering attacks

---

## Recognition

We appreciate security researchers who help keep RLP secure. With your permission, we will:

- Credit you in the security advisory
- Add you to our security acknowledgments (if created)

---

## Questions

For non-vulnerability security questions, open a [GitHub Discussion](https://github.com/Reward-Layer-Protocol/rlp/discussions).
