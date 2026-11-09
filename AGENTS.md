# Repository Guidelines

## Project Structure

This workspace holds a demo for logging repair requests. The root-level `報修需求筆記.txt` is the requirements reference. It describes an Excel field list and sample dataset, a six-slide PowerPoint proposal, a Word user guide, a web form and request list, and a Supabase table with access policies. Source code, tests, and assets have no established directories yet.

## Local Development

From the workspace root, run `Get-Content -LiteralPath './報修需求筆記.txt' -Encoding UTF8` in PowerShell to read the requirements. There are currently no build, lint, or automated test commands. When adding a runnable component, document its prerequisites and the commands to start and verify it.

## Naming and Data

Save text files as UTF-8. Use the Traditional Chinese labels in the requirements for user-facing fields and options. Keep field definitions, categories, urgency levels, and status values aligned across the form, list, spreadsheet, and database. Use fictional names and locations in every sample, screenshot, and test record.

## Verification and Access

When the demo is runnable, submit a fictional request and verify that it appears in the list with a system-generated timestamp. Enable Supabase Row Level Security on the request table. With the public client key, verify that inserts and reads succeed and that updates and deletes are denied. Keep service-role credentials out of browser code. The demo scope is request submission and listing. Login, status editing, and notifications need separate decisions.

## Change Review

This workspace has no Git history to establish a commit convention. If version control is added, use short, action-oriented commit subjects. In review descriptions, name the deliverables affected and record how you verified the changes. Include screenshots for visible form or list changes.
