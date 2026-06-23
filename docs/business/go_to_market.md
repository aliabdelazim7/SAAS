# Go-To-Market (GTM) & Localization Strategy

This document details the market positioning, buyer personas, acquisition channels, pricing models, localized configuration settings, and distribution channels for the multi-tenant SaaS platform.

---

## 1. Target Verticals & Industry Pre-sets

To maximize conversion and reduce friction during signup, we target specific SMB niches and provide **one-click industry pre-sets**:

```
                              ┌────────────────────────┐
                              │    New Signup User     │
                              └───────────┬────────────┘
                                          │ Selects Industry
                 ┌────────────────────────┼────────────────────────┐
                 ▼                        ▼                        ▼
       ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
       │   Tailoring Shop  │    │      Garage       │    │     Restaurant    │
       ├───────────────────┤    ├───────────────────┤    ├───────────────────┤
       │ - Dynamic fields: │    │ - Dynamic fields: │    │ - Dynamic fields: │
       │  Shoulder, Sleeve │    │  VIN, Plate No.   │    │  Tables, Kitchen  │
       │ - Active: CRM,    │    │ - Active: Tasks,  │    │ - Active: POS,    │
       │  Sales, Billing   │    │  Inventory, Sales │    │  Printer, Reports │
       └───────────────────┘    └───────────────────┘    └───────────────────┘
```

1. **Tailoring Shops (Service-Heavy)**:
   - *Onboarding Pre-set*: Automatically activates CRM, Billing, and SMS modules.
   - *Dynamic Schema Configuration*: Extends `customers.attributes` with custom fields for body measurements (e.g., chest width, sleeve length, collar size).
2. **Auto Garages / Workshops (Task-Heavy)**:
   - *Onboarding Pre-set*: Activates Inventory, Tasks, Purchases, and CRM.
   - *Dynamic Schema Configuration*: Extends `sales.attributes` with vehicle identifiers (e.g., license plate, VIN, model year).
3. **Restaurants / Cafes (POS-Heavy)**:
   - *Onboarding Pre-set*: Activates POS, Products, and Invoicing.
   - *Dynamic Configuration*: Configures immediate receipt printer outputs and custom table layout maps.

---

## 2. Customer Acquisition Channels

We deploy a multi-channel acquisition strategy targeting different customer acquisition cost (CAC) brackets:

```
                  ┌────────────────────────────────────────┐
                  │      Customer Acquisition Funnel       │
                  └──────────────────┬─────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
  ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
  │ Product-Led   │           │ Indirect /    │           │ Direct B2B    │
  │ Growth (PLG)  │           │ Partnerships  │           │ Field Sales   │
  ├───────────────┤           ├───────────────┤           ├───────────────┤
  │ - 14-day Trial│           │ - Accountant  │           │ - Mid-market  │
  │ - SEO blogs   │           │   Affiliates  │           │   Warehouses  │
  │ - App Stores  │           │ - Local payment│           │ - Factory     │
  │   (Shopify)   │           │   gateways    │           │   operators   │
  └───────────────┘           └───────────────┘           └───────────────┘
```

1. **Product-Led Growth (PLG)**:
   - *Self-Service Signup*: 14-day free trial, no credit card required on lower tiers.
   - *SEO Organic Growth*: Search engine optimized pages focusing on transactional keywords: *"Best ERP for tailoring shop in Riyadh"*, *"Automated inventory software for warehouse in Dubai"*.
   - *Marketplace Integrations*: Build connector apps listed on Shopify, Salla, and Zid App Marketplaces.
2. **Accountant Partner Program**:
   - Partner with freelance accounting firms and regional financial auditors. We offer a reseller dashboard: accountants receive a 15% lifetime recurring commission for every business they onboard.
3. **Local Payment & Shipping Gateway Integrations**:
   - In the GCC region, we partner with **Tabby/Tamara** (Buy Now Pay Later), **PayTabs/Tap** (payment gateways), and **Aramex/SMSA** (logistics). Promoting these native integrations attracts retailers who want a pre-integrated local solution.

---

## 3. Localization Strategy (GCC focus)

The platform is designed to prioritize LTR/RTL markets (English/Arabic), focusing on the GCC (Gulf Cooperation Council) countries (Saudi Arabia, UAE, Kuwait, Qatar, Oman, Bahrain).

### 3.1 RTL Interface Execution
- **Layout Direction**: The app uses Tailwind Logical Properties to transition dynamically between RTL and LTR based on language selection:
  ```html
  <div class="ps-4 pe-2 text-start">
  ```
  - *Arabic (RTL)*: Compiles to `padding-right: 1rem; padding-left: 0.5rem; text-align: right;`
  - *English (LTR)*: Compiles to `padding-left: 1rem; padding-right: 0.5rem; text-align: left;`
- **Fonts**:
  - *English*: `Outfit` or `Inter` (sans-serif).
  - *Arabic*: `Cairo` or `Tajawal` (optimal for rendering numbers and labels clearly in Arabic).

### 3.2 Regional Compliance Configurations
* **VAT (Value Added Tax)**: Default tax templates preconfigured at 15% for Saudi Arabia and 5% for the UAE.
* **E-Invoicing Compliance (ZATCA)**: In Saudi Arabia, business owners must submit invoices electronically to ZATCA. The API outputs XML files, signs them using cryptographic certificates, and encodes a Base64 QR code containing the business name, VAT registration, timestamp, and tax totals.
* **Arabic PDF Layouts**: PDF invoice generator servers (Puppeteer) use custom Arabic typography fonts to prevent letter fragmentation in RTL text block exports.
