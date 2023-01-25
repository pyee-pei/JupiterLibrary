# Jupiter Land Data Project

## Process Overview

#### Land Data and Operational Details

##### <span style="color: #6299df">Initial Load & Verification in Document Insights</span>

1. New leases, purchase agreements, option agreements, amendments, etc. are loaded into **Document Insights** (aka ThoughtTrace) for initial processing.
    - **Document Insights** will automatically review the document(s) and create intitial _thoughts_ based on the AI model
2. Jupiter Power personnel reviews AI _thoughts_ and validates _facts_ in **Document Insights**
    - **Key facts for Payment calculations**
        - Effective Date
        - Lease Term(s)
        - Leased Acres
        - Payment Model(s)
            - One-time Model(s)
            - Periodic Model(s)
3. Jupiter Power personnel finalizes "Review Status" _fact_ as `Complete`

This process creates all the necessary data needed for a basic calculation of the "maximum" or "as-documented" lease term payments that will be used for financial reporting and forecasting.

##### <span style="color: #6299df">Amendment Tracking</span>

1. Load amendments into **Document Insights** as outlined above, with the following things in mind:
    - Ensure that the "Amendment Date" fact is correctly entered
    - Ensure that the original document and each amendment share an identical "Agreement ID" fact
    - If the amendment outlines changes to multi-instance or multi-field facts, the entire instance set, and/or all fact fields must be captured, as they will be used for payment calculations and other alerts going forward.[^amendment-changes]
2. The payment calculations will automatically reflect the latest amendment terms as soon as these criteria are met

##### <span style="color: #6299df">Update & Maintenance of Operational Details</span>

1.  As projects move through various operational phases (Development, Construction, Operations), Jupiter Power Personnel will use the **Jupiter Land Ops**[^app-to-be-named] app to enter known details that may affect the timing of lease terms, and therefore the payment schedule.

    These details are kept at the _agreement_ level, not at the _project_ level, since operational details about a project may not apply to each agreement (ex. different owners may have different numbers of inverters on their property)

    -   **Key Operational Details** (all may not apply in every case)
        -   Construction Commencement Date
        -   Operations Commencement Date
        -   Total Megawatts
        -   Inverter Rating
        -   Inverter Count
        -   Termination Date

#### Accounting Interface(s)

##### <span style="color: #6299df">Accrualify Invoice Creation</span>

1. On a regular basis, Jupiter personnel will use the **Jupiter Land Ops** app to review upcoming payments
    - User will have the ability to make ad-hoc changes to amounts, dates, etc.
2. As each upcoming payment is reviewed, the user can trigger an **Accrualify** invoice object to be created via the API

##### <span style="color: #6299df">Invoice Status Tracking</span>

1. Once an invoice is created, the **Jupiter Land Ops** app will need to track the approval/payment status from **Accrualify** and/or **Sage** APIs to provide Land/Legal personnel visibility to the current status

##### <span style="color: #6299df">Visual Lease Reporting</span>

1. The **Jupiter Land Ops** app will create a periodic output for upload into Visual Lease with the latest long-term forecast of lease payment data used in ASC 842 Reporting

[^app-to-be-named]: this name has yet to be finalized
[^amendment-changes]: this can be outlined in its own document later with detailed examples, etc.
