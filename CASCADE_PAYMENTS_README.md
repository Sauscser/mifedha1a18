# Cascade Payments Product Plan and Implementation Notes

## Overview
This feature introduces a new product under the Credit Sales area for handling cascaded payments across layered organizational structures. It is designed for scenarios where money moves from a top-level sender through multiple downstream accounts, such as ministry -> department -> directorate -> county -> sub-county -> final beneficiary.

The goal is to let an officer work with a cascade tree in a practical, officer-friendly way:
- a root account can send money to a recipient account;
- that recipient can then distribute the amount to one or more child accounts;
- each child can continue the cascade to more accounts;
- the system keeps the hierarchy visible and can report totals across each branch.

## Business Problem
Many institutions need a clear audit trail for how funds flow through layered units. This product helps by making the movement visible, traceable, and easier for officers to review before or after a transfer.

## Product Workflow
The new cascade workspace is opened from the Credit Sales area and presents a modal-based action menu with three choices:
1. Create Account
2. Send money
3. View account

### 1. Create Account
The user does not begin by creating a recipient account manually. Instead, the officer creates an account node for the current actor in the cascade tree.

When creating an account:
- the app uses the authenticated user context from the existing account system;
- the nationality is taken from the signed-in user's SMAccount record;
- if the account type is Individual:
  - the account name is taken from the SMAccount name;
  - the account number is set to the signed-in user's email;
- if the account type is Business:
  - the app searches Bizna records where the signed-in user is listed as an admin;
  - the user selects one of those Bizna records;
  - the selected Bizna name becomes the account name and its BusKntct becomes the account number;
- only the description is entered manually during account creation. The account name and account number are derived automatically.

### 2. Send money
When sending money:
- the officer selects a parent account from the existing cascade tree;
- the officer chooses a recipient type: BUSINESS or INDIVIDUAL;
- the officer enters the recipient identifier, recipient name, amount, and description;
- the child recipient is attached under the selected parent account and the transfer is recorded as part of the cascade tree.

### 3. View account
The officer can open the cascade tree and inspect the hierarchy recursively.
- each account card shows the account name, account number, nationality, total shared amount, creation date, and description;
- the user can expand an account to view its attached children.

## Data Sources and Business Rules
The implementation is intentionally tied to the existing Mifedha data sources rather than free-form account creation.

- SMAccount:
  - used to derive the signed-in user's name, email-based account number, and nationality.
- Bizna:
  - used to resolve business accounts where the signed-in user is an admin.
  - the officer can choose a Bizna account from the list and use it as the business account identity for the cascade node.

## Backend Design
The backend uses Amplify GraphQL models to persist cascade payment records:
- CascadePaymentFlow stores the parent flow metadata and overall payment summary.
- CascadePaymentNode stores each node in the cascade tree, including its parent-child relationship and the transfer details at each step.

This model allows the app to rebuild the wireframe of the cascade visually from stored records.

## Implementation Status
The current implementation includes:
- a new cascade payments workspace under the Credit Sales area;
- modal-based actions for create, send, and view;
- SMAccount-driven nationality and identity lookup;
- Bizna admin-based business account selection;
- recursive tree view for accounts and child recipients.

## Future Enhancements
After the initial flow is stable, the next improvements will include:
- persistence of cascade nodes and flow records through the full GraphQL workflow;
- richer account search and selection experiences;
- level-by-level summaries and totals across branches;
- approval and audit workflow support for larger payment scenarios.

## Notes
This implementation is not hard-coded to one single government structure. It is designed as a general cascade-payment product that can support layered transfer flows across different organizational contexts.
