---
id: a6d7fcc3-d23b-42ba-b45c-68dc8535b9dc
title: "Active-Active DR Across Regions: A Terraform Tale Told in Data Bridges and Gatekeepers"
slug: active-active-dr-across-regions-a-terraform-tale-told-in-data-bridges-and-gateke
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "Active-Active DR Across Regions: A Terraform Tale Told in Data Bridges and Gatekeepers - aws-devops-pro"
question: "Scenario: you implement a DR pattern across regions. A primary repo in us-east-1 exports VPC data via remote state. A DR repo in us-west-2 must read these values as read-only data sources and not modify primary resources. Design the Terraform pattern with per-env backends, a provider alias for the primary region, and a CI gate that blocks any plan that would create/modify resources in the primary region. Include minimal snippets for the data bridge and gating logic?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

Picture this: Netflix deployed an active-active, multi‑regional resiliency pattern to endure region outages and keep viewers streaming without a hitch



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** Scenario: you implement a DR pattern across regions. A primary repo in us-east-1 exports VPC data via remote state. A DR repo in us-west-2 must read these values as read-only data sources and not modify primary resources. Design the Terraform pattern with per-env backends, a provider alias for the primary region, and a CI gate that blocks any plan that would create/modify resources in the primary region. Include minimal snippets for the data bridge and gating logic?

**A:** Implement per-environment backends with dedicated provider aliases. The DR repository uses terraform_remote_state to read primary VPC data as read-only data sources, with strict backend isolation and provider configuration to prevent cross-region resource modifications.

</details>

## Conclusion

Picture this: Netflix deployed an active-active, multi‑regional resiliency pattern to endure region outages and keep viewers streaming without a hitch

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)