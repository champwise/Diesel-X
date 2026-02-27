# Diesel-X — Heavy Equipment Maintenance App

## What It Is

Diesel-X is a web app for managing the maintenance of heavy mobile equipment (excavators, trucks, loaders, etc.) across a fleet. It's built around a simple idea: every piece of equipment gets a QR code sticker. Anyone on-site can scan it with their phone to do a pre-start check, report a defect, or report a breakdown — no login required. Behind the scenes, managers and mechanics get a full dashboard to track fleet health, schedule maintenance, and stay on top of issues.

The app should be mobile-friendly, especially the QR code portal that field workers use on their phones.

---

## App Navigation

### Main Tabs

The app has the following main navigation tabs:

- **Dashboard** — Fleet overview, equipment needing attention, activity feed.
- **Schedule** — Calendar view of all upcoming and assigned tasks across mechanics.
- **Equipment** — List of all equipment, their status, and detail pages.
- **Mechanics** — Manage mechanic profiles, view time logs and utilization.
- **Customers** — Manage customer records (each piece of equipment belongs to a customer).
- **Services** — Manage service templates, pre-start templates, and task workflows.

### Header Icons

The header also includes small icon buttons for:

- **Notifications** (bell icon with unread count badge — shows task assignments, approval requests, and other alerts)
- **Settings** (general app settings)
- **User Settings** (personal profile, password, notification preferences)
- **Organization Settings** (org name, members, roles, notification recipients)

---

## Users, Organizations & Roles

The user and organization structure works like Xero accounting software — a user creates a personal account, then either creates an organization or gets invited to one. A single user can belong to multiple organizations and switch between them.

There are five roles within an organization:

- **Owner** — Full control. Creates the organization, manages all settings, invites people, manages equipment, customers, and templates.
- **Admin** — Same as Owner except they can't change organization-level settings. Can manage equipment, customers, templates, users, and assign work.
- **Mechanic** — Can complete tasks, update defect/breakdown statuses, clock in/out for time tracking, self-assign available jobs, and view their own calendar and time logs. Owners/Admins control which equipment each mechanic can see, and mechanics can also **further filter** their own equipment list to focus on the ones relevant to them.
- **Customer** — Can log in to view their own equipment, task history, and service/field reports. Can **approve or reject tasks** for their own equipment only. Cannot see other customers' equipment or any internal operations.
- **Viewer** — Read-only access to the dashboard. Owners/Admins control which customers' equipment each Viewer can see.

Anyone scanning a QR code (operators, drivers, site workers, customers) does **not** need an account. They interact through a public portal.

---

## Core Features

### 1. Organizations & Team Management

- A user signs up, then creates an organization (becoming the Owner), or accepts an invitation to join an existing one.
- The Owner/Admins invite others from the **Organization Settings** page, using two methods:
  - **Email invite link** — sends a signup link; the person creates an account and is automatically added to the org.
  - **Direct add** — if someone already has an account, add them by email; they see a pending invitation to accept or decline.
- Each user can belong to multiple organizations and switch between them freely (like Xero).

**Equipment visibility settings:**
- Owners/Admins can control which **customers' equipment** each **Viewer** can see. For example, a Viewer representing a specific customer might only see that customer's equipment.
- Owners/Admins can control which **equipment** each **Mechanic** can see. This lets admins scope mechanics to relevant equipment.
- Mechanics can also **further filter their own view** to hide equipment they don't need to see, keeping their dashboard and equipment list focused.

### 2. Customer Management

- Each organization maintains a list of **customers** — the companies or individuals who own the equipment being serviced.
- Customer records include: name, phone number, email, address, and any relevant notes.
- Every piece of equipment in the system belongs to a customer. This means tasks, reports, and service history can all be viewed and filtered by customer.

### 3. Equipment Management (Equipment)

- Admins add equipment with details like unit number/name, make, model, serial number, current hours or kilometers, registration, and location. They can also upload a photo.
- Each unit is assigned to a **customer**.
- Each unit tracks usage by either **hours** or **kilometers**.
- Each unit has a **next service due** field (hours or kms) and a **next service type** field (e.g., "250 Hour Service") that admins can edit. These fields tell the system when the next planned maintenance task should be created.
- Each unit gets a unique QR code generated automatically. The QR code can be downloaded and printed as a sticker for the equipment.

**Equipment List Page:** The top-level Equipment page shows all equipment the logged-in user has permission to see. Each list item displays the equipment's **status** (Up/Down), **customer**, **unit number**, **current hours/kms**, **next service due**, and **make and model**. The list can be **filtered by customer**.

**Equipment Detail Page:** When you click into a unit on the Equipment page, you see:

