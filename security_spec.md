# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Atomic Visit Accounting (`site_stats/global` + `visit_events/{visitId}`)**:
   - `site_stats/global` cannot be incremented by a non-admin unless `count` increases by exactly `+1`, `realVerifiedCount` increases by exactly `+1`, `updatedAt == request.time`, `lastVisitId != 'init_seed'`, and a brand-new `visit_events/{lastVisitId}` is atomically created in the same batch (`existsAfter` & `!exists`).
   - A `visit_events/{visitId}` document cannot be created unless `createdAt == request.time`, all string bounds are respected, zero PII fields exist, and `getAfter(/databases/$(database)/documents/site_stats/global).data.lastVisitId == visitId`.
2. **PII Exclusion & Strict Key Allowlists**:
   - No collection stores visitor emails, phone numbers, street addresses, or IP addresses (only `/admins/{userId}` holds verified operator emails and is restricted to `isAdmin()`).
   - Every `create` enforces `keys().hasAll(...) && keys().hasOnly(...)` and every `update` enforces `isValid[Entity](incoming())` plus `affectedKeys().hasOnly(...)`.
3. **Guestbook Relational Integrity (`guestbook_entries/{entryId}` -> `comments/{commentId}`, `votes/{voterId}`)**:
   - New `guestbook_entries` created by non-admins must initialize `votesCount == 0`, `commentsCount == 0`, `lastInteractionId == 'initial'`, and `createdAt == request.time`.
   - `comments/{commentId}` and `votes/{voterId}` enforce the Master Gate (`exists(/databases/$(database)/documents/guestbook_entries/$(entryId))`) and atomic parent sync (`getAfter` / `existsAfter`).
   - Author, title, content, and `createdAt` on `guestbook_entries` are immutable to non-admins.
4. **Path Hardening & Bounded Strings**:
   - All document IDs (`statId`, `visitId`, `entryId`, `commentId`, `voterId`, `userId`, `docId`) must satisfy `isValidId()` (`size() <= 128 && matches('^[a-zA-Z0-9_\\-]+$')`).
5. **Verified Bootstrapped Admin**:
   - `isAdmin()` checks `/admins/$(request.auth.uid)` OR `(request.auth.token.email == 'tarotistasonline@gmail.com' && request.auth.token.email_verified == true)`. Unverified emails are always rejected.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unlinked Visit Event Spam**: Create `visit_events/fake_1` without updating `site_stats/global` -> `PERMISSION_DENIED`.
2. **Counter Inflation Jump**: Update `site_stats/global` setting `count: 99999` (+500 jump) as non-admin -> `PERMISSION_DENIED`.
3. **Ghost Field Injection (Shadow Update)**: Create `visit_events/v_1` with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
4. **Client Timestamp Forgery**: Create `guestbook_entries/g_1` with backdated `createdAt` not equal to `request.time` -> `PERMISSION_DENIED`.
5. **Pre-inflated Votes on Creation**: Create `guestbook_entries/g_2` with `votesCount: 500` as non-admin -> `PERMISSION_DENIED`.
6. **ID Poisoning Attack**: Create `guestbook_entries/../../admins/hacker` or 500-char ID -> `PERMISSION_DENIED`.
7. **Denial of Wallet Oversized Payload**: Create `guestbook_entries/g_3` with 50,000-char `content` -> `PERMISSION_DENIED`.
8. **Orphaned Comment Write**: Create `guestbook_entries/missing_parent/comments/c_1` where parent does not exist -> `PERMISSION_DENIED`.
9. **Desynchronized Comment Counter**: Create `guestbook_entries/g_1/comments/c_2` without incrementing parent `commentsCount` by `+1` -> `PERMISSION_DENIED`.
10. **Immutable Content Tampering**: Update `guestbook_entries/g_1` modifying `content` or `author` as non-admin -> `PERMISSION_DENIED`.
11. **Unverified Admin Email Spoof**: Attempt `set` on `site_stats/global` with `email: 'tarotistasonline@gmail.com'` and `email_verified: false` -> `PERMISSION_DENIED`.
12. **Unauthorized Admin Table Write**: Attempt to create `/admins/attacker_uid` without existing admin privileges -> `PERMISSION_DENIED`.
