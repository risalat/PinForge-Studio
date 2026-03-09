# Extension to Studio Contract

## Endpoint

`POST /api/generate`

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
  "postId": "cm8...",
  "pins": [
    {
      "id": "cm8...",
      "jobId": "cm8...",
      "templateId": "split-vertical-title",
      "title": "Typography Pairing Ideas for Better Pinterest Pins",
      "description": "Use this pin when you want a clear typography-focused angle for the article.",
      "exportPath": "D:/Vibe Code Projects/Pin Forge Studio/storage/temp/jobs/cm8.../split-vertical-title-0.png",
      "publerPostId": "123456789",
      "scheduledAt": "2026-03-10T12:00:00.000Z",
      "createdAt": "2026-03-09T12:00:00.000Z"
    }
  ]
}
```

Failure:

```json
{
  "ok": false,
  "error": "OpenAI API key is required."
}
```

## Notes

- The Studio backend derives `domain` from `postUrl` if the extension omits it.
- AI generation uses extension-derived provider plumbing, but Studio titles are generated for the
  whole collage pin, not per individual image.
- Studio can store the Publer API key in dashboard settings, but workspace/account/board selection is expected to happen in a later scheduling flow.
- Rendered assets are exposed through temporary Studio URLs so Publer can fetch them with the same `media/from-url` workflow used in the extension.
- The extension can use `POST /api/uploads/temp` with the same bearer key when direct image URLs are
  not sufficient.
