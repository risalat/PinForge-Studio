# PinForge Extension Import Map

The `/extension` clone was used as a temporary source reference only. Studio now owns the adapted
logic below and does not require runtime imports from `/extension`.

| Extension file | Studio file | Status | Notes |
| --- | --- | --- | --- |
| `extension/extension/src/lib/publerClient.ts` | `src/lib/publer/publerClient.ts` | adapted | Core Publer client, auth/workspace headers, account/workspace helpers, media upload, schedule submission, and job status normalization were ported to server-safe Studio code. |
| `extension/extension/src/ui/popup/App.tsx` media upload helpers | `src/lib/publer/publerClient.ts` | adapted | Queue-limit retry handling, job polling, schedule outcome extraction, and failure detection were lifted out of the popup flow into reusable backend helpers. |
| `extension/extension/src/background/service-worker.ts` schedule polling helpers | `src/lib/publer/publerClient.ts` | adapted | Schedule job completion parsing and failure heuristics were ported for Studio’s Publer pipeline. |
| `extension/extension/src/lib/aiClient.ts` | `src/lib/ai/index.ts` | adapted | Provider architecture, request flow, model listing, JSON parsing, and provider-specific request code were ported. Studio-specific title prompting was intentionally changed to whole-pin title variation generation instead of per-image titles. |
| `extension/extension/src/lib/validators.ts` | `src/lib/ai/validators.ts` | copied and extended | Original copy validators were copied; Studio added title-variation validation for whole-pin title generation. |
| `extension/extension/src/lib/types.ts` | `src/lib/types.ts` | intentionally omitted | The referenced file does not exist in the cloned extension. Studio owns its request/auth types directly. |
| extension popup schedule post payload assembly | `src/lib/jobs/generatePins.ts` | adapted | Studio now builds the same `networks.pinterest` and `accounts[]` Publer payload shape using server-side render outputs. |
| extension bearer-style configuration storage expectations | `src/lib/auth/apiKeys.ts`, `src/lib/auth/apiKeyAuth.ts` | adapted for Studio | Studio adds hashed API key generation/validation so the extension can authenticate securely with `Authorization: Bearer <api_key>`. |

## Safe deletion note

Studio no longer depends on runtime imports from `/extension`. After verifying your local build and
workflow, the temporary `/extension` folder can be deleted manually.
