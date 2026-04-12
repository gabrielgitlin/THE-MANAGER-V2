# Document Signing Feature — Design Spec

## Overview

A fully self-contained document signing system built into the Legal tab. Supports internal users signing in-app and external parties signing via secure link. No third-party e-sign services — everything runs through the existing Supabase infrastructure.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Architecture | Supabase-native (DB + Edge Functions + Storage) | Leverages existing stack, no extra infrastructure |
| Signer types | Internal (logged-in) + External (secure link) | Music management needs both team and external parties |
| Compliance level | Advanced e-signatures | Email OTP verification, tamper-evident PDF, audit trail |
| Signing order | Configurable parallel or sequential per document | Different contracts need different flows |
| Email delivery | Resend (via Supabase Edge Functions) | Simple API, good TypeScript support, generous free tier |
| Identity verification | Email OTP (6-digit code) | Industry standard, no extra cost, ESIGN Act compliant |
| Post-signing | Flatten signatures into PDF + audit certificate | Gold standard — portable, self-contained proof |
| Reminders | Manual (sender-triggered) + expiration dates | Simple for now, automation can be added later |

---

## Database Schema

### `signing_requests`

The core record for each document sent for signing.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Unique identifier |
| `document_id` | uuid FK → legal_documents | Source document |
| `status` | text | draft / pending / completed / voided / expired |
| `signing_order` | text | parallel / sequential |
| `current_order_step` | integer | Current step in sequential flow (null for parallel) |
| `subject` | text | Email subject line |
| `message` | text | Custom message to signers |
| `expires_at` | timestamptz | Optional expiration date |
| `created_by` | uuid FK → auth.users | Sender |
| `created_at` | timestamptz | Creation timestamp |
| `completed_at` | timestamptz | When all parties finished signing |
| `signed_pdf_path` | text | Storage path to final flattened PDF |

### `signing_recipients`

Each person who needs to sign.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Unique identifier |
| `signing_request_id` | uuid FK → signing_requests | Parent request |
| `name` | text | Signer's display name |
| `email` | text | Signer's email address |
| `role` | text | Role label (e.g., "Artist", "Venue Manager") |
| `order_index` | integer | Position in sequential flow |
| `status` | text | pending / notified / viewed / signed / declined |
| `access_token` | uuid | Unique token for signing link (UUID v4) |
| `otp_code` | text | Current OTP code (hashed) |
| `otp_expires_at` | timestamptz | OTP expiration |
| `otp_verified` | boolean | Whether OTP has been verified this session |
| `otp_attempts` | integer | Failed OTP attempts (max 3) |
| `signed_at` | timestamptz | When they completed signing |
| `ip_address` | text | IP at time of signing |
| `user_agent` | text | Browser user agent at signing |
| `user_id` | uuid FK → auth.users | Nullable — populated for internal users |

### `signing_fields`

Field definitions placed on document pages.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Unique identifier |
| `signing_request_id` | uuid FK → signing_requests | Parent request |
| `recipient_id` | uuid FK → signing_recipients | Who fills this field |
| `type` | text | signature / initial / date / text / checkbox |
| `page` | integer | Document page number |
| `x` | numeric | X position on page |
| `y` | numeric | Y position on page |
| `width` | numeric | Field width |
| `height` | numeric | Field height |
| `required` | boolean | Whether field must be completed |
| `label` | text | Optional label displayed near field |

### `signing_field_responses`

Completed field values from signers.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Unique identifier |
| `field_id` | uuid FK → signing_fields | Which field was completed |
| `recipient_id` | uuid FK → signing_recipients | Who completed it |
| `value` | text | Text/date/checkbox value |
| `signature_data` | text | Base64 PNG for signature/initial fields |
| `completed_at` | timestamptz | When the field was completed |

### `signing_audit_logs`

Immutable event trail for compliance.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Unique identifier |
| `signing_request_id` | uuid FK → signing_requests | Related request |
| `recipient_id` | uuid FK → signing_recipients | Related recipient (nullable for system events) |
| `event` | text | created / sent / viewed / otp_verified / field_completed / signed / completed / voided / reminder_sent / expired |
| `ip_address` | text | IP address |
| `user_agent` | text | Browser user agent |
| `metadata` | jsonb | Additional event-specific data |
| `created_at` | timestamptz | Event timestamp |

### RLS Policies

