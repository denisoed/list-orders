<!-- spec-feature: task list -->

Template helps form a task list for feature implementation in the **spec-feature** process.

**Parameters**

- **FEATURE** — name of the folder where the task list will be saved. Taken from the value between the first two `#` symbols (e.g., `#payments#` → `payments`).
- **CONTEXT** — main context for preparing tasks. Consider everything after the second `#` in the parameter line; context can span multiple lines and include additional clarifications.

**General rules**

- Work only with specification files within `/spec` directory: automatically create necessary directories and files.
- Do not generate application code, configuration snippets, scripts, or patches while preparing the task list.
- Use `spec/core/spec.md` and `spec/core/plan.md` as base sources of specification and plan when preparing tasks.
- Use `spec/features/{FEATURE}/spec.md` and `spec/features/{FEATURE}/plan.md` as additional context. If any file is missing, continue working based on available materials and **CONTEXT**.
- Substitute specific values instead of placeholders (`{FEATURE}`, `{CONTEXT}`, etc.). The final document should not contain hints, examples, or `...` markers.
- Each task is a checkbox with result formulation and description of mandatory checks/tests.
- If a direction is not required, explicitly indicate under the corresponding subheading `Not required — reason: <explanation>`.
- After filling the document, mark self-check checkboxes in the "Instruction execution control" section.
- Do not start executing tasks until a separate user request explicitly references `spec/features/{FEATURE}/tasks.md`; ignore execution requests without that reference.

**What needs to be revealed in tasks**

- `## Main directions` — group tasks by key directions from **CONTEXT** (API, UI, integrations, infrastructure, etc.). For each direction, allocate a separate subheading and list tasks within it.
- `## Supporting tasks` — documentation, observability, quality, and other cross-cutting activities. If an item is not needed, replace it with an explanation of why it can be omitted.
- `## Definition of Done` — feature completion criteria: tests, documentation, and other mandatory conditions.

**Steps**

1. Create the directory structure `spec/features/{FEATURE}/` if it doesn't exist.
2. Form the task list according to the sections above, based on **CONTEXT** and available additional context.
3. Create/update the file `spec/features/{FEATURE}/tasks.md` with the complete task list content.
4. Ensure that tasks cover implementation, verification, and release of the feature. The final Markdown should not contain unfilled placeholders.
5. Record in the `## Definition of Done` section that `/spec/core/verify.md` execution is performed after completing all tasks, so executors do this automatically upon completion of the list.
6. Ensure the document is complete and ready for implementation.

**Result template**

```md
# Tasks

**Context:** {CONTEXT}

## Main directions

## Supporting tasks

- [ ] Documentation: update relevant instructions and descriptions.
- [ ] Observability: add or clarify metrics, alerts, and/or logging.
- [ ] Code review and PR: prepare changes for review and accompanying information.

## Definition of Done

- [ ] All tasks are completed and tested.
- [ ] Relevant unit/e2e/integration tests pass successfully.
- [ ] Documentation and operational instructions are updated.
- [ ] `/spec/core/verify.md` is executed after completing all tasks to verify the task list.

```

Write strictly in Markdown and automatically create/update the task list file. Do not proceed to task execution without a separate request. **Goal** — create/update file `/spec/features/{FEATURE}/tasks.md` with a list of WHAT we do and how we verify the result, based on **CONTEXT** and prepared materials.
