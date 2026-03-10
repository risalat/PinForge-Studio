# Extension to Studio Contract

## Endpoint

`POST /api/generate`

This endpoint is now an intake endpoint. It stores an intake job for dashboard review and does not
generate pins or publish automatically.

## Authentication

This endpoint requires:

```http
Authorization: Bearer <api_key>
```

The API key must be generated in Studio and copied into the extension settings. Requests without a
valid active key are rejected with `401`.

## Request

```json
{
  "postUrl": "https://example.com/article",
  "title": "How to Design Better Pinterest Pins",
  "domain": "example.com",
  "globalKeywords": ["pinterest templates", "blog graphics"],
  "titleStyle": "balanced",
  "toneHint": "warm editorial",
  "listCountHint": 12,
  "titleVariationCount": 3,
  "images": [
    {
      "url": "https://cdn.example.com/image-1.jpg",
      "alt": "Workspace with moodboard",
      "caption": "This section covers typography pairing.",
      "nearestHeading": "Choose fonts with contrast",
      "sectionHeadingPath": ["Design basics", "Typography"],
      "surroundingTextSnippet": "Use a bold display face with a readable body face."
    }
  ]
}
```

## Validation rules

- `postUrl`: required, valid URL
- `title`: required, non-empty string
- `domain`: optional string
- `images`: required, at least one image object
- `globalKeywords`: optional string array
- `titleStyle`: optional enum: `balanced | seo | curiosity | benefit`
- `toneHint`: optional string
- `listCountHint`: optional positive integer
- `titleVariationCount`: optional positive integer, max 10
- `images[].url`: required, valid URL
- `images[].alt`: optional, max 200 chars
- `images[].caption`: optional, max 500 chars
- `images[].nearestHeading`: optional, max 200 chars
- `images[].sectionHeadingPath`: optional string array, max 12 entries
- `images[].surroundingTextSnippet`: optional, max 1000 chars

## Response

Success:

```json
{
  "ok": true,
  "jobId": "cm8...",
  "status": "RECEIVED",
  "dashboardUrl": "https://pin-forge-studio.vercel.app/dashboard/jobs/cm8..."
}
```

Failure:

```json
{
  "ok": false,
  "error": "Missing Authorization bearer token."
}
```

## Notes

- The Studio backend derives `domain` from `postUrl` if the extension omits it.
- The API key owner becomes the owner of the intake job inside Studio.
- The extension request stores article metadata and incoming image metadata only.
- Pin generation, title generation, description generation, media upload, and scheduling now happen later from dashboard actions.
- When `R2_PUBLIC_BASE_URL` is configured, uploaded temp files and rendered pins return direct R2 public URLs.
- The extension can use `POST /api/uploads/temp` with the same bearer key when direct image URLs are
  not sufficient.
