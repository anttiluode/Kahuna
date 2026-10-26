# Kahuna v0: record protection experiment

Build the smallest inspectable version of the comb proposal. Four records each
hold a learned 2x2 transformation and an inferred two-dimensional context center.
Online nearest-center clustering allocates unused records above distance 0.65.
No task ID or boundary reaches a learner. Context cues are deliberately informative
in the easy condition; that is a limitation, not emergent task discovery.

Compare a protected bank (freeze record AND center after 128 writes), the same
bank without freezing, and a shared polynomial-feature linear learner. Each has
28 mutable numeric slots (224 numeric payload bytes in Float64); object overhead,
global counters, configuration and temporary computation are excluded. There is
no replay buffer. This matches persistent numeric state, not expressivity or FLOPs.

Fixed protocol before results: seeds 11,22,33,44,55; 256 samples per block;
four initial contexts, then four returns. Cases: stable rules; changed rule under
the same cue; identical cues for incompatible rules; six contexts for four slots.
Targets are rotations of random 2D vectors with independent small observation noise.
Score BEFORE learning. After each block evaluate all learned contexts on a separate,
fixed noiseless set without mutation. Report first-acquisition MSE, final MSE,
signed forgetting on initial contexts, saturation refusals and route utilization.

Composition diagnostic chains learned records on all 16 ordered pairs. The
two-step context schedule is PROVIDED. Training sees only single transformations.
Success demonstrates operator reuse, not learned planning or sequence discovery.

There is no promised win threshold: publish all cases and seeds. Expected tradeoff:
freezing preserves compatible old mappings but blocks adaptation to changed rules.
Finite capacity must refuse writes rather than silently overwrite protected slots.
V0 is supervised toy regression, not scalar-reward learning, biological validation,
novel continual-learning research, or an implementation of Williams' theorem.
