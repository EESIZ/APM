# Principal-Agent Management Under Zero Trust: From Cato to Subagents

APM began with a deliberately strange reading exercise: treat old estate-management texts as records of principal-agent problems. Ignore their claims to legitimacy and inspect their administrative machinery. What does an absent owner demand from an overseer? How is incomplete work detected? How are excuses separated from evidence? How is information compressed upward through a hierarchy?

The answer looks unexpectedly familiar to anyone building an agent orchestrator.

## Cato: Audit the Overseer

In chapter 2 of *De Agri Cultura*, Cato tells the owner to inspect the estate, ask what has and has not been completed, calculate labor and time, review accounts, and leave the next instructions in writing. When the overseer offers explanations for weak output, Cato's compact instruction is:

> *ad rationem operum operarumque vilicum revoca*

W. D. Hooper and H. B. Ash translate the surrounding instruction as calling the overseer back to the estimate of work done and hands employed. The significant feature is not severity. It is the refusal to let the agent's narrative replace the principal's accounting.

Chapter 5 makes the reporting hierarchy even clearer:

> *Rationem cum domino crebro putet.*

The overseer should settle accounts with the owner frequently. Cato also requires written directions, defined duties, regular inspection, and knowledge of the work sufficient to judge reports.

In APM, that becomes a `Manager Audit`:

| Cato's administrative move | APM control |
| --- | --- |
| Inspect the estate before hearing the report | Inspect artifacts and current state |
| Ask what is complete and incomplete | Track explicit work-unit states |
| Calculate labor and time | Measure budget, tools, and evidence |
| Return the overseer to the account | Reject unsupported completion claims |
| Review accounts and inventory | Preserve provenance and proof |
| Leave directions in writing | Dispatch bounded contracts |

The mapping is analytical, not moral. Cato's estate included enslaved people treated as inventory, and the text's brutality is inseparable from its administrative clarity. That starkness is precisely why the control structure is easy to see.

Primary text: Cato, [*De Agri Cultura*](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Cato/De_Agricultura/home.html), especially chapters 2 and 5. Latin text follows the Goetz edition; English translation is by W. D. Hooper and H. B. Ash in the Loeb Classical Library edition.

## Plantation Rules: Management as a Ledger

The anonymous "Mississippi Planter" rules reprinted as "Management of Negroes upon Southern Estates" in *Tennessee Historical Magazine*, vol. V, pp. 97-106, show the same structure expanded into a bureaucratic system.

The rules require periodic counts of people, stock, and tools; daily and weekly inspection; night patrols; medical records; birth and death registers; per-worker cotton weights; bale numbers; weather notes; and exclusive managerial responsibility. One sentence captures the system's contradiction:

> "Humanity on the part of the overseer, and unqualified obedience on the part of the negro, are, under all circumstances, indispensable."

Care, punishment, accounting, and output control are not separate domains in this document. They are joined as methods for preserving the owner's productive system. The plantation ledger turns bodies, events, tools, and output into manager-visible state.

For APM, the useful abstraction is narrower:

- a delegated system fails when the principal cannot see state;
- maintenance of worker context and tools protects output capacity;
- proof must be recorded at the unit where work occurs;
- the manager must own correction and integration;
- exclusive responsibility is meaningful only when paired with auditable evidence.

Primary text: ["Management of Negroes upon Southern Estates"](https://penelope.uchicago.edu/Thayer/E/Gazetteer/Places/America/United_States/Tennessee/_Texts/THM/5/2/Management_of_Negroes*.html), a public-domain reprint in *Tennessee Historical Magazine*. The page also reproduces related 1853 rules attributed to St. George Cocke.

## From Physical Labor to Cognitive Delegation

Ancient owners escaped portions of physical labor through coerced human labor. Industrial machinery later replaced or amplified much of that labor. AI systems now let people delegate parts of search, analysis, implementation, and verification.

The analogy is intentionally abrasive because it exposes a recurring temptation: to hand off not only execution but judgment. APM draws a firm line between the two. The manager may delegate intelligence-intensive work, but it retains the objective, architecture choice, acceptance standard, and final decision.

That is the modern point of the historical reading. The texts are unusually explicit demonstrations of control under information asymmetry. APM turns the extracted grammar into an artificial-agent protocol:

```text
Reduce -> Measure -> Delegate -> Maintain -> Discipline
```

The unit of control is no longer a person. It is a bounded agent run, its context, artifacts, proof, and integration state.
