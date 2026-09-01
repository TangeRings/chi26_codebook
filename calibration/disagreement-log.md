# Disagreement Log

Running record of systematic disagreement patterns observed across calibration rounds. Used to drive updates to `decision-rules.md` and `boundary-cases.md`.

---

## How to use this log

After reviewing a calibration run's `.comparison.json` files:

1. Identify disagreements that recur across multiple items or represent a structural gap in the decision rules.
2. Add an entry below under the appropriate round.
3. Record the affected rule, the pattern observed, and the action taken.

**One-off disagreements** (item-specific errors with no broader implication) do not need to be logged here — document them in the item's `.comparison.json` file.

**Systemic patterns** (the same type of error on multiple items, or a gap in the decision rules that needs a new rule) belong here.

---

## Log format

```
### Round N — YYYY-MM-DD

#### Pattern: [Short name]
**Disagreement type:** [from controlled vocabulary in runs/README.md]
**Items affected:** [list of item IDs]
**Description:** What the AI consistently did wrong or differently from gold.
**Root cause:** Which decision rule was missing, ambiguous, or misapplied.
**Action taken:**
  - [ ] Updated decision-rules.md (rule: ...)
  - [ ] Added boundary case to boundary-cases.md (case: BC-NNN)
  - [ ] Revised gold coding for item (if rule change retroactively affects gold)
  - [ ] Added example to examples/ (post-calibration only)
**Status:** OPEN / RESOLVED
```

---

## Round 1

*(Not yet executed.)*

---

## Recurring patterns (populated over time)

*(None yet.)*

---

## Reference: Known risk patterns

The following disagreement types were anticipated before calibration based on codebook design. These are not yet documented as observed patterns — they are prediction targets for round 1.

| Risk | Anticipated cause |
|---|---|
| Overuse of `New` | Loose antecedent not recognized; EXPAND-vs-NEW rule too permissive |
| `Elaborated` coded instead of `Reframed` | Frame-shift not detected; ELAB-vs-REFRAME default toward Elaborated |
| Stylistic rewrites treated as semantic events | STYLE-vs-SEMANTIC rule not applied to minor rewording |
| Two distinct events collapsed into one | AI conflates two aligned pairs; events_collapsed |
| Learner agency coded without direct evidence | AGENCY-EVIDENCE threshold not applied strictly |
| Structural threshold disagreement | STRUCT-THRESHOLD rule not yet calibrated |
