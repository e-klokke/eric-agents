# Input Validation Examples

Input validation has been added to all agent endpoints using Zod schemas. This prevents bad data from reaching the agents and provides clear error messages.

## ✅ What Was Added

1. **`src/shared/validation.ts`** - Zod schemas for all agent inputs
2. **HTTP endpoints** - All `/trigger/*` endpoints now validate input
3. **Telegram bot** - All bot commands now validate input
4. **User-friendly errors** - Clear messages indicating what went wrong

---

## 🧪 Test Examples

### Valid Requests

**Personal Research (HTTP):**
```bash
curl -X POST http://localhost:3000/trigger/research/personal \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR-API-KEY" \
  -d '{"name": "Satya Nadella", "company": "Microsoft"}'
```

**PDC Research (HTTP):**
```bash
curl -X POST http://localhost:3000/trigger/research/pdc \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR-API-KEY" \
  -d '{
    "researchType": "market",
    "targetArea": "Tampa Bay",
    "targetSegment": "wealth management"
  }'
```

**STS Research (HTTP):**
```bash
curl -X POST http://localhost:3000/trigger/research/sts \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR-API-KEY" \
  -d '{
    "companyName": "Acme Healthcare",
    "website": "https://acme.com",
    "contactName": "Jane Doe"
  }'
```

---

### Invalid Requests (Will Be Rejected)

**1. Missing Required Field:**
```bash
curl -X POST http://localhost:3000/trigger/research/personal \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR-API-KEY" \
  -d '{}'
```
**Response:**
```json
{
  "success": false,
  "error": "name: Name is required",
  "timestamp": "2025-12-31T..."
}
```

**2. Invalid Enum Value:**
```bash
curl -X POST http://localhost:3000/trigger/research/pdc \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR-API-KEY" \
  -d '{"researchType": "invalid_type"}'
```
**Response:**
```json
{
  "success": false,
  "error": "researchType: Research type must be: market, lead, or collaboration",
  "timestamp": "2025-12-31T..."
}
```

**3. String Too Long:**
```bash
curl -X POST http://localhost:3000/trigger/research/personal \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR-API-KEY" \
  -d '{
    "name": "A very long name that exceeds the 200 character limit... (repeat 200+ times)",
    "company": "Microsoft"
  }'
```
**Response:**
```json
{
  "success": false,
  "error": "name: Name must be less than 200 characters",
  "timestamp": "2025-12-31T..."
}
```

**4. Invalid URL:**
```bash
curl -X POST http://localhost:3000/trigger/research/sts \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR-API-KEY" \
  -d '{
    "companyName": "Acme Corp",
    "website": "not-a-valid-url"
  }'
```
**Response:**
```json
{
  "success": false,
  "error": "website: Website must be a valid URL",
  "timestamp": "2025-12-31T..."
}
```

**5. Empty String When Required:**
```bash
curl -X POST http://localhost:3000/trigger/research/personal \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR-API-KEY" \
  -d '{"name": "", "company": "Microsoft"}'
```
**Response:**
```json
{
  "success": false,
  "error": "name: Name is required",
  "timestamp": "2025-12-31T..."
}
```

---

## 📋 Validation Rules by Endpoint

### `/trigger/research/personal`
- `name`: **required**, 1-200 characters, trimmed
- `company`: optional, max 200 characters, trimmed
- `context`: optional, max 1000 characters, trimmed

### `/trigger/research/pdc`
- `researchType`: **required**, must be: "market", "lead", or "collaboration"
- `targetArea`: optional, max 200 characters (for market research)
- `targetSegment`: optional, max 200 characters (for market research)
- `athleteName`: optional, max 200 characters (for lead research)
- `sport`: optional, max 100 characters (for lead research)
- `level`: optional, max 100 characters (for lead research)
- `organizationName`: optional, max 200 characters (for collaboration research)
- `collaborationType`: optional, max 100 characters (for collaboration research)

### `/trigger/research/sts`
- `companyName`: **required**, 1-200 characters, trimmed
- `website`: optional, max 500 characters, must be valid URL, trimmed
- `contactName`: optional, max 200 characters, trimmed
- `contactTitle`: optional, max 200 characters, trimmed
- `source`: optional, max 200 characters, trimmed
- `knownNeeds`: optional, max 1000 characters, trimmed

### `/trigger/content/pdc`
- `action`: **required**, must be: "repurpose" or "generate"
- `sourceContent`: optional, max 10000 characters (required for "repurpose")
- `topic`: optional, max 500 characters (required for "generate")
- `pillar`: optional, must be: "hidden_game", "character", "transition", "eric_journey", "parent_education"
- `targetAudience`: optional, must be: "athletes", "parents", "coaches", "general"

### `/trigger/content/sts`
- `action`: **required**, must be: "repurpose" or "generate"
- `sourceContent`: optional, max 10000 characters (required for "repurpose")
- `topic`: optional, max 500 characters (required for "generate")
- `pillar`: optional, must be: "tech_trends", "partner_spotlight", "case_studies", "eric_expertise", "company_culture"
- `partnerFocus`: optional, must be: "cisco", "dell", "oracle", "lenovo", "hp"

---

## 🤖 Telegram Bot Validation

Telegram commands also validate input. Examples:

**Valid:**
```
/research_personal John Smith, Microsoft
/research_pdc_market Tampa Bay, wealth management
/research_sts Acme Corp, https://acme.com, Jane Doe
/content_pdc mental toughness
```

**Invalid (will show error):**
```
/research_personal
❌ name: Name is required

/research_pdc_market
❌ researchType: Research type must be: market, lead, or collaboration

/research_sts
❌ companyName: Company name is required
```

---

## 🔧 Benefits

1. **Security**: Prevents malformed or malicious input
2. **Better UX**: Clear error messages tell users exactly what's wrong
3. **Type Safety**: Validated data has proper TypeScript types
4. **Data Quality**: Ensures agents receive clean, properly formatted data
5. **Debugging**: Easier to trace issues since bad data is caught early

---

## 🚀 Next Steps

Consider adding:
- Rate limiting per user/IP
- Request logging for audit trail
- More specific validation (e.g., email format, phone numbers)
- Validation on nested objects in agent outputs
