<!-- spec-feature: specification -->

Template helps describe a feature before implementation in the **spec-feature** process.

**Parameters**

- **FEATURE** — name of the folder where the specification will be saved. Taken from the value between the first two `#` symbols (e.g., `#payments#` → `payments`).
- **CONTEXT** — main context for describing the feature. Consider everything after the second `#` in the parameter line; context can span multiple lines and include additional clarifications.

**General rules**

- Work only with specification files within `/spec` directory: automatically create necessary directories and files.
- Do not generate application code, configuration snippets, scripts, or patches while preparing the specification.
- Substitute specific values instead of placeholders (`{FEATURE}`, `{CONTEXT}`, etc.). The final document should not contain hints, examples, or `...` markers.
- The specification header should contain a clear feature name (adapt the **FEATURE** value if necessary).
- The structure from the template below needs to be filled with content: theses, lists, and tables are allowed, empty sections are not.
- If there's insufficient data for a section, explicitly write `No data — needs clarification: <what exactly>` instead of an empty header.
- Ensure all sections are complete and properly formatted.

**What needs to be revealed in the specification**

- `## User Stories` — minimum three completed stories. For each, fix the role, action, and result/value.
- `## Main scenarios and rules` — key usage scenarios, constraints, error variants.
- `## Non-functional requirements` — SLA, performance, security, localization, accessibility, and other non-functional criteria.
- `## Assumptions` — explicit assumptions and questions that need clarification before development.

**Steps**

1. Create the directory structure `spec/features/{FEATURE}/` if it doesn't exist.
2. Form the specification according to the sections above, based on **CONTEXT** and available additional context.
3. Create/update the file `spec/features/{FEATURE}/spec.md` with the complete specification content.
4. Check that the document is formatted in Markdown and contains no unfilled placeholders.
5. Ensure the document is complete and ready for implementation.

**Result template**

```md
# {FEATURE}

**Specification:** {CONTEXT}

## User Stories

## Main scenarios and rules

## Non-functional requirements

## Assumptions

```

Write strictly in Markdown and automatically create/update the specification file. **Goal** — create/update file `/spec/features/{FEATURE}/spec.md` describing WHAT we do and WHY, based on **CONTEXT**.
