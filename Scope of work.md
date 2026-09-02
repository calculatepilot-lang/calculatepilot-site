You are a full-stack developer who specializes in WordPress integration, API design, and CRM connector development. Your task is to take over and complete the British Mobile Tyre CRM WordPress connector plugin, building on the existing work already published at https://github.com/calculatepilot-lang/British_Mobile_Tyre_CRM.

## Primary Objectives

1. **Audit the Current State**: Review the README files and existing code in the repository to understand the current architecture, what's been built, what's incomplete, and what gaps remain.

2. **Complete the WordPress Connector Plugin**: Ensure the plugin seamlessly bridges the WordPress website (https://britishmobiletyres.co.uk/) and the CRM so that:
   - Every form submission on any page of the website automatically creates a record in the CRM
   - Form data is accurately mapped and stored
   - Multi-language support is maintained throughout the data flow
   - The plugin handles errors gracefully and logs issues for debugging

3. **Integrate with Google Programmatic Ads**: Build or complete the functionality to:
   - Track leads captured through Google Programmatic Ads campaigns
   - Create conversion actions in the Google Ads account when leads are recorded in the CRM
   - Ensure conversion tracking works reliably so campaign performance can be monitored accurately

4. **Build Financial Management & Reporting in the CRM**: Develop a finance section that tracks:
   - Money in (income received)
   - Money out (expenses), including categories for payments to Suhaib, payments to Faiz, and Google Ads payments
   - Custom expense categories (user-definable, not fixed)
   - Currency conversion: All earnings are in GBP but transfers go to Pakistan, so the system must convert GBP to PKR at current rates on-demand, lock that rate at the time of transfer, and record it for audit purposes
   - Timestamps for all transactions
   - Report generation capability for accounts review and reconciliation

5. **Build the Google Ads Programmatic Search Script Module**: Create a separate Google Ads Script that the CRM will orchestrate, which programmatically builds and manages Search campaigns for BMT Mobile Tyre with the following scope:

   **Campaign Structure:**
   - 10 campaigns targeting 60+ cities across England (city list already provided)
   - Each campaign contains service/vehicle ad groups
   - Resulting structure: **10 campaigns × 5 services × 8 vehicle types = 400 ad groups**

   **Services Covered:**
   - Mobile Tyre Repair
   - Mobile Tyre Replacement
   - Mobile Tyre Change
   - Mobile Tyre Puncture Repair
   - Mobile Tyre Fitting

   **Vehicle Types Covered:**
   - Car
   - Van
   - Caravan
   - Carvan (retained as spelling variation)
   - Truck
   - Bus
   - Trailer
   - Lorry

   **Keyword & Ad Strategy:**
   - Exact Match keywords
   - Phrase Match keywords
   - Near-me keywords
   - Location-intent keywords
   - Vehicle + service keywords
   - Responsive Search Ads
   - Campaign negative keywords

   **Automated Optimization (Post-Launch):**
   - Mine search terms from campaign traffic
   - Add successful search terms as Exact Match keywords
   - Add successful search terms as Phrase Match keywords
   - Add irrelevant search terms as negative keywords
   - Increase CPC for strong keywords losing Ad Rank
   - Reduce CPC for weak keywords
   - Pause expensive non-converting keywords
   - Pause very low Quality Score keywords
   - Pause very weak responsive search ads
   - Export campaign, keyword, search-term, ad, and Quality Score data to Google Sheets

6. **Integrate Claude API for Daily Campaign Optimization**: Connect the Google Ads Script module to Claude API so that:
   - The CRM leverages Claude's Google Ads expertise for continuous daily optimization
   - Daily reports are automatically generated and sent covering budget spend, leads captured, and optimization improvements made
   - Keyword research identifies worthy exact-match and phrase-match keywords to improve ad performance

7. **CRM Monitoring Capability**: Verify that all captured leads, form submissions, financial transactions, and Google Ads campaign performance are accessible and monitorable from within the CRM dashboard.

## Scope & Deliverables

- Identify any incomplete features, bugs, or architectural issues in the existing codebase
- Complete all missing functionality needed for a production-ready connector
- Build the finance module with income, expense, and currency conversion tracking
- Build the Google Ads Programmatic Search Script that creates and manages 400 ad groups across 60+ English cities with the structure and automation defined above
- Integrate the script with Claude API for daily keyword research and campaign optimization
- Write clean, maintainable code with inline documentation
- Test the full flow: WordPress form submission → CRM record creation → Google Ads conversion tracking → Financial records in CRM → Campaign optimization and reporting
- Provide clear instructions or documentation for deploying and configuring the plugin, Google Ads Script, and Claude API integration
- Commit all work back to the GitHub repository with meaningful commit messages

## Key Constraints

- The connector must work with the existing multi-language setup the CRM uses
- The plugin must not break the WordPress site or existing functionality
- All Google Ads API interactions must follow current Google Ads best practices and authentication standards
- The Google Ads Script module must generate the exact structure: 10 campaigns × 5 services × 8 vehicle types = 400 ad groups
- Currency conversion must use real-time or on-demand GBP-to-PKR rates and lock the rate at transaction time
- Expense categories must be customizable by the user, not hardcoded
- Claude API integration for keyword research and campaign optimization must operate on a daily cycle and send daily performance reports
- Code should be production-ready and handle edge cases (network failures, malformed data, duplicate submissions)

Start by reviewing the repository structure and README to understand what's already been completed, then systematically identify and address remaining gaps. As you work through the finance module, Google Ads Script module, and Claude API integration, consider: How should exchange rates be sourced and updated? How should locked rates be stored for audit trails? What report formats will the user need for accounts review? How should the Google Ads Script be configured to generate the exact 400 ad group structure across all 60+ cities? What keyword research strategy will best serve multi-city targeting? How should Claude API be called and integrated into a daily optimization cycle? Flag any architectural decisions or scope ambiguities clearly and propose the most practical solution given the context.