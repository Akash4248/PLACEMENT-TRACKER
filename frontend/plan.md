Product Vision
Product Name

CampusTrack

Subtitle:

Campus Interview Tracking & Result Management System

Design Goals:

Professional
Clean
Fast
Enterprise Dashboard Style
Minimalistic
Modern SaaS look
Placement Officer Friendly
Responsive
No flashy gradients everywhere
Information density without clutter

Think:

Linear
Notion
Stripe Dashboard

combined.

Design Language
Theme
Light Mode Only

For assessment:

Background: #F8FAFC
Surface: #FFFFFF
Border: #E2E8F0

Primary: #2563EB
Primary Hover: #1D4ED8

Success: #16A34A
Warning: #F59E0B
Danger: #DC2626

Text Primary: #0F172A
Text Secondary: #64748B
Typography

Font:

Inter

Install:

npm install @fontsource/inter

Sizes:

Heading XL: 32px
Heading L: 24px
Heading M: 20px

Body: 14px
Small: 12px
Layout
┌─────────────────────────────┐
│ Navbar                      │
├──────┬──────────────────────┤
│Side  │                      │
│Bar   │ Main Content         │
│      │                      │
│      │                      │
└──────┴──────────────────────┘
Navbar

Height:

64px

Contains:

Logo

Search

User Avatar

Logout

Logo:

CampusTrack

Blue icon + text.

Sidebar

Width:

260px

Items:

Dashboard

Students

Companies

Applications

Interview Rounds

Reports

Icons:

npm install react-icons

Use:

FiHome
FiUsers
FiBriefcase
FiLayers
FiClipboard
FiBarChart2
Sidebar Behavior

Selected Item:

Background:
#DBEAFE

Text:
#2563EB

Hover:

#F1F5F9
Page Layout

Every page:

Title

Description

Action Button

Content Card

Example:

Students

Manage student records

+ Add Student
Cards

Use everywhere.

Background: White
Border Radius: 16px

Border:
1px solid #E2E8F0

Shadow:
0 1px 3px rgba(0,0,0,0.05)
Dashboard Design

Top Section:

6 Statistics Cards

Layout:

Students

Companies

Applications

Selected

Rejected

Offers
KPI Card
┌─────────────┐
│ 235         │
│ Students    │
│ +12%        │
└─────────────┘

Hover:

translateY(-2px)

Animation:

transition 0.2s
Charts Section

Two Cards

Selection Statistics

Recruitment Pipeline

Use:

npm install recharts

Chart 1:

Bar Chart

Company vs Selected

Chart 2:

Pie Chart

Selected
Rejected
In Process
Offer Received
Students Page

Top Bar:

Search Student

+ Add Student
Student Table

Columns:

USN

Name

Email

Department

CGPA

Actions

Actions:

Edit
Delete

Use icon buttons.

Add Student Modal

Instead of separate page.

Fields:

USN
Name
Email
Phone
Department
CGPA
Graduation Year
Skills
Companies Page

Same structure.

Columns:

Company

Package

Location

CGPA Criteria

Status

Actions

Status Badge:

Upcoming
Ongoing
Completed

Colors:

Upcoming
Blue

Ongoing
Green

Completed
Gray
Applications Page

This is the showcase page.

Do NOT use a table.

Use Kanban.

Kanban Board

Columns:

Applied

In Process

Selected

Rejected

Offer Received
Application Card
Student Name

Company

Current Round

Status

Buttons:

Pass

Fail

Offer
Why Kanban?

Looks enterprise-grade.

Easy to understand.

Evaluators love it.

Interview Rounds Page

Layout:

Company Dropdown

Round Timeline
Timeline Design
1 Aptitude

↓
2 Coding

↓
3 Technical

↓
4 HR

Card-based.

Reports Page

Simple.

Buttons:

Export Students

Export Companies

Export Applications
Login Page

Modern centered card.

CampusTrack

Email

Password

Login

Card width:

420px

Background:

#F8FAFC
Animations

Install:

npm install framer-motion

Use only:

Page Fade
opacity 0 → 1
Card Hover
scale 1 → 1.02
Modal Open
fade + slide up

No excessive animations.

Responsive Behavior

Desktop:

Sidebar visible

Tablet:

Collapsible Sidebar

Mobile:

Drawer Sidebar
Folder Structure
src/

components/
 ├── layout/
 │    ├── Navbar
 │    ├── Sidebar
 │    └── DashboardLayout
 │
 ├── ui/
 │    ├── Button
 │    ├── Card
 │    ├── Modal
 │    ├── Table
 │    ├── Badge
 │    └── Loader
 │
pages/
 ├── Login
 ├── Dashboard
 ├── Students
 ├── Companies
 ├── Applications
 ├── Rounds
 └── Reports

hooks/

context/

services/

routes/