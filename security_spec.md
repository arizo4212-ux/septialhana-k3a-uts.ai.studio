# Security Specification — YSL Beauté & Maison Marketplace

## 1. Data Invariants
1. **Product Integrity (`/products/{productId}`)**:
   - Every product document must have valid `sku`, `name`, `category` (in `['Parfum & Lip Oil', 'Tas & Sepatu', 'Jam Tangan & Baju']`), `subType` (in `['Perfume', 'Lip Oil', 'Tas', 'Sepatu', 'Jam Tangan', 'Baju']`), non-negative `price`, non-negative `stock`, `description`, `volumeOrSize`, `imageUrl`, `featured`, and `updatedAt`.
   - Only verified admins can create, delete, or modify product metadata/pricing.
   - Authenticated verified customers can only decrement `stock` (and update `updatedAt`) during an order checkout when `incoming().stock >= 0 && incoming().stock < existing().stock`.
2. **Customer PII Isolation (`/customers/{customerId}`)**:
   - Contains PII (`email`, `phone`, `address`, `city`, `postalCode`).
   - Strictly readable (`get`, `list`) ONLY by the document owner (`customerId == request.auth.uid` and `resource.data.uid == request.auth.uid`) or a verified Admin (`isAdmin()`).
   - `uid` is immutable and must equal `request.auth.uid` upon creation.
3. **Order & Payment Approval Integrity (`/orders/{orderId}`)**:
   - Contains customer shipping address, order summary, and `paymentProofImage`.
   - Readable (`get`, `list`) ONLY by the customer who placed the order (`resource.data.customerUid == request.auth.uid`) or a verified Admin (`isAdmin()`).
   - Upon creation by a customer, `customerUid` must match `request.auth.uid`, `paymentStatus` must start at `'waiting_approval'`, and `orderStatus` must start at `'pending_verification'`.
   - Customers may only update their payment proof (`paymentProofImage`, `paymentAccountSender`, `paymentReferenceNumber`, `paymentStatus`, `updatedAt`) if the order is not in a terminal state (`completed` or `cancelled`).
   - Only verified Admins can transition `paymentStatus` to `'approved'` or `'rejected'` and update `orderStatus` or `adminNotes`.
4. **Admin Registry (`/admins/{adminId}`)**:
   - Only verified admins (`arizo4212@gmail.com` with `email_verified == true` or existing `/admins/{uid}` document) can read or manage admin records.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing on Order Create**: Authenticated user `user_A` attempts to create an order with `customerUid: "user_B"`. -> `PERMISSION_DENIED`
2. **Self-Approved Payment on Order Create**: Customer attempts to create an order with `paymentStatus: "approved"` and `orderStatus: "completed"`. -> `PERMISSION_DENIED`
3. **Shadow Field Injection on Product Update**: Admin or user sends `{ ...validProduct, ghostAdminFlag: true }`. -> `PERMISSION_DENIED`
4. **Customer Approving Own Payment Proof**: Customer attempts `updateDoc` on `/orders/{orderId}` changing `paymentStatus` to `"approved"`. -> `PERMISSION_DENIED`
5. **PII Blanket Read on Customers**: Authenticated `user_A` attempts `getDoc` or `list` on `/customers/user_B`. -> `PERMISSION_DENIED`
6. **Unauthorized Order Scraping**: Authenticated `user_A` attempts `list` on `/orders` without filtering `where('customerUid', '==', 'user_A')`. -> `PERMISSION_DENIED`
7. **Unverified Email Admin Spoof**: Attacker has `email == "arizo4212@gmail.com"` with `email_verified == false` and attempts to delete a product. -> `PERMISSION_DENIED`
8. **Negative Stock Manipulation**: Customer attempts to update product `stock` to `-5` or increase `stock` to `9999` without admin privilege. -> `PERMISSION_DENIED`
9. **Price Tampering by Customer**: Customer attempts to update product `price` to `1` during checkout stock update. -> `PERMISSION_DENIED`
10. **Resource Poisoning (Oversized String)**: User attempts to create a customer profile with a 10,000-character `name`. -> `PERMISSION_DENIED`
11. **Terminal State Mutation**: Customer attempts to modify `paymentProofImage` on an order where `orderStatus == "completed"`. -> `PERMISSION_DENIED`
12. **Self-Privilege Escalation**: Regular user `user_A` attempts to create `/admins/user_A` to become an admin. -> `PERMISSION_DENIED`
