---
id: fcb7e629-7b69-4880-9b94-bfe5fd0dde6c
title: "When Routes Become Recipes: A DP Journey Through Last‑Mile Routing"
slug: when-routes-become-recipes-a-dp-journey-through-lastmile-routing
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "When Routes Become Recipes: A DP Journey Through Last‑Mile Routing - aws-devops-pro"
question: "You're planning a delivery route along a straight street of n blocks. At block i you can advance up to jumps[i] blocks (at least 1). How many distinct routes reach block n-1 from block 0? If unreachable, return 0. Propose a dynamic-programming approach with dp[i] as ways to reach i and outline its time/space complexity, edge cases, and a brief correctness justification. How would you implement it?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

Picture this: UPS rolls out ORION to orchestrate last‑mile routes across its vast driver network, enabling data‑driven, real‑time replanning as conditions shift. That transformation isn’t just clever logistics; it’s a story about turning messy, real‑world constraints into reliable routes. UPS’s experience shows that planning ahead—then adapting on the fly—can unlock meaningful savings and service improvements



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** You're planning a delivery route along a straight street of n blocks. At block i you can advance up to jumps[i] blocks (at least 1). How many distinct routes reach block n-1 from block 0? If unreachable, return 0. Propose a dynamic-programming approach with dp[i] as ways to reach i and outline its time/space complexity, edge cases, and a brief correctness justification. How would you implement it?

**A:** Use a 1D DP: dp[i] is number of ways to reach i. Initialize dp[0] = 1. For i from 0 to n-1, let maxJump = min(jumps[i], n-1-i); for s from 1 to maxJump, dp[i+s] = (dp[i+s] + dp[i]) % 1000000007. Retur

</details>

## Conclusion

Picture this: UPS rolls out ORION to orchestrate last‑mile routes across its vast driver network, enabling data‑driven, real‑time replanning as conditions shift. That transformation isn’t just clever

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)