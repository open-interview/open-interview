---
id: 2191baf5-63f5-4a98-86fc-be389180e9c8
title: "Quota Wars: Designing a Cost-Aware, Multi-Tenant LLM Gateway"
slug: quota-wars-designing-a-cost-aware-multi-tenant-llm-gateway
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "Quota Wars: Designing a Cost-Aware, Multi-Tenant LLM Gateway - aws-devops-pro"
question: "Design a beginner-friendly cost-aware routing policy for a multi-tenant LLM gateway used by Coinbase, Airbnb, and Discord. Tenants have different budgets and SLAs. Propose a lightweight per-tenant budget model, token throttling, and a fallback to cheaper models when budgets are exhausted. Describe data models, config, and a minimal test plan, including latency targets and rough cost estimates?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

Picture this: Microsoft scales Azure OpenAI deployments across 50+ models, only to watch per-region TPM/RPM quotas throttle deployments and burst traffic, triggering Terraform failures and furious retries



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** Design a beginner-friendly cost-aware routing policy for a multi-tenant LLM gateway used by Coinbase, Airbnb, and Discord. Tenants have different budgets and SLAs. Propose a lightweight per-tenant budget model, token throttling, and a fallback to cheaper models when budgets are exhausted. Describe data models, config, and a minimal test plan, including latency targets and rough cost estimates?

**A:** Implement per-tenant budgets with a token bucket and a model-tier selector. On each request, deduct tokens; if the bucket falls below a low-water mark, route to a lighter model or trim context to meet

</details>

## Conclusion

Picture this: Microsoft scales Azure OpenAI deployments across 50+ models, only to watch per-region TPM/RPM quotas throttle deployments and burst traffic, triggering Terraform failures and furious ret

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)