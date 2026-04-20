---
id: 2359edbc-452c-4842-8de6-cb2fc8042715
title: "When Your API Is Up But Unusable: The 3AM Pager Story Every Developer Fears"
slug: when-your-api-is-up-but-unusable-the-3am-pager-story-every-developer-fears
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "When Your API Is Up But Unusable: The 3AM Pager Story Every Developer Fears - aws-devops-pro"
question: "You're on-call and receive an alert: 'API response time increased from 200ms to 2s over the last 5 minutes'. Using Prometheus, Grafana, and OpenTelemetry, how would you diagnose this issue?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

It was 3 AM when the pager went off. Your API dashboard showed green lights everywhere, but customers were screaming about timeouts. This isn't fiction—it's exactly what happened to Stripe in March 2022, when their median response times skyrocketed from 120ms to over 3 seconds, causing chaos across thousands of integrated businesses



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** You're on-call and receive an alert: 'API response time increased from 200ms to 2s over the last 5 minutes'. Using Prometheus, Grafana, and OpenTelemetry, how would you diagnose this issue?

**A:** Query Prometheus for `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` and `rate(http_requests_total{status=~"5.."}[5m])`, use OpenTelemetry to trace the slow request path across services, correlate with Grafana dashboards showing CPU, memory, and database connection pool metrics.

</details>

## Conclusion

It was 3 AM when the pager went off. Your API dashboard showed green lights everywhere, but customers were screaming about timeouts. This isn't fiction—it's exactly what happened to Stripe in March 20

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)