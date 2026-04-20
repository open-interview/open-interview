---
id: 8e5766c3-08b2-45fc-bcb4-4196931174ae
title: "The Multi-Million Dollar Bug: How Uber Saved UberEats from Data Apocalypse"
slug: the-multi-million-dollar-bug-how-uber-saved-ubereats-from-data-apocalypse
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "The Multi-Million Dollar Bug: How Uber Saved UberEats from Data Apocalypse - aws-devops-pro"
question: "How would you implement exactly-once processing in a data pipeline when both source (Kafka) and sink (database) can fail, ensuring no duplicate data or data loss during network partitions and system crashes?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

Picture this: It's Black Friday, and UberEats is processing millions of ad impressions and clicks. Every duplicate impression means lost revenue; every missed click means unhappy advertisers. Uber faced exactly this nightmare scenario when they discovered their real-time ad processing system was silently overcounting events, potentially costing millions in inaccurate billing



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** How would you implement exactly-once processing in a data pipeline when both source (Kafka) and sink (database) can fail, ensuring no duplicate data or data loss during network partitions and system crashes?

**A:** Implement Kafka transactions with idempotent producers (enable.idempotence=true), use database transaction IDs for deduplication, commit offsets only after successful DB commit, and configure EOS=ALWAYS for exactly-once semantics. Include retry logic with exponential backoff and dead-letter queue handling.

</details>

## Conclusion

Picture this: It's Black Friday, and UberEats is processing millions of ad impressions and clicks. Every duplicate impression means lost revenue; every missed click means unhappy advertisers. Uber fac

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)