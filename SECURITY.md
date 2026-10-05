# Security Policy

## Supported Versions

Security fixes are applied to the default branch.

## Reporting a Vulnerability

Please use GitHub's private vulnerability reporting mechanism for this repository when available. Do not disclose exploitable details in a public issue.

When reporting, include:
- affected component or path
- reproduction steps or proof of concept
- impact and severity assessment
- relevant environment details

Do not include production credentials, access tokens, private customer data, or other secrets.

## Security Engineering

LeadPilot treats model prompts, lead records, conversation content, property data, and model outputs as untrusted input. Provider credentials must remain server-side.

Security automation includes CodeQL, OSV dependency scanning, OpenSSF Scorecard, and Dependabot updates.
