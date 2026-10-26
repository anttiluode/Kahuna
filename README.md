# Kahuna

**A small, honest continual-learning experiment inspired by combs and records.**

Open `index.html` in a browser. Press **Run experiment** to watch four records
learn transformations. Press **Finish run** for immediate results. Nothing to
install, no server, no GPU, no API key, no network requests.

The interesting result so far: **separate routes help here; freezing is not a
general solution.** An equally sized adaptive bank preserves stable skills too,
and adapts far better when a familiar context changes its rule.

## What the picture means

- A record is a learned 2×2 matrix mapping an input vector to an output vector.
- A needle chooses a record using the nearest learned context center.
- Context is two continuous, noisy observed numbers, not a supplied task ID.
- An unfamiliar cue allocates an unused record. Four slots is the hard limit.
- In the protected bank, 128 writes lock both the record and its routing center.
- The same record may still be read after it is locked.

The rings display the four matrix weights. Their animated rotation is a visual
metaphor, not physical simulation. This is the simplest instance of a writable
operator between fixed readers (the outer projections are identity in v0).

## Three learners, four conditions

1. **Protected records:** context clustering + local normalized LMS updates,
   followed by a fixed write lock.
2. **Adaptive records:** identical clustering and update rule, without locking.
3. **Shared learner:** normalized LMS over fixed polynomial context/input features.

All receive identical samples and targets, predict before learning, and have
**28 persistent numeric slots (224 numeric payload bytes)**. The bank uses 16
matrix weights, eight center coordinates, and four write counters. The shared
learner uses 28 coefficients. Object overhead, fixed settings, constant-size
bookkeeping, scratch computation and evaluator data are excluded. Evaluation
data never enters learning. This is not equal FLOPs or identical expressivity.

Conditions: stable returning contexts; a changed rule under an unchanged cue;
identical cues for incompatible rules; and six contexts for four slots.
The latter refuses writes and predicts zero for unfamiliar contexts after filling.

## Reproduce

Node 18 or newer; zero npm dependencies:

```sh
node --test tests/*.test.cjs
node bench.cjs
```

The benchmark takes seconds on a CPU. It writes `results/benchmark.json`, including
all per-seed metrics and learning histories. The protocol was fixed before the
first run: seeds 11, 22, 33, 44, 55; 256 samples per block; initial exposure followed
by reverse-order returns. No hyperparameter search was performed.

## First results

Mean final held-out MSE over five seeds, using the currently valid rules:

| Condition | Protected | Adaptive | Shared |
|---|---:|---:|---:|
| Stable return | 0.00001 | 0.00001 | 0.01693 |
| Rule changes | 0.16473 | 0.00001 | 0.03934 |
| Ambiguous cues | 0.65976 | 0.66075 | 0.65753 |
| Capacity exceeded | 0.11023 | 0.11023 | 0.23612 |

Raw precision and sample standard deviations are in the JSON. A zero forgetting
score alone proves little: freezing also preserves poor answers. In the changed
rule condition, adaptation increases error against the **obsolete** original
rule; that is desirable adaptation, not an unqualified failure.

The adaptive control shows that sparse separation, not the lock itself, explains
stable retention in this easy experiment. Under identical cues, none of these
memoryless selectors can identify the active rule reliably. The test does not
rule out a system using history or feedback to infer context.

The composition diagnostic feeds one learned transformation into another across
every ordered pair. Single operations alone are trained. **The two-step context
schedule is provided**, so a low error demonstrates operator reuse, not learned
planning or automatic discovery of a composition. It is evaluated after training
and never fed back to any model.

## What remains unsolved

- Learn when to permit rewriting, instead of locking after a fixed count.
- Infer context from less artificial observations and/or temporal history.
- Reuse/compress a full bank without destroying earlier behavior.
- Learn which operations to compose, not just execute a supplied schedule.
- Compare stronger baselines and real data before claiming an advantage.

No novelty, neuroscience, scalar-reward learning, or general continual-learning
claim is made. The protected bank is a conventional modular toy with frozen
experts. The aim is to make its strengths **and failures** inspectable.

## Files

`core.js` is the single browser/Node learning engine; `app.js`, `index.html`, and
`style.css` are its visual microscope. `bench.cjs` runs the fixed protocol.
`tests/core.test.cjs` covers pre-update scoring, evaluation isolation, protection,
capacity and reproducibility. [Protocol](docs/protocol.md) explains the experiment.

Related ingredients: [Progressive Neural Networks](https://arxiv.org/abs/1606.04671),
[active dendrites and contextual routing](https://arxiv.org/abs/2201.00042), and
[fast weights](https://arxiv.org/abs/1610.06258). Kahuna is not an implementation
of Williams' space-saving theorem.
