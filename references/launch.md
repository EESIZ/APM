# Launch and Measurement Playbook

APM does not need to wait for cheaper tokens. The target users already run manager agents through Claude Code tasks, Codex subagents, research orchestrators, and coding-agent teams. Launch around the management gap, not a prediction that "A2A will return."

## Positioning

Primary line:

> If unlazy disciplines the worker, APM disciplines the manager.

Supporting claim:

> The multi-agent pattern that survived the backlash is a manager with bounded, isolated subagents. That manager still needs contracts, evidence, correction, and integration discipline.

Do not lead with lower token prices or claim that multi-agent systems are inherently better. Lead with the failure modes documented by equal-budget reasoning research, Stanford CooperBench, Anthropic, and Cognition.

## Release Order

1. Ship MIT licensing, install-first README, topics, source ledger, WHIPS, and controlled evaluation.
2. Propose the APM/unlazy pairing to the unlazy maintainer.
3. Submit APM to maintained agent-skill and Claude-skill lists whose contribution rules it satisfies.
4. Publish the historical essay with the repository launch on Show HN and r/ClaudeAI.
5. Capture GitHub traffic at least every 14 days and annotate each distribution event.

## unlazy Proposal Draft

Title:

```text
Interoperability idea: APM manager ledger above unlazy leaf gates
```

Body:

```markdown
I built APM, a manager-side Agent Skill for orchestrator-worker runs:
https://github.com/EESIZ/APM

The scopes appear complementary:

- APM keeps a manager-owned WHIPS.md for work contracts, handlers, dependencies,
  inspection, proof, correction, and integration.
- unlazy keeps each substantial worker leaf honest with runnable GATES.md checks
  and re-verifiable evidence.

The proposed composition is: use APM as the manager, unlazy inside each leaf.
APM's interoperability contract is here:
https://github.com/EESIZ/APM/blob/main/references/interoperability.md

Would a short reciprocal integration example or reference be useful in unlazy?
I am happy to adapt the terminology to avoid coupling either project.
```

Open a discussion when the repository enables discussions; otherwise use an issue. Do not imply endorsement before the maintainer responds.

## Show HN Draft

Title:

```text
Show HN: APM - manager discipline for orchestrator-worker agent systems
```

Opening:

```text
Peer agent swarms often lose to one coherent agent. The pattern that is actually
shipping is narrower: one manager, bounded subagents, isolated contexts, and one
integration point. APM is an Agent Skill for the missing manager-side controls:
contracts, ownership, proof, corrective redispatch, and verified integration.

It pairs with unlazy: APM disciplines the manager; unlazy proves each worker leaf.
The repo includes a six-case no-skill/APM evaluation and an evidence ledger that
uses the strongest anti-multi-agent research as the reason for the protocol.
```

Link the historical essay after the operational explanation. Its title is "Principal-Agent Management Under Zero Trust: From Cato to Subagents." Keep the provocative historical vocabulary in the source analysis rather than the launch headline.

## r/ClaudeAI Draft

```text
I made a Claude/Codex-compatible skill for agents that manage subagents. It does
not assume more agents are better. It first asks whether delegation earns its
coordination cost, then writes a manager-owned WHIPS ledger for scope, handler,
inspection, proof, and state. A worker cannot mark itself VERIFIED.

The latest six-case blinded evaluation scored 72.2% without the skill and 90.3%
with APM on the same Codex model. Raw outputs are committed, and the README is
explicit that this is one prompt-level run rather than a universal benchmark.
```

## Awesome-List Pitch

```text
- [APM](https://github.com/EESIZ/APM) - Manager-side discipline for
  orchestrator-worker agent systems, with delegation contracts, WHIPS state
  ledgers, evidence-based verification, unlazy interoperability, and a
  reproducible no-skill/APM evaluation.
```

Follow each target list's alphabetical order, description length, license, and test requirements rather than sending one bulk PR.

## Measurement

GitHub's [repository traffic documentation](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository) exposes views, unique visitors, full clones, referrers, and popular content for the previous 14 days. Record a snapshot before each launch action and again 2, 7, and 14 days later.

Track:

| Date | Action | Views | Unique visitors | Clones | Unique cloners | Stars | Top referrer | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |

Useful authenticated commands:

```bash
gh api repos/EESIZ/APM/traffic/views
gh api repos/EESIZ/APM/traffic/clones
gh api repos/EESIZ/APM/traffic/popular/referrers
```

GitHub clones are an imperfect installation proxy: a clone may not be an install, and package-manager caching may hide repeated installs. Treat channel-attributed traffic and clones as directional signals, not exact active-user counts. Prefer a registry's own install analytics if a public author dashboard becomes available.

The repository topics are `claude-skill`, `agent-skill`, `agent-orchestration`, `multi-agent`, `a2a`, `manager-agent`, and `subagents`. GitHub documents topics as a repository discovery mechanism in [Classifying your repository with topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics).
