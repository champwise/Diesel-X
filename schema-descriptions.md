# Diesel-X Database Schema — Table Descriptions

A reference guide describing every table in the Diesel-X database, what it stores, and how it connects to the rest of the system.

---

## Identity & Auth

### `users`

The account table for every person who signs up for Diesel-X. Stores their login credentials and profile info — name, email, phone, and optional avatar. A user doesn't belong to any organization by default; they join orgs through the `organization_members` table. A single user can be a member of multiple organizations.

### `organizations`

A company or business entity that uses Diesel-X. Everything in the app — equipment, customers, tasks, templates — belongs to an organization. This is the top-level tenant boundary. When a user creates an account and sets up their business, an organization record is created and they become its owner.

### `organization_members`

The join table that connects users to organizations and defines what role they have within each one. A user might be an Owner in one org and a Mechanic in another. The `role` column controls what they can see and do — owner, admin, mechanic, customer, or viewer. This table also tracks invitation status, so pending invites that haven't been accepted yet live here too.

### `notifications`

In-app notifications for users — the items that appear when someone clicks the bell icon in the header. Each notification belongs to a specific user within a specific organization and contains a title, body, and a link to the relevant page (like a task detail page). The `is_read` flag tracks whether the user has seen it, which drives the unread count badge.

---

## Fleet & Customers

### `customers`

The companies or individuals whose equipment is being serviced. Every piece of equipment in the system belongs to a customer. Customer records hold contact details — name, email, phone, address, and notes. A customer can optionally be linked to a `users` record via `user_id`, which is what allows them to log in with the Customer role and approve tasks or view their own equipment and history.

### `equipment`

The central table of the app — every piece of heavy equipment being tracked. Each piece of equipment belongs to an organization and a customer. It stores identification info (unit name, make, model, serial number, registration), a photo, and the current location. Critically, it tracks usage via `current_reading` (either hours or kilometers, determined by `tracking_unit`), the `next_service_due` threshold, and what the `next_service_type` should be. The `operating_status` field (up or down) reflects whether the equipment is currently operational. Each unit also has a `task_creation_threshold` that controls how far in advance of a service the system should auto-create a maintenance task, and a `qr_code_url` for the scannable sticker.

### `equipment_visibility`

Controls which equipment specific users can see. This table is used to scope Mechanics and Viewers to a subset of equipment. An admin might set a mechanic to only see equipment at a certain site, or a viewer to only see one customer's fleet. The `is_self_hidden` flag allows mechanics to further filter their own view — hiding equipment they technically have access to but don't need cluttering their dashboard.

---

## Templates

### `service_templates`

Reusable definitions for planned maintenance work — things like "250 Hour Service" or "10,000km Service." Each template belongs to an organization and defines the service interval (a number and a unit — hours or kilometers). When a unit's usage approaches the interval, the system auto-creates a task from this template. The template acts as a blueprint: its checklist items and parts list get copied onto the task when it's created.

### `service_template_items`

The individual checklist lines within a service template. Each item has a label describing what to check or service, and flags for whether it's required and whether it's critical. If a mechanic marks a critical item as failed during a service, a breakdown task is automatically created and the equipment goes down. Standard failed items create defect tasks instead. The `sort_order` column controls the sequence the mechanic sees them in.

### `service_template_parts`

The pre-made parts list attached to a service template. Each entry records a part number, manufacturer, and quantity. When a task is created from this template, these parts are copied to the `task_parts` table so the mechanic and admin know what's needed. Parts can be modified on the task after creation — the template just provides the starting point.

### `prestart_templates`

Templates for the pre-start checklists that operators fill out when they scan a unit's QR code. Admins build these with a mix of question types and assign them to equipment. When an operator taps "Pre-Start Check" on the QR portal, they get the checklist defined by the template assigned to that unit.

### `prestart_template_items`

The individual questions or checks within a pre-start template. Each item has a label, a field type (pass/fail, yes/no, text, or number), and flags for whether it's required and whether it's critical. Like service template items, failing a critical pre-start item creates a breakdown and sets the equipment to down, while failing a standard item creates a defect task.

### `equipment_template_assignments`

The join table that connects equipment to their templates. A unit can have a service template assigned (defining what planned maintenance it gets) and a pre-start template assigned (defining what checklist operators see when they scan the QR code). Both are optional — a unit might have one, both, or neither.

---

## Tasks & Reports

### `tasks`

