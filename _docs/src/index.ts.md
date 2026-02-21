<details>
<summary>Documentation Metadata (click to expand)</summary>

```json
{
  "doc_type": "file_overview",
  "file_path": "src/index.ts",
  "source_hash": "12e30f43baa5634b744456e9218fe2f0ba505aad4a2dccf87eed820d622084a9",
  "last_updated": "2026-02-21T06:00:27.247409+00:00",
  "tokens_used": 15857,
  "complexity_score": 6,
  "estimated_review_time_minutes": 20,
  "external_dependencies": [
    "hono",
    "@cloudflare/sandbox"
  ]
}
```

</details>

[Documentation Home](../README.md) > [src](./README.md) > **index**

---

# index.ts

> **File:** `src/index.ts`

![Complexity: Medium](https://img.shields.io/badge/Complexity-Medium-yellow) ![Review Time: 20min](https://img.shields.io/badge/Review_Time-20min-blue)

## 📑 Table of Contents


- [Overview](#overview)
- [Dependencies](#dependencies)
- [Architecture Notes](#architecture-notes)
- [Usage Examples](#usage-examples)
- [Maintenance Notes](#maintenance-notes)
- [Functions and Classes](#functions-and-classes)

---

## Overview

This file bootstraps a Hono application used as the Cloudflare Worker entrypoint for hosting Moltbot inside a Cloudflare Sandbox. It composes middleware for request logging, sandbox initialization (via @cloudflare/sandbox), environment validation, and Cloudflare Access authentication, then mounts route collections for public UI, API, admin, debug, and CDP endpoints. Public routes are intentionally mounted before Access middleware so they remain accessible without authentication.

The module contains logic to lazy-start the Moltbot gateway in the sandbox: for browser (HTML) requests it can trigger startup in the background and serve a loading page immediately; for non-HTML or WebSocket requests it waits for the gateway to be ready and returns a JSON 503 on failure. HTTP requests are proxied into the container with containerFetch; WebSocket upgrades use sandbox.wsConnect plus a WebSocketPair to relay messages. Container->client messages may be inspected and transformed (e.g., error message redaction), and close reasons are truncated to comply with WebSocket limits. A scheduled handler syncs container state to R2 for durability.

## Dependencies

### External Dependencies

| Module | Usage |
| --- | --- |
| `hono` | Imports { Hono } and constructs the main web application: const app = new Hono<AppEnv>(); used to register middleware, routes, and exported as app.fetch in the default export. |
| `@cloudflare/sandbox` | Imports getSandbox, Sandbox, and type SandboxOptions. getSandbox(...) is used to obtain or create a named sandbox container for 'moltbot' (used in middleware and scheduled cron). The returned sandbox is used to call sandbox.wsConnect(request, MOLTBOT_PORT), sandbox.containerFetch(request, MOLTBOT_PORT), and passed to gateway helpers like ensureMoltbotGateway, findExistingMoltbotProcess, and syncToR2. Sandbox and SandboxOptions types are used in signatures and the file also re-exports Sandbox. |

### Internal Dependencies

| Module | Usage |
| --- | --- |
| [./types](.././types.md) | Imports type definitions { AppEnv, MoltbotEnv } used for typing the Hono app generic (AppEnv) and function parameters/return types (MoltbotEnv) including scheduled(_: ScheduledEvent, env: MoltbotEnv,...). |
| [./config](.././config.md) | Imports { MOLTBOT_PORT } constant used as the TCP port target when calling sandbox.wsConnect(...) and sandbox.containerFetch(...). |
| [./auth](.././auth.md) | Imports createAccessMiddleware which is invoked inside a middleware to create Cloudflare Access authentication behavior (accepts options { type: 'html'|'json', redirectOnMissing }) and applied to protected routes. |
| [./gateway](.././gateway.md) | Imports ensureMoltbotGateway, findExistingMoltbotProcess, and syncToR2. ensureMoltbotGateway(sandbox, env) is called to start/wait for the Moltbot gateway in the sandbox. findExistingMoltbotProcess(sandbox) checks if the gateway is already running to decide whether to serve a loading page. syncToR2(sandbox, env) is used by the scheduled cron handler to persist container state/config to R2. |
| [./routes](.././routes.md) | Imports route collections publicRoutes, api, adminUi, debug, and cdp and mounts them with app.route('/') (publicRoutes), app.route('/api', api), app.route('/_admin', adminUi), app.route('/debug', debug) and app.route('/cdp', cdp). The routes are not implemented here but are registered to the Hono application. |
| [./assets/loading.html](.././assets/loading.html.md) | Imports loadingPageHtml (a string) and is returned as HTML when a browser request arrives and the Moltbot gateway is not yet ready; used in the initial UX while ensureMoltbotGateway is started in the background via c.executionCtx.waitUntil(...). |
| [./assets/config-error.html](.././assets/config-error.html.md) | Imports configErrorHtml (a string with placeholder {{MISSING_VARS}}) and is used to render a human-friendly HTML page when required environment variables are missing; the code replaces the placeholder with a comma-separated list of missing vars and returns HTTP 503. |

## 📁 Directory

This file is part of the **src** directory. View the [directory index](_docs/src/README.md) to see all files in this module.

## Architecture Notes

- Uses Hono as the routing framework and composes middleware with app.use(...) for cross-cutting concerns: request logging, sandbox initialization, environment validation, and Cloudflare Access authentication. Public routes are mounted before Access middleware so they remain unauthenticated.
- Sandbox lifecycle management is centralized via getSandbox(...). buildSandboxOptions reads SANDBOX_SLEEP_AFTER to produce either { keepAlive: true } for 'never' or { sleepAfter } for a duration string. This design separates cost-control (sleeping the container) concerns from request handling logic.
- WebSocket proxying uses sandbox.wsConnect to open a container-side WebSocket and WebSocketPair to create a client-side connection. Messages are relayed bidirectionally with interception on container->client messages to transform error text (transformErrorMessage). Close reasons are truncated to 123 bytes to comply with WebSocket spec.
- Startup and background work: for HTML requests where the gateway is not yet ready, the worker triggers ensureMoltbotGateway in the background using c.executionCtx.waitUntil(...) and immediately serves loadingPageHtml, avoiding blocking the request while the container starts. For non-HTML or WebSocket requests the worker waits for ensureMoltbotGateway to complete, returning a 503 JSON error if the gateway fails to start.
- Error handling and observability: the worker logs request-level events (sanitized: method and pathname only), container lifecycle events, and errors. It intentionally avoids logging query strings or message payloads to reduce leakage of sensitive tokens. When config validation fails it returns either an HTML page or a JSON payload depending on the Accept header.

## Usage Examples

### Browser loads the web UI at root when Moltbot gateway is not started

A GET request for '/' hits the publicRoutes first. The middleware initializes the sandbox and checks for an existing Moltbot process. If the gateway is not running and the request accepts HTML, the worker triggers ensureMoltbotGateway(sandbox, env) in the background (c.executionCtx.waitUntil) and immediately responds with loadingPageHtml. The container is started asynchronously; subsequent requests will detect the running gateway and will be proxied via sandbox.containerFetch.

### WebSocket client connects to real-time Moltbot endpoint

An Upgrade: websocket request arrives. The worker ensures the gateway is running (ensureMoltbotGateway) and then calls sandbox.wsConnect(request, MOLTBOT_PORT) to establish a container-side WebSocket. It creates a WebSocketPair, accepts both sides, and relays messages. Container->client messages are JSON-inspected and, if they contain parsed.error.message, transformErrorMessage is applied using the request host. Close events are proxied and the close reason is truncated to 123 bytes to comply with WebSocket limits.

### Scheduled backup sync from container to R2

Cloudflare cron triggers the exported scheduled function. It builds sandbox options via buildSandboxOptions(env), obtains the sandbox with getSandbox(...), and calls syncToR2(sandbox, env). The function logs success with result.lastSync or logs error details; syncToR2 is responsible for persisting Moltbot config/state assets to R2 for durability.

## Maintenance Notes

- Performance considerations: keeping the sandbox alive (SANDBOX_SLEEP_AFTER='never') reduces cold-start overhead but increases cost; using a duration string will sleep the container after inactivity and reduce cost at the expense of cold starts.
- Common pitfalls: ensure required environment variables (ANTHROPIC_API_KEY or AI_GATEWAY_API_KEY + AI_GATEWAY_BASE_URL, CF_ACCESS_* variables, MOLTBOT_GATEWAY_TOKEN) are set or the worker will return configuration errors. DEV_MODE='true' disables env validation to aid local development.
- Testing and edge cases: test WebSocket flows thoroughly (message relay, error transformation, close code/ reasons) and simulate OOM/startup failures to verify user-facing hints. Confirm that close reason truncation matches client expectations and does not leak sensitive details.
- Security: logging deliberately excludes query parameters and message payloads. Access protection is provided via createAccessMiddleware and public routes are mounted before access middleware. Be careful when toggling DEBUG_ROUTES and DEV_MODE as they relax protections.
- Future improvements: expose more granular metrics for container health and startup times; add configurable timeouts for ensureMoltbotGateway waits; add retries/backoff for syncToR2 and more detailed error telemetry for gateway failures.

---

## Navigation

**↑ Parent Directory:** [Go up](_docs/src/README.md)

---

*This documentation was automatically generated by AI ([Woden DocBot](https://github.com/marketplace/ai-document-creator)) and may contain errors. It is the responsibility of the user to validate the accuracy and completeness of this documentation.*


---

## Functions and Classes


#### function transformErrorMessage

![Type: Sync](https://img.shields.io/badge/Type-Sync-green)

### Signature

```typescript
function transformErrorMessage(message: string, host: string): string
```

### Description

Returns a user-friendly error message by inspecting the provided error text and substituting more helpful instructions for specific known error substrings.


This function checks the provided message string for specific substrings and, when matched, returns a formatted, more user-friendly string that includes the supplied host. It looks for two classes of conditions: (1) if the message contains either 'gateway token missing' or 'gateway token mismatch', it returns an 'Invalid or missing token' message with a URL containing a placeholder token; (2) if the message contains 'pairing required', it returns a 'Pairing required' message pointing to the host's /_admin/ path. If none of the checked substrings are present, the original message is returned unchanged. The checks use String.prototype.includes and perform simple substring matching.

### Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `message` | `string` | ✅ | The original error message text to inspect and potentially transform.
<br>**Constraints:** Must be a string (function calls String.prototype.includes on it), Function behavior depends on substring presence: 'gateway token missing', 'gateway token mismatch', 'pairing required' |
| `host` | `string` | ✅ | Host name used to construct URLs in the transformed messages (inserted into returned strings).
<br>**Constraints:** Must be a string, Should be a valid hostname or host:port to produce sensible URLs |

### Returns

**Type:** `string`

A transformed, user-friendly error message if a known substring is detected; otherwise the original message is returned.


**Possible Values:**

- The original message (if no known substrings are found)
- "Invalid or missing token. Visit https://<host>?token={REPLACE_WITH_YOUR_TOKEN}" (if message contains 'gateway token missing' or 'gateway token mismatch')
- "Pairing required. Visit https://<host>/_admin/" (if message contains 'pairing required')

### Usage Examples

#### Transform a gateway token error into a helpful instruction

```typescript
transformErrorMessage('gateway token missing: expected X', 'example.com')
```

Returns 'Invalid or missing token. Visit https://example.com?token={REPLACE_WITH_YOUR_TOKEN}' because the message contains 'gateway token missing'.

#### Leave unknown messages unchanged

```typescript
transformErrorMessage('unexpected server error', 'example.com')
```

Returns the original message 'unexpected server error' because it does not match any checked substrings.

#### Transform a pairing required message

```typescript
transformErrorMessage('pairing required: please pair device', 'localhost:3000')
```

Returns 'Pairing required. Visit https://localhost:3000/_admin/' because the message contains 'pairing required'.

### Complexity

Time: O(n) where n is the length of the input message (due to substring checks using includes). Space: O(1) additional space excluding the returned string; returned string size depends on host length but is proportional to input sizes.

### Notes

- Matching is case-sensitive because String.prototype.includes is used directly.
- The function does not validate or sanitize the host string; callers should ensure host is safe and correctly formatted for inclusion in a URL.
- The returned token placeholder is the literal string '{REPLACE_WITH_YOUR_TOKEN}'.

---



#### function validateRequiredEnv

![Type: Sync](https://img.shields.io/badge/Type-Sync-green)

### Signature

```typescript
function validateRequiredEnv(env: MoltbotEnv): string[]
```

### Description

Inspect the provided environment object and return a list of required environment variable names (or messages) that are missing according to the function's checks.


The function validates a set of required environment variables on the given MoltbotEnv object. It initializes an empty array named missing, then checks for the presence (truthiness) of specific properties on env: MOLTBOT_GATEWAY_TOKEN, CF_ACCESS_TEAM_DOMAIN, and CF_ACCESS_AUD. It then enforces a conditional requirement for AI gateway vs direct Anthropic configuration: if AI_GATEWAY_API_KEY is present, AI_GATEWAY_BASE_URL must also be present (otherwise a descriptive message about AI_GATEWAY_BASE_URL is added); if AI_GATEWAY_API_KEY is absent, the function requires ANTHROPIC_API_KEY (adds 'ANTHROPIC_API_KEY or AI_GATEWAY_API_KEY' to missing). After performing these checks it returns the accumulated missing array.

### Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `env` | `MoltbotEnv` | ✅ | An object containing environment configuration properties (expected to include keys like MOLTBOT_GATEWAY_TOKEN, CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD, AI_GATEWAY_API_KEY, AI_GATEWAY_BASE_URL, ANTHROPIC_API_KEY).
<br>**Constraints:** This function reads properties by truthiness; values that coerce to false (e.g., empty string, null, undefined, 0, false) are treated as missing., The env object must have properties with the exact names used in the checks for detection to work. |

### Returns

**Type:** `string[]`

An array of strings representing missing required environment variable names or descriptive messages for missing conditional requirements. If all checks pass, the array is empty.


**Possible Values:**

- [] (when no required values are missing)
- ['MOLTBOT_GATEWAY_TOKEN']
- ['CF_ACCESS_TEAM_DOMAIN']
- ['CF_ACCESS_AUD']
- ['AI_GATEWAY_BASE_URL (required when using AI_GATEWAY_API_KEY)']
- ['ANTHROPIC_API_KEY or AI_GATEWAY_API_KEY']
- Combinations of the above strings when multiple checks fail

### Usage Examples

#### Validate a complete environment object

```typescript
const missing = validateRequiredEnv({ MOLTBOT_GATEWAY_TOKEN: 'token', CF_ACCESS_TEAM_DOMAIN: 'domain', CF_ACCESS_AUD: 'aud', AI_GATEWAY_API_KEY: 'key', AI_GATEWAY_BASE_URL: 'https://api.example.com' });
```

Demonstrates a call where all required values are present; missing will be an empty array.

#### Validate when using direct Anthropic access

```typescript
const missing = validateRequiredEnv({ MOLTBOT_GATEWAY_TOKEN: 'token', CF_ACCESS_TEAM_DOMAIN: 'domain', CF_ACCESS_AUD: 'aud', ANTHROPIC_API_KEY: '' });
```

Shows that an empty ANTHROPIC_API_KEY is treated as missing; missing will include 'ANTHROPIC_API_KEY or AI_GATEWAY_API_KEY'.

#### Validate AI Gateway usage without base URL

```typescript
const missing = validateRequiredEnv({ MOLTBOT_GATEWAY_TOKEN: 'token', CF_ACCESS_TEAM_DOMAIN: 'domain', CF_ACCESS_AUD: 'aud', AI_GATEWAY_API_KEY: 'key' });
```

When AI_GATEWAY_API_KEY is present but AI_GATEWAY_BASE_URL is not, the returned array includes 'AI_GATEWAY_BASE_URL (required when using AI_GATEWAY_API_KEY)'.

### Complexity

O(1) time and O(1) additional space (constant number of checks independent of input size).

### Notes

- Checks use JavaScript/TypeScript truthiness: empty strings, null, undefined, 0, or false are considered missing.
- The function does not perform type coercion or normalization beyond truthiness checks; it does not validate formats (e.g., URL format) of values.
- Messages returned for missing values are plain strings; callers should not rely on a strict set of variable-name-only strings because one message includes explanatory text for AI_GATEWAY_BASE_URL.

---



#### function buildSandboxOptions

![Type: Sync](https://img.shields.io/badge/Type-Sync-green)

### Signature

```typescript
function buildSandboxOptions(env: MoltbotEnv): SandboxOptions
```

### Description

Normalize env.SANDBOX_SLEEP_AFTER (default 'never') and return SandboxOptions: { keepAlive: true } when 'never', otherwise { sleepAfter: value }.


The function inspects the SANDBOX_SLEEP_AFTER property on the provided env object. It uses optional chaining and toLowerCase() to normalize the value, falling back to the string 'never' when the property is missing or falsy. If the normalized value equals 'never', the function returns an options object with keepAlive: true. For any other normalized value, it returns an options object containing sleepAfter set to that value.

### Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `env` | `MoltbotEnv` | ✅ | Environment/configuration object expected to possibly contain SANDBOX_SLEEP_AFTER.
<br>**Constraints:** If present, env.SANDBOX_SLEEP_AFTER should be a string (the code calls toLowerCase() on it via optional chaining)., The function only reads env; it does not mutate it. |

### Returns

**Type:** `SandboxOptions`

An object describing sandbox lifecycle options. Either { keepAlive: true } when SANDBOX_SLEEP_AFTER is 'never' (or absent), or { sleepAfter: string } with the normalized value otherwise.


**Possible Values:**

- { "keepAlive": true }
- { "sleepAfter": "<lowercased-string>" }

### Usage Examples

#### No SANDBOX_SLEEP_AFTER set on env (defaults to 'never')

```typescript
buildSandboxOptions({ SANDBOX_SLEEP_AFTER: undefined } as MoltbotEnv)
```

Returns { keepAlive: true } because the value defaults to 'never'.

#### SANDBOX_SLEEP_AFTER explicitly set to a duration string

```typescript
buildSandboxOptions({ SANDBOX_SLEEP_AFTER: '30s' } as MoltbotEnv)
```

Returns { sleepAfter: '30s' } after lowercasing the provided value.

#### SANDBOX_SLEEP_AFTER set to 'Never' with mixed case

```typescript
buildSandboxOptions({ SANDBOX_SLEEP_AFTER: 'Never' } as MoltbotEnv)
```

Value is normalized to 'never' and the function returns { keepAlive: true }.

### Complexity

O(1) time complexity and O(1) space complexity — constant-time string checks and object construction.

### Notes

- The function uses optional chaining (env.SANDBOX_SLEEP_AFTER?.toLowerCase()) so a missing or undefined property falls back to the default 'never'.
- The function never mutates the env parameter and performs no I/O.
- The exact shape of MoltbotEnv and SandboxOptions types are not declared in this snippet; documentation above reflects observed usage in this function.

---


