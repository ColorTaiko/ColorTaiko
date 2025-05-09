# ColorTaiko!

**ColorTaiko!** is an [Illinois Mathematics Lab (IML)](https://iml.math.illinois.edu/) project which started in [Spring 2024](https://iml.math.illinois.edu/research/upcoming-projects/), has continued throughout [Fall 2024](https://iml.math.illinois.edu/fall-2024-iml-research-projects/) & [Spring 2025](https://iml.math.illinois.edu/spring-2025-iml-research-projects/), & is set to continue in Fall 2025 in the Department of Mathematics at the University of Illinois Urbana-Champaign (UIUC). It introduces a playful, interactive game challenging players to explore color patterns & solve puzzles. Future levels will be added, so come back & try your skills as the game evolves!

## What is ColorTaiko!?

The game is inspired by the research article [**"The topology & geometry of units & zero-divisors: origami"**](https://mineyev.web.illinois.edu/art/top-geom-uzd-origami.pdf) by Igor Mineyev. This work explores how certain colorings of bipartite graphs could potentially lead to counterexamples to the **Kaplansky conjectures**, long-standing open problems in algebra related to group algebras. In the full version of the game, solving increasingly difficult levels could potentially bring new insights or counterexamples related to these mathematical problems. 

Particularly, **ColorTaiko!** could potentially shed light on **Kaplansky's conjectures**, which asks: Given a field & a torsion-free group, does the group ring contain any non-trivial zero divisors or non-trivial units? The 1st counterexample to the unit conjecture was presented by Giles Gardam in 2021. This counterexample involved the fundamental group of the Hantzsche–Wendt manifold over a field of characteristic 2, which inspired the paper by Igor Mineyev &, subsequently, this game. The zero-divisor conjecture remains open to this day.

## Current Version

The goal for **ColorTaiko!** is to create a complete bipartite graph satisfying certain conditions:
- _Level 1_ implements color merging when the condition is satisfied.
- _Level 2_ implements orientation of horizontal edges & detects when orientation fails.
- _Level 3_ implements no-fold condition.
- _Level 4NP_ implements no pattern condition.
- _Level 4.6_ implements girth-6 condition on both the top & bottom graphs.
- _Level 5NP.6_ combines no pattern & girth-6 condition. Successful completion of this level will yield a counterexample to 1 of the conjectures.

You can play the game at the link below, have fun!:  
[https://play.math.illinois.edu/ColorTaiko!/](https://play.math.illinois.edu/ColorTaiko!/)