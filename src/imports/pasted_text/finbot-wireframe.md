Design a complete low-fidelity to mid-fidelity wireframe for an AI-powered financial intelligence platform called "FinBot".

==================================================
PROJECT OVERVIEW
==================================================

FinBot is an AI-powered financial research platform for Indian equities.

Purpose:

- Financial analysis
- Company comparison
- AI-powered chat research
- Filing analysis
- Report generation
- Investor intelligence

The application should feel like:

- ChatGPT for Financial Analysis
- Bloomberg Intelligence simplified
- Enterprise financial research platform

Design should prioritize functionality, workflow, clarity, and usability.

Every screen should fit within the viewport.

No page scrolling.

Desktop-first layout.

All buttons and actions should appear functional in the wireframe.

==================================================
USER FLOW
==================================================

Landing Page

↓

Get Started

↓

Persona Selection

↓

Application Dashboard

↓

AI Chat / Comparison / Admin

==================================================
LANDING PAGE
==================================================

Purpose:

Simple entry point.

Components:

- FinBot Logo
- Product Tagline
- Hero Title
- Hero Description
- Feature Preview Illustration
- Get Started Button

Button Action:

Get Started

↓

Navigate to Persona Selection

No Login

No Signup

No Authentication

==================================================
PERSONA SELECTION SCREEN
==================================================

Purpose:

Users choose how they want to use FinBot.

Display as large selectable cards.

--------------------------------------------------

PERSONA 1

Company Analyst

Example:

Hexaware

Description:

Deep dive into a specific company.

Capabilities:

- View company filings
- Quarterly performance
- Annual performance
- Financial trends
- KPI tracking
- AI insights
- Reports

Button:

Enter Workspace

--------------------------------------------------

PERSONA 2

Investor

Description:

Compare companies within sectors.

Capabilities:

- Sector analysis
- Peer comparison
- Metric selection
- Ranking analysis
- Reports

Button:

Enter Workspace

--------------------------------------------------

PERSONA 3

Research Analyst

Description:

Cross-company research and filings intelligence.

Capabilities:

- Multi-company analysis
- Filing insights
- Comparative studies
- AI reports

Button:

Enter Workspace

==================================================
APPLICATION LAYOUT
==================================================

Left Sidebar

Width:
260px

Items:

Dashboard

AI Chat

Compare

Admin

Persona Indicator

Settings

Bottom:

Version

Current Persona

==================================================
DASHBOARD
==================================================

Purpose:

Landing workspace after persona selection.

--------------------------------------------------

TOP BAR

Global Search

Notifications

Current Persona Badge

--------------------------------------------------

LEFT PANEL

Company List

Search Companies

Filter Companies

Recent Companies

Pinned Companies

--------------------------------------------------

COMPANY TABLE

Columns:

Company Name

Sector

Market Segment

Latest Filing

Status

Actions

Open

Compare

Analyze

This company list should be moved here.

Remove it entirely from Admin page.

--------------------------------------------------

RIGHT PANEL

Recent Activity

Recent Queries

Saved Reports

Recent Comparisons

Quick Actions

Analyze Company

Create Comparison

Generate Report

Start AI Chat

==================================================
PERSONA-SPECIFIC BEHAVIOR
==================================================

--------------------------------------------------
PERSONA: COMPANY ANALYST
--------------------------------------------------

Example:

Hexaware

Workflow:

Select company

↓

View only that company

↓

Analyze data

Features:

Quarterly View

Annual View

Year Selection

Financial Trends

AI Report

Filings View

KPIs

Peer Benchmarking

Do NOT show broad sector comparisons by default.

Focus on one company.

--------------------------------------------------
PERSONA: INVESTOR
--------------------------------------------------

Workflow:

Select Sector

↓

Select Companies

↓

Select Metrics

↓

View Comparison

Users MUST choose:

Sector

Companies

Metrics

before comparison results appear.

--------------------------------------------------

STEP 1

Select Sector

Examples:

IT

Banking

Energy

FMCG

Pharma

Manufacturing

--------------------------------------------------

STEP 2

