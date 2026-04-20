---
id: 42c25d0b-d5cf-4cfb-a77d-2093a10d78ca
title: "NUMA in the Night: A Journey from Tail Latency to Locality"
slug: numa-in-the-night-a-journey-from-tail-latency-to-locality
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "NUMA in the Night: A Journey from Tail Latency to Locality - aws-devops-pro"
question: "NUMA-Aware Latency: A Linux host in a multi-tenant analytics cluster shows intermittent 5–20 ms tail latency on a service under sustained I/O. Using only default tooling, design a concrete diagnostic workflow to (1) confirm if latency is caused by remote NUMA memory access, (2) identify the offending process or memory pattern, and (3) apply a safe mitigation such as binding to a local NUMA node or selective interleaving, while preserving observability. Include exact commands and expected outputs?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

Hook: It was 3am when the pager woke the data hall. A Linux host in a multi‑tenant analytics cluster began exhibiting intermittent 5–20 ms tail latency under sustained I/O. The culprit wasn’t a stray bug, but memory traffic leaping across NUMA nodes, turning local reads into remote headaches. Expensify faced a nearly identical nightmare and documented a concrete, default-tooling workflow that restored locality and stability



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** NUMA-Aware Latency: A Linux host in a multi-tenant analytics cluster shows intermittent 5–20 ms tail latency on a service under sustained I/O. Using only default tooling, design a concrete diagnostic workflow to (1) confirm if latency is caused by remote NUMA memory access, (2) identify the offending process or memory pattern, and (3) apply a safe mitigation such as binding to a local NUMA node or selective interleaving, while preserving observability. Include exact commands and expected outputs?

**A:** Plan: 1) numactl --hardware to map NUMA nodes; 2) numastat -p  and cat /proc//numa_maps to spot remote allocations; correlate spikes with remote pages; 3) if remote access dominates, apply m

</details>

## Conclusion

Hook: It was 3am when the pager woke the data hall. A Linux host in a multi‑tenant analytics cluster began exhibiting intermittent 5–20 ms tail latency under sustained I/O. The culprit wasn’t a stray

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)