- **Editable equipment details** — customer, serial number, make, model, hours/kms, next service due, next service type, registration, location, photo, etc. Admins can update any of these fields.
- **Outstanding Tasks** — A list of all tasks on this equipment that haven't been completed yet, showing each task's current status. You can click into any task to view its full checklist, details, and notes.
- **Task History** — A list of all completed (and not-approved) tasks for this equipment. This list is **filterable and searchable** — users can search by task type, date range, mechanic name, etc. Clicking into a historical task shows its full checklist, details, notes, and who completed it.

Mechanics and Viewers can access the equipment detail page (including both task lists), but only Admins/Owners can edit equipment details.

**Equipment Status** has two dimensions:

- **Operating status:** Either **Up** or **Down**. A breakdown sets it to Down. The equipment is automatically set back to Up when the breakdown task is completed. Admins can also manually flip the status at any time.
- **Upcoming tasks status:** One of:
  - **Accepted** — the task has been assigned to a mechanic and the mechanic has accepted the date/time. The task is fully scheduled.
  - **Scheduled** — the task has been assigned to a mechanic with a date/time, but the mechanic hasn't accepted yet.
  - **Preparing** — the task has been approved but is waiting on parts or tooling. An **estimated time of arrival** can be added here so everyone knows when parts are expected.
  - **Not Scheduled** — there are approved tasks but they haven't been assigned to a mechanic or given a date yet.
  - **Awaiting Approval** — there are tasks that have been created but not yet approved.
  - **No Upcoming** — there are no pending tasks for this equipment.

### 4. QR Code Portal (Public, No Login Required)

When someone scans a unit's QR code on their phone, they see a clean, branded mobile page showing the equipment's info. Before they can do anything else, the operator must **enter the current equipment hours or kilometers**. The system compares this reading against the last recorded value — if the number is wildly different (much higher or lower than expected), the operator is shown a confirmation prompt asking "Are you sure?" to catch typos or misreadings. Once the hours/kms are confirmed, the operator sees the action buttons.

The QR portal **remembers the operator's name and phone number** via a browser cookie, so repeat users don't have to re-enter their details every time they scan.

- **Pre-Start Check** — The operator enters their name and phone number, then works through a checklist (pass/fail items, yes/no questions, text or number fields). If any item is **failed**, the operator must provide a **written description** of the failure and is given the option to attach a **photo or video**. Failed items automatically generate a task: a **defect** task for standard items, or a **breakdown** task (critical priority, equipment set to Down) for items marked as critical.
- **Pre-Start History** — Operators can view all previous pre-start submissions for this equipment directly from the QR portal. This lets them see patterns or check what was flagged last time.
- **Report Defect** — The user enters their name and phone number, describes the issue, and can attach photos (up to 5) and short videos (up to 2, max 2 minutes each). A defect task is created.
- **Report Breakdown** — Same as a defect report but flagged as critical/urgent. The equipment status changes to Down.

Note: Mechanics complete tasks (services, defect repairs, breakdown repairs) **through the main web app**, not through the QR portal.

Breakdowns and defects can also be created by operators, customers, or mechanics **through the main app** (not just the QR portal).

### 5. Pre-Start Templates

Admins build custom pre-start checklists with different item types (pass/fail, yes/no, text, number). Each item can be marked as **critical** (a failure creates a breakdown task and sets the equipment to Down) or standard (a failure creates a defect task). Admins can also mark individual form fields as **required**, so they must be filled in before submission. When any checklist item is failed, the person submitting **must provide a written description** of the failure and can optionally attach a photo or video. Templates are then assigned to one or more equipment, so when someone scans the QR code and taps Pre-Start, they get the right checklist for that unit.

### 6. Tasks & the Approval Workflow

All maintenance work in Diesel-X is organized into **tasks**. There are three types:

- **Breakdowns** — Created when a unit is non-functional. Can be reported manually (via QR portal or through the app), or **automatically created** when a critical checklist item is failed during a pre-start or service. Sets the equipment to Down.
- **Defects** — Created when a unit has an issue but is still operational. Can be reported manually, or **automatically created** when a standard checklist item is failed during a pre-start or service.
- **Planned Maintenance** — Automatically created by the system based on service templates and usage tracking.

**Task data:** Each task carries the following information:

- **Description** — A written summary of the issue or work required.
- **Parts list** — A list of parts needed for the job. Each entry has a **part number**, **manufacturer**, and **quantity**. Parts can be added or edited at any stage of the task. For planned maintenance tasks, the parts list is pre-populated from the service template but can be modified.
- **Parts ETA** — An estimated arrival date for any parts that are on order (used during the Preparing stage).
- **Media** — Photos and/or videos attached to the task (e.g., images of damage submitted with a defect or breakdown report).
- **Equipment hours/kms at time of reporting** — The equipment's reading when the task was created, so there's a record of usage at the time of the issue.
- **Reported by** — The name and **phone number** of the person who reported the issue.
- **Equipment & customer** — Which equipment the task is for and which customer owns it.
- **Task type** — Breakdown, defect, or planned maintenance.
- **Current lifecycle status** — Where the task sits in the workflow.
- **Assigned mechanic** — The mechanic responsible (once assigned).
- **Scheduled date/time** — When the work is planned for (once assigned).