- **signing_requests**: Authenticated users can read/create requests for documents they have access to. No direct anon access — external signers interact via Edge Functions (service role key).
- **signing_recipients**: Authenticated users can read recipients for their requests. No direct anon access.
- **signing_fields**: Same as recipients.
- **signing_field_responses**: Authenticated users can read all responses for their requests. Inserts happen via Edge Functions.
- **signing_audit_logs**: Insert-only (no updates or deletes). Authenticated users can read logs for their requests.

**External signer access model:** The `/sign/:access_token` page does NOT query Supabase directly with the anon key. All data access goes through Edge Functions that validate the access_token and use the service role key. This avoids complex anon RLS rules and keeps the security boundary in server-side code.

---

## Signing Flow — End to End

### Sender Side (In-App)

1. **Initiate** — Sender opens a document from the legal tab, clicks "Send for Signature"
2. **Recipients** — Add signers with name, email, and role. Choose parallel or sequential order.
3. **Fields** — Place signature/initial/date/text/checkbox fields on document pages. Assign each field to a specific recipient.
4. **Message** — Customize email subject and body. Set optional expiration date.
5. **Review & Send** — Preview everything and confirm.

**On send:**
- Create `signing_request`, `signing_recipients`, and `signing_fields` records
- Generate unique `access_token` (UUID v4) per recipient
- Parallel: email all recipients immediately
- Sequential: email only the first recipient (order_index = 0)
- Log `created` and `sent` audit events
- Document status updates to "Out for Signature"

### Signer Side (Secure Link)

1. **Click link** — Opens `/sign/:access_token` (public route in React app)
2. **Landing** — Shows document title, sender name, message. Signer enters their email.
3. **OTP Verification** — 6-digit code sent to email. 3 attempts max, expires after 10 minutes. Can request new code once per minute.
4. **Document Signing** — Full document viewer with their assigned fields highlighted. Other signers' completed fields shown as filled (not editable). Progress bar shows completion. Signature fields open a canvas modal.
5. **Review & Confirm** — Summary of completed fields. Legal consent checkbox: "I agree that my signature is legally binding." Click "Finish Signing."
6. **Confirmation** — Success screen with option to download a copy.

**On signing completion:**
- Save field responses to `signing_field_responses`
- Log `signed` event with IP, user agent, timestamp
- Update recipient status to `signed`
- Sequential: notify next recipient in order
- If all recipients done: trigger PDF finalization

### Sequential Flow Detail

- `current_order_step` on the signing request tracks progress
- When recipient at step N signs, increment to N+1 and email the next recipient
- If a recipient declines, the entire request stalls (sender must void or reassign)

---

## External Signing Page (`/sign/:access_token`)

### Security Model

