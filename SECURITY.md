# Security Notes

## Dependency Audit Status

`npm audit --omit=dev` currently reports `GHSA-qx2v-qp2m-jg93` for `postcss <8.5.10`.
The vulnerable package is pulled in by Next.js:

- Current stable lock: `next@15.5.19`
- Next internal dependency: `postcss@8.4.31`
- npm's suggested `audit fix --force` action downgrades Next to `9.3.3`, which is a breaking and unsafe framework downgrade for this application.

We intentionally do not apply that forced downgrade.

## Current Risk Assessment

AlphaProof Arena does not accept user-supplied CSS or expose a CSS processing endpoint. The affected PostCSS path is part of the Next.js build/runtime toolchain, not an application feature that transforms untrusted CSS input.

## Remediation Plan

The project will upgrade Next.js as soon as a stable release ships with `postcss >=8.5.10`.
As of June 3, 2026:

- Latest stable Next.js still pins `postcss@8.4.31`.
- Next.js canary has moved to `postcss@8.5.10`, but canary is not used for the hackathon demo because it increases regression risk.

Run the following before final submission and after dependency updates:

```bash
npm audit --omit=dev
npm run lint
npm run test
npm run build
```