**Approval workflow:** All tasks must be **approved** before work can proceed. When a task is created, the **customer** is notified via email or SMS with the task title and a link to the task's detail page in the web app. The customer logs in with their Customer role account to review the details and approve or reject. This gives both admins and customers a review step before work is committed. After approval, the task moves to **Prepared** (indicating parts and tooling have been organized), then it can be **Assigned** to a mechanic with a specific date/time. Once assigned, the mechanic must **Accept** the task for it to be fully scheduled (see section 8 for details).

**Task lifecycle:**

1. **Created** — The task has been reported or auto-generated but no one has reviewed it yet. Breakdowns and defects sit here after being submitted via the QR portal or web app. Planned maintenance tasks land here when the equipment's hours/kms reach the creation threshold. The customer is notified via email or SMS with a link to the task in the web app to review and approve.
2. **Approved** — The customer (or admin) has reviewed the task and given the go-ahead for the work to proceed. The task is now waiting for parts and tooling to be organized.
3. **Prepared** — All required parts, tooling, and resources have been organized and the task is ready to be assigned to a mechanic. If parts are on order, an estimated time of arrival can be recorded at this stage.
4. **Assigned** — The task has been assigned to a specific mechanic with a proposed date and time. The mechanic receives an email notification. The task is waiting for the mechanic to accept or reschedule.
5. **Accepted** — The mechanic has confirmed they will do the job at the assigned date and time. The task is now fully scheduled.
6. **In Progress** — The mechanic has clocked in and is actively working on the task.
7. **Completed** — The work is done. For planned maintenance, the mechanic has submitted a service sheet. For breakdowns and defects, the mechanic has submitted a field report. The completed report is emailed to the customer and the task moves to the equipment's task history. If the task was a breakdown, the equipment status is automatically set back to **Up**.

A task can also move **backwards**: if the mechanic determines that more work is needed after completing a defect or breakdown repair, the task goes back to **Created** (awaiting approval) so an admin and the customer can review and approve the additional work.

**Admin overrides:** At any point, an admin can:
- **Mark a task as Completed** — for tasks that were mistakenly reported or no longer needed. The task moves to the task history.
- **Mark a task as Not Approved** — this keeps the task in the equipment's task history for record-keeping but removes it from all "tasks needing action" lists. Useful for rejecting tasks that shouldn't proceed.
- **Manually flip a unit's status** between Up and Down, regardless of task status.

Planned maintenance tasks are **automatically created** by the system when a unit's hours or kms reach the creation threshold (see section 7). They then enter the normal approval workflow — an admin must approve them, mark them as prepared, assign them to a mechanic, and the mechanic must accept before work can begin.

### 7. Planned Maintenance & Service Templates

This is the heart of the app's scheduled maintenance functionality:

- **Service Templates** — Admins create reusable service definitions (e.g., "250 Hour Service," "10,000km Service") with a checklist of tasks and a **pre-made parts list**. The parts list has columns for **part number**, **manufacturer**, and **quantity**, and can be added to or modified on the **Services page**. Each template has an interval (e.g., every 250 hours or every 10,000 km). Admins can mark individual checklist items and form fields as **required**. Checklist items can also be marked as **critical**. If a mechanic **fails** any item on a service checklist, they must provide a **written description** of the failure and can optionally attach a photo or video. Failed items automatically generate a defect task, or a breakdown task if the item is marked as critical. When a planned maintenance task is created from a template, the pre-made parts list is copied onto the task and can be modified from there.
- **Automatic task creation based on equipment usage** — When a service template is assigned to a unit, the admin also configures a **creation threshold** on the equipment's page — how many hours or kms before the service is due the system should automatically create the task. For example: EX04 has 4,200 hours and is due for a service at 4,250 hours. The admin has set EX04 to create service tasks 50 hours before they're due, so the task is created now (at 4,200 hours). This threshold is set per unit, giving admins control over how much lead time each unit gets.
- **Service Completion** — A mechanic completes the service by filling in the checklist, recording parts used, adding notes, and entering the current hours/kms. On completion, the system begins tracking toward the **next** service interval for that unit.
- **Field Reports** — After completing a breakdown or defect repair, the mechanic fills out a field report. This is a one-off written report structured around the following questions: "What was the customer's complaint?", "What was the cause of the failure?", "What was the resultant damage?", "How did you repair it?", and "Does the equipment require additional work?" (if yes, list the parts needed). The field report also includes the mechanic's name, time logged, and travel distance. Media (photos/videos) can be attached to the **job as a whole** to document the overall situation.
- **Service Sheets** — When completing a planned maintenance task, the mechanic works through a pre-made checklist of checks. For each item, the mechanic notes whether the system or component is **serviceable** or **not serviceable**. If an item is marked as not serviceable, a **written description** is required. Media (photos/videos) can be attached to a **specific checklist item** to accompany a fault description. The service sheet also includes the mechanic's name, time logged, and travel distance.
- **Service Sheets & Field Reports on the web app** — All completed service sheets and field reports can be viewed within the web app on the equipment's task history page. They can also be exported as branded PDF reports.
- **Customer delivery** — When a service sheet or field report is completed, it is automatically **emailed to the customer** associated with that unit.

