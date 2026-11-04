# Assumptions

- A1: Trust name `Company A Charitable Trust`, PAN `AAAAA0000A` and 80G registration `80G-PLACEHOLDER-0000` are fake placeholders, read from env vars.
- A2: Payments, OTP, SMS/email and monthly charges are all mocked. Monthly giving is a test-mode plan record only.
- A3: Financial year runs April to March, in IST. Receipt numbers restart each FY. Format `80G/2026-27/000123` (prefix from env).
- A4: One PDF serves as both receipt and 80G certificate, and the receipt number is the certificate number. The certificate wording is illustrative and must be confirmed by the trust's accountant.
- A5: Donation limits: minimum ₹100, maximum ₹10,00,000 (my choice).
- A6: The brief does not name its 9 districts. Seed 4 real MP districts: Bhopal, Sehore, Raisen, Vidisha.
- A7: Extra schemes, documents lists, help centres and the campaign are invented and flagged `isIllustrative`. The brief's sample data is also illustrative.
- A8: A "re-check at source" hint appears when a scheme's last-checked date is older than 90 days.
- A9: Receipts must be retained for accounting. A deletion request anonymises everything not required. To confirm with the trust's accountant.
- A10: Performance targets (home page about 100 KB JS) and load-test figures are estimates until measured.
- A11: The demo OTP is a fixed code from `DEMO_OTP`, labelled "demo" on screen.
- A12: The finder asks 6 questions: age, marital status, BPL card, SHG membership, pregnancy, district.
- A13: Session auth is a small signed-cookie JWT (`jose` + `bcryptjs`) instead of Auth.js, to save time and avoid edge-runtime pitfalls.