- Access token is UUID v4 (unguessable, 122 bits of entropy)
- OTP required before any document content is shown
- Token tied to a single recipient record — can only access their fields
- Expired/voided requests show an error page immediately
- All actions logged with IP + user agent
- Internal users can either: (a) use the link+OTP flow like external signers, or (b) sign directly in-app while logged in (skips OTP since they're already authenticated). Both paths are logged identically in the audit trail.
- External signers never query Supabase directly — all access goes through Edge Functions with service role key

### OTP Flow

- Signer enters their email on the landing page
- If email matches the recipient record, Edge Function generates a 6-digit code
- Code is hashed (bcrypt) and stored in `otp_code` with `otp_expires_at` set to now + 10 minutes
- Code sent via Resend
- Signer enters code — verified against hash
- `otp_attempts` incremented on failure, locked after 3 failures
- On success: `otp_verified` set to true, audit log entry created

### Document Viewer

- Uses `pdf.js` (Mozilla's PDF rendering library) to render each page as a canvas element
- PDF fetched via Edge Function (returns a signed URL or streams the file) after OTP verification
- Overlays interactive fields for the current signer as positioned HTML elements on top of the rendered pages
- Shows other signers' completed fields as read-only
- Signature/initial fields open a canvas drawing modal
- Required field validation before "Finish Signing" is enabled

---

## PDF Generation & Audit Certificate

### Flattening Process (Supabase Edge Function)

Triggered when the last signer completes:

1. Fetch original PDF from Supabase Storage
2. Use `pdf-lib` to overlay each field response onto the correct page at correct coordinates
3. Signature/initial images embedded as PNG into the PDF
4. Text/date values rendered as text at field positions
5. Checkbox values rendered as checkmark glyphs

### Audit Certificate (Appended Final Page)

Contains:
- Document title and signing request ID
- Signing timeline table: recipient name, email, role, signed timestamp, IP address, verification method ("Email OTP")
- Document fingerprint: SHA-256 hash of the original PDF
- Completion timestamp
- Generated-by line with app name

### Storage

- Original PDF stays untouched
- Flattened signed PDF saved to `signed/{signing_request_id}.pdf` in Supabase Storage
- `signed_pdf_path` updated on the signing request record
- Both versions accessible from the document detail view
- Completed PDF emailed to all parties via Resend

---

## Email Templates

### 5 Email Types (via Resend)

All sent through a single Edge Function (`send-signing-email`) that accepts `type`, `recipient`, and `signing_request_id`.

1. **Signing Request** — "You've been asked to sign [Document Title]." Sender name, custom message, prominent "Review & Sign" button linking to `/sign/:access_token`.

2. **OTP Code** — "Your verification code is [CODE]." Plain and short. Code and expiration time only.

3. **Reminder** — "Reminder: [Document Title] is waiting for your signature." How long it's been pending, expiration date if set. Triggered manually by sender.

4. **Completed** — "All parties have signed [Document Title]." Sent to all recipients when last signer finishes. Flattened PDF with audit certificate attached.

5. **Voided** — "[Document Title] has been voided." Sent to all recipients when sender cancels.

### Email Configuration

- From address: configurable (e.g., `signing@yourapp.com`)
- HTML templates with inline CSS for email client compatibility
- Resend API called from Edge Function

---

## Integration with Existing UI

### Modified Files

**Legal.tsx:**
- Add "Signing Status" column to document list (pending/completed/none)
- Add "Send for Signature" action on documents
- Add signing status detail panel in document view

**SignaturePreparationModal.tsx:**
- Refactor to save real data instead of simulating
- Wire up to `signing_requests`, `signing_recipients`, `signing_fields` tables
- Add signing order toggle (parallel/sequential)
- Add expiration date picker
- Replace simulated send with real Edge Function call

**SignatureEmailPreview.tsx:**
- Repurpose core signing UI components (document viewer, field rendering, signature canvas) into the real external signing page
- Keep email preview as a sender-side preview during preparation

### New Files

- `/src/pages/Sign.tsx` — Public signing page (landing, OTP, document viewer, signing flow)
- `/src/lib/signingService.ts` — API layer for all signing operations
- 3-4 Supabase Edge Functions:
  - `send-signing-email` — Email dispatch via Resend
  - `verify-signing-otp` — OTP generation and verification
  - `finalize-signing` — PDF flattening, audit certificate generation, completion handling
  - `create-signing-request` — Request creation with validation
- 1 Supabase migration file for all new tables

### Unchanged

- AddDocumentModal, ContractAnalysisModal, PerformanceAgreementEditor — no changes
- Document upload, notes, AI analysis — unchanged
- `legal_documents` table — referenced via FK only, not modified

---

## Supabase Edge Functions

### `create-signing-request`
- Validates document exists and user has access
- Creates signing_request, recipients, and fields in a transaction
- Generates access tokens
- Triggers email sending for first batch of recipients
- Returns the created signing request

### `send-signing-email`
- Accepts email type, recipient ID, and signing request ID
- Renders the appropriate HTML template
- Sends via Resend API
- Logs audit event

### `verify-signing-otp`
- Accepts access_token and entered OTP code
- Validates token, checks attempts, verifies code hash
- Returns success/failure with remaining attempts
- Logs verification event

### `finalize-signing`
- Triggered when last recipient signs
- Fetches original PDF and all field responses
- Uses pdf-lib to flatten signatures/fields into PDF
- Generates and appends audit certificate page
- Uploads to Supabase Storage
- Sends completion email to all parties
- Updates signing request status to completed

---

## Sender Dashboard Features

Within the existing legal document detail view:

- **Status overview** — Visual indicator of signing progress (e.g., "2 of 3 signed")
- **Per-recipient status** — Table showing each signer's name, email, status, and signed timestamp
- **Send reminder** — Button per unsigned recipient, calls send-signing-email Edge Function
- **Void** — Cancel the entire signing request, invalidate all links, notify all parties
- **Download** — Once completed, download the flattened PDF with audit certificate
- **View audit log** — Expandable section showing the full event trail

---

## Expiration Handling

- Sender sets optional `expires_at` during preparation
- On signing page load: if `expires_at` has passed, show error page and update status to `expired`
- Expired requests cannot be signed — links are dead
- Sender can void and re-send if a request expires
- No automated expiration check — status updates lazily on page load