The core workflow table. Every piece of maintenance work — breakdowns, defects, and planned maintenance — is a task. Each task belongs to an organization, is linked to a unit and its customer, and carries a type (breakdown, defect, or planned_maintenance) and a status that tracks where it sits in the approval workflow (created → approved → prepared → assigned → accepted → in_progress → completed). Tasks store a description of the work, who reported it (name and phone), the equipment reading at the time, an optional parts ETA, the scheduled date, and the assigned mechanic. For planned maintenance tasks, `source_template_id` links back to the service template it was generated from.

### `task_parts`

The parts list for a specific task. Each entry has a part number, manufacturer, and quantity. For planned maintenance tasks, this is initially copied from the service template's parts list but can be edited as the job progresses. For breakdowns and defects, parts are added manually as the mechanic or admin determines what's needed.

### `task_checklist_items`

The checklist that a mechanic works through when completing a planned maintenance task (a service sheet). Each item corresponds to a component or system to inspect, and the mechanic records whether it's serviceable or not serviceable. If an item is marked not serviceable, the `failure_description` field captures what's wrong. Items marked as critical that fail will auto-generate a breakdown task; standard failures generate defect tasks.

### `task_media`

Photos and videos attached to tasks. Media can be attached to the task as a whole (documenting the overall situation, like photos submitted with a defect or breakdown report) or to a specific checklist item (documenting a particular fault found during a service). The `checklist_item_id` is nullable — when it's null, the media belongs to the task generally; when set, it's tied to that specific checklist line.

### `field_reports`

The structured report a mechanic fills out after completing a breakdown or defect repair. Each field report belongs to exactly one task (one-to-one relationship). It captures the customer's original complaint, what caused the failure, the resulting damage, how the repair was done, and whether additional work is needed. It also records the mechanic's name, time logged, and travel distance. This report gets exported as a branded PDF and emailed to the customer.

---

## Operations

### `time_logs`

Tracks mechanic clock-in and clock-out events for tasks. When a mechanic clocks in, the system records the timestamp and their GPS location (or a manual starting kilometer reading). When they clock out, it records the end time and location, then calculates total time and distance. A single task can have multiple time log entries if the mechanic clocks in and out more than once (for example, across multiple days). Admins use this data for mechanic utilization reporting.

---

## QR Submissions

### `prestart_submissions`

A completed pre-start check submitted through the QR portal. Records which equipment was checked, which template was used, the operator's name and phone number, and the equipment reading (hours or km) they entered. This is the header record — the individual checklist answers are in `prestart_submission_items`. Operators can view past submissions for a unit directly from the QR portal.

### `prestart_submission_items`

The individual answers from a pre-start submission. Each row links back to its submission and to the template item it's answering. The `result` column stores the operator's response (pass, fail, yes, no, or a text/number value depending on the field type). If an item was failed, `failure_description` captures what the operator wrote about the issue. The `generated_task_id` links to the defect or breakdown task that was automatically created from this failed item — this closes the loop so you can trace a task back to the exact pre-start check that triggered it.

### `prestart_submission_item_media`

Photos and videos attached to a specific failed pre-start checklist item. When an operator fails an item during a pre-start check, they're required to write a description and can optionally attach media to document the issue — a photo of a cracked hose, a video of an unusual engine noise, etc. Each media file is linked to the specific checklist item it documents (not the submission as a whole), so the resulting defect or breakdown task can be traced back to exactly what the operator saw. Files are stored in Supabase Storage with the same limits as defect reports (up to 5 photos, 2 videos max 2 minutes each).

### `qr_defect_reports`

A defect or breakdown report submitted by an operator through the QR portal. This is the submission record that captures everything the operator entered — their name and phone (pre-filled from a cookie if they've used the portal before), the equipment reading at the time, a description of the issue, and crucially, the `is_equipment_down` flag. If the operator indicates the equipment is down, this becomes a breakdown (the equipment's operating status is set to down and a breakdown task is created). If the equipment is still operational, a defect task is created instead. The `generated_task_id` links to the task that was auto-created from this report, so you can always trace a task back to the original operator submission.

The `severity` column captures the operator-selected priority (`low`, `medium`, `high`, `critical`). Critical severity is treated the same as a breakdown — it escalates the issue immediately.

### `qr_defect_report_media`

Photos and videos attached to a QR defect report. Operators can upload up to 5 photos and 2 short videos (max 2 minutes each) to document the issue they're reporting. Each media file is stored in Supabase Storage and linked back to its defect report. This is separate from `task_media` — these are the raw uploads from the operator at the time of reporting, while `task_media` holds files attached by mechanics during the repair process.