### 8. Schedule (Calendar)

- Admins see a calendar showing all scheduled tasks across mechanics — planned maintenance, defect repairs, and breakdown repairs. They can assign or reassign tasks to mechanics on specific dates.
- The calendar includes a **mechanic dropdown** so admins can filter the view to show one mechanic at a time, keeping it uncluttered.
- Mechanics see their own calendar with their upcoming assigned tasks.
- **Accept / Reschedule flow:** When a mechanic is assigned a task with a date/time, they must **accept** it for the task to be considered fully scheduled. If the mechanic does not accept the proposed date, the task needs to be rescheduled. The mechanic can **reschedule it themselves** by proposing a new date/time and then accepting it. Until a task is accepted by the mechanic, it shows as "Scheduled" (not yet "Accepted") on the equipment's status.
- Mechanics can also browse **unassigned approved** tasks and self-assign ones they want to pick up.

### 9. Time Tracking

Mechanics can clock in and out of tasks (services, defect repairs, breakdown repairs):

- **Clock In** records the time and captures GPS location (if allowed by the browser) or asks for a manual starting kilometer reading.
- **Clock Out** records the end time and location/kms, and calculates total time and distance.
- Mechanics can view their own time logs.
- Admins can view all mechanic time logs, filterable by date range, mechanic, or equipment.

### 10. Notifications

**In-app notifications:** The app has a **bell icon** in the header with an **unread count badge**. Clicking it opens a notification panel showing recent events relevant to the user (task assignments, approval requests, status changes, etc.). Notifications are marked as read when viewed.

**Email & SMS notifications** are sent for the following scenarios:

- **Account setup** — Invitation emails when a user is invited to join an organization, and account confirmation emails.
- **Mechanic task assignment** — When a mechanic is assigned a new task, they receive an email notifying them of the assignment, including the equipment and task details.
- **Customer task approval requests** — When a task needs to be approved, the customer receives an **email or SMS** containing the task title and a **link to the task's detail page in the web app**. The customer logs in (using their Customer role account) and can approve or reject the task from there. There are no public one-time approval pages — all approval happens within the app.
- **Completed reports to customers** — When a service sheet or field report is completed, it is automatically emailed to the customer associated with that unit.

### 11. Dashboard

All logged-in users see a dashboard with:

- **Equipment Down** — a list of all equipment currently with a Down status, so admins can see at a glance what's out of action.
- **Tasks needing action** — sections showing tasks that need to be **approved**, tasks that are **preparing** (waiting on parts/tooling), tasks that need to be **assigned** to a mechanic, tasks awaiting **mechanic acceptance**, and tasks currently **in progress**. Admins see all tasks; mechanics see only tasks relevant to them.
- **My Outstanding Tasks** — a personal list of tasks currently assigned to the logged-in user. The user can click into any task to view its details, and from there **clock in** and **log their location** to begin travel tracking for that job.
- **Recent activity feed** — latest pre-starts, defect reports, breakdown reports, and completed tasks
- **Mechanic utilization** (admin/owner only) — hours worked per mechanic this week/month

---

## Key Design Principles

- **Mobile-first QR portal** — The public-facing pages that operators use in the field must work great on phones.
- **No login required for on-site reporting** — Pre-starts, defects, and breakdowns can be submitted by anyone who scans the QR code. They just type their name.
- **Approval before scheduling** — All tasks go through approval and preparation steps before being assigned and scheduled, giving admins control over what work gets committed.
- **Failed checklist items create tasks** — When a pre-start or service checklist item is failed, a defect or breakdown task is automatically created, keeping the issue-tracking loop tight.
- **Automatic task creation** — Planned maintenance tasks are created automatically when a unit's usage reaches a configurable threshold before the service is due. The threshold is set per unit on the Equipment page.
- **Xero-style multi-org** — Users can belong to multiple organizations and switch between them seamlessly.
- **Branded PDF exports** — Completed service sheets and field reports can be viewed in the web app and downloaded as professional PDF documents. They are also automatically emailed to the customer.
