---
id: d4431350-cdb7-485e-8010-c28c1706eeb1
title: "Sticky Sessions at Scale: Booking.com's HAProxy Playbook and the Locality Dilemma"
slug: sticky-sessions-at-scale-bookingcoms-haproxy-playbook-and-the-locality-dilemma
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "Sticky Sessions at Scale: Booking.com's HAProxy Playbook and the Locality Dilemma - aws-devops-pro"
question: "How would you implement session affinity (sticky sessions) in HAProxy while maintaining high availability, and what are the trade-offs compared to stateless load balancing?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

Booking.com scaled its global application delivery network using an internal LBaaS built around HAProxy to manage billions of requests per day. To avoid session data issues across multiple Availability Zones, they implemented smart routing that keeps a user within a single AZ, leveraging per-AZ pools and a centralized Balancer API



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** How would you implement session affinity (sticky sessions) in HAProxy while maintaining high availability, and what are the trade-offs compared to stateless load balancing?

**A:** Implement session affinity in HAProxy using either source IP hashing with 'balance source' or cookie-based stick tables, while maintaining high availability through health checks. The trade-offs include improved user experience and session consistency versus reduced scalability and potential uneven load distribution.

</details>

## Conclusion

Booking.com scaled its global application delivery network using an internal LBaaS built around HAProxy to manage billions of requests per day. To avoid session data issues across multiple Availabilit

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)