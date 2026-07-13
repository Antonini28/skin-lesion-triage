# Security Policy

## Supported versions

Only the latest code on `main` is supported.

## Reporting a vulnerability

Please **do not open a public issue** for security vulnerabilities.

Email **olisaanthony25@gmail.com** with:

- A description of the vulnerability and its impact
- Steps to reproduce
- Any suggested remediation

You will receive an acknowledgement within 72 hours. Please allow up to 30 days
for a fix before public disclosure.

## Scope notes

- **Secrets:** no API keys or credentials are committed to this repository; all
  configuration is via environment variables (see `backend/.env.example`).
- **LLM safety:** DermBot runs a multi-layer safety pipeline (prompt-injection
  blocking, red-flag symptom escalation, output filtering). Bypasses of this
  pipeline are considered in-scope vulnerabilities.
- **User data:** uploaded images are processed for inference; report any path
  that could persist or leak user-uploaded content unexpectedly.
