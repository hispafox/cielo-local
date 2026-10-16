---
name: cielo-security-review
description: 'Use when reviewing or answering security questions about Cielo Local, especially HTTP/HTTPS, API calls, URLSearchParams, user-controlled city or location input, parameter injection, response validation, or rendering API data. For broad security scans, use alongside the general security-review skill.'
---

# Cielo Local Security Review

Apply this project-specific checklist to security reviews and focused security questions about the Cielo Local application.

## Workflow

1. Identify the relevant application entry points, API helpers, response parsers, DOM rendering code, tests, and hosting configuration. For a focused question, trace only the involved flow; do not claim a full-project audit.
2. Trace user-controlled values end to end. For city or location search, follow form input through validation and URL construction to the request, then follow API response fields through validation and rendering.
3. For every outbound request:
   - Confirm the scheme, hostname, and path are fixed and use HTTPS.
   - Prefer `URL` and `URLSearchParams` to build request URLs. Confirm user input is a parameter value, not concatenated into a URL, hostname, path, or query string.
   - Check with delimiter-like input such as `&`, `=`, `#`, and `?` that values remain confined to their intended parameter and cannot override other parameters or the destination.
   - Distinguish actual network URLs from protocol-shaped identifiers such as XML or SVG namespaces; a literal `http://` is not by itself evidence of an HTTP request.
4. Check responses for HTTP status and expected structure before use. Treat API-provided names and other strings as untrusted; render them with `textContent` or safe DOM APIs, not `innerHTML`.
5. Separate application API transport from deployment transport:
   - API endpoint schemes belong in the client request configuration and should be HTTPS.
   - The page itself must also be served over HTTPS in production; configure certificates, HTTP-to-HTTPS redirects, and HSTS at the hosting layer.
   - A Content Security Policy `connect-src` allowlist is useful defense in depth, but does not replace HTTPS. Do not claim production transport protections without inspecting or verifying the hosting configuration.
6. Self-verify potential findings by tracing the exact source-to-sink path and checking existing tests or a safe mocked request. Report only exploitable, evidence-backed issues; distinguish checks performed from checks not performed.

## Using the General Security Review

- For `/security-review` or a request for a broad security scan, invoke the general `security-review` skill as a separate, primary review workflow, then apply this checklist as Cielo Local-specific supplementary coverage.
- For a narrow question, apply the relevant steps above without implying that the general skill or a full audit was run.
- The general skill is separate from this project-owned skill. Do not edit or copy third-party skill files when adding project-specific guidance.

## Reporting

State the reviewed scope and conclusion, link exact source locations, explain why an input is or is not exploitable, and include severity and confidence for findings. Do not change application code unless the user asks for remediation.
