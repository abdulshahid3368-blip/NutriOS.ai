# Security Specification for NutriOS AI Firestore

## 1. Data Invariants
- **User Profiles**: Accessible only by the owner of the account (matching their Firebase Authentication user ID) or by the platform administrator.
- **System/Admin Configs**: Anyone (including guests) can read the configuration to evaluate subscription tiers and feature flags in real-time, but only the platform administrator (`abdulshahid3368@gmail.com`) can write or update settings.

## 2. The "Dirty Dozen" Threat Vectors Covered
1. **Unauthorized Config Edit**: Anonymous or non-admin users attempting to edit the `admin_configs/system_settings` document. (Blocked by `isAdmin()` check on write).
2. **Identity Spoofing**: Users reading other user's profile documents. (Blocked by `isOwner(userId)` check).
3. **Ghost Field Injections**: Write bypasses trying to set properties without being authorized.
4. **Admin Escalation**: Users trying to set their own profile to be an administrator within the client. (Admin checks are done on the server using hardcoded email in rules).
5. **PII Harvesting**: Bulk reading the `/users` collection. (Blocked by strict single-document rules and no list permission for general users).
6. **Denial of Wallet (DoW) Attacks**: Malicious list queries or recursive database reads. (Evaluated in strict security order).
7. **Cross-Tenant Leakage**: Read/write access between tenant boundaries.
8. **Unauthenticated Access**: Guests writing to user documents.
9. **Fake Email Validation**: Spoofing standard admin roles.
10. **Orphaned Profile Records**: Creation of users in wrong namespaces.
11. **Path Variable Exploitations**: Injecting wildcards or incorrect IDs into path rules.
12. **Tampering with Coupons/Pricing**: Regular users overwriting pricing or adding active coupons.