Select Companies

Only show peer companies from same sector.

Examples:

IT

TCS

Infosys

Wipro

HCL

Tech Mahindra

--------------------------------------------------

STEP 3

Select Metrics

Metric Multi-select

Examples:

Revenue

Net Profit

EPS

ROE

ROCE

OPM

Debt

Cash Flow

EBITDA

PAT

Market Cap

Dividend Yield

Current Ratio

Users choose which metrics to display.

--------------------------------------------------

STEP 4

Generate Comparison

Display ONLY selected metrics.

No unnecessary columns.

Highly focused comparison experience.

==================================================
AI CHAT PAGE
==================================================

Purpose:

Financial Research Assistant

Layout:

--------------------------------------------------

CHAT HEADER

FinBot AI Assistant

Current Persona

Current Company/Sector Context

--------------------------------------------------

DEFAULT MESSAGE

Hello! I'm FinBot.

I can assist with:

- Financial analysis
- Company comparisons
- Filing insights
- Investment research
- AI-generated reports

Suggested Queries:

Show Reliance annual trends

Generate report for Asian Paints

Compare HDFC and ICICI

Show quarterly growth of TCS

--------------------------------------------------

CHAT WINDOW

User Messages

Assistant Messages

Copy Button

Download Button

Regenerate Button

--------------------------------------------------

CHAT INPUT

Attach

Voice

Send

==================================================
COMPARE PAGE
==================================================

Purpose:

Advanced Comparison Center

--------------------------------------------------

TOP SECTION

Sector Selection

Company Selection

Metric Selection

--------------------------------------------------

METRIC PICKER

Search Metrics

Multi-select

Examples:

Revenue

PAT

EPS

ROCE

ROE

EBITDA

Debt

Cash Flow

Shareholding

Dividend

--------------------------------------------------

TIME CONTROLS

Annual

Quarterly

--------------------------------------------------

YEAR CONTROLS

Latest

FY2025-26

FY2024-25

FY2023-24

FY2022-23

FY2021-22

--------------------------------------------------

COMPARE BUTTON

Generate Comparison

--------------------------------------------------

RESULTS

Show only selected metrics.

Visual comparison cards.

Winner Highlighting.

Trend Indicators.

Insights Card.

AI Summary.

==================================================
ADMIN CONSOLE
==================================================

Purpose:

Backend Platform Operations

Remove company listing from Admin.

Admin should focus only on jobs and monitoring.

--------------------------------------------------

ACTION CENTER

Fetch Filings

Extract Metrics

Collect News

Refresh Data

Generate Embeddings

Reindex Search

--------------------------------------------------

BUTTON STATES

Idle

Running

Completed

Failed

Stopped

--------------------------------------------------

JOB CONTROL

Start

Pause

Stop

Restart

All controls visible.

==================================================
LIVE TERMINAL
==================================================

Real-time operational logs.

Examples:

[11:30:00] Job started

[11:30:05] Connecting to NSE

[11:30:10] Fetching filings

[11:30:22] Processing reports

[11:30:40] Metrics extraction completed

[11:31:00] News ingestion running

[11:31:15] Embeddings generated

[11:31:25] Index updated

Auto-scroll enabled.

==================================================
REPORTS MODULE
==================================================

Accessible from Dashboard, AI Chat and Compare.

Generate:

Investment Report

Company Report

Peer Comparison Report

Risk Analysis Report

Report Preview

Download PDF

==================================================
GLOBAL FUNCTIONAL REQUIREMENTS
==================================================

Every button should have visible state changes.

Every dropdown should open.

Every table row should have actions.

Every major module should have:

Create

Edit

Refresh

Export

View Details

Loading states required.

Empty states required.

Error states required.

==================================================
WIREFRAME OUTPUT
==================================================

Create wireframes for:

1. Landing Page
2. Persona Selection
3. Dashboard
4. AI Chat
5. Compare Companies
6. Admin Console
7. Report Preview

Focus on workflow, navigation, user actions, and information hierarchy.

All screens must look connected, functional, and ready for high-fidelity design conversion.