---
id: 7e38ea11-ebfc-4575-84d2-4cc6a2839223
title: "The 24-Hour Log Hunt: A One-Liner That Surfaces Busy Users (And Why Knight Capital's Lesson Still Matters)"
slug: the-24-hour-log-hunt-a-one-liner-that-surfaces-busy-users-and-why-knight-capital
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "The 24-Hour Log Hunt: A One-Liner That Surfaces Busy Users (And Why Knight Capital's Lesson Still Matters) - aws-devops-pro"
question: "In a Unix environment logs are stored in /var/log/app/*.log with lines formatted as timestamp|user|action|resource. Write a practical one-liner using standard UNIX tools to output the top 5 users by total actions in the last 24 hours. Explain how you would handle log rotation and malformed lines?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

In August 2012, Knight Capital Group deployed a new trading system. In about 45 minutes, a faulty deployment flooded the market with erroneous orders, triggering a $440M loss and nearly bankrupting the firm



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** In a Unix environment logs are stored in /var/log/app/*.log with lines formatted as timestamp|user|action|resource. Write a practical one-liner using standard UNIX tools to output the top 5 users by total actions in the last 24 hours. Explain how you would handle log rotation and malformed lines?

**A:** One practical approach is to filter the last 24h files, extract the user, and count actions. Example: find /var/log/app/*.log -type f -mtime -1 -print0 | xargs -0 cat | awk -F'|' 'NF>=4{cnt[$2]++} END

</details>

## Conclusion

In August 2012, Knight Capital Group deployed a new trading system. In about 45 minutes, a faulty deployment flooded the market with erroneous orders, triggering a $440M loss and nearly bankrupting th

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)