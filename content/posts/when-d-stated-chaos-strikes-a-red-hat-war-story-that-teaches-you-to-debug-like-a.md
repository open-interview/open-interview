---
id: 62b0ff6b-bd7e-41a0-bfe2-7d13c0b1b3ed
title: "When D-Stated Chaos Strikes: A Red Hat War Story That Teaches You to Debug Like a Pro"
slug: when-d-stated-chaos-strikes-a-red-hat-war-story-that-teaches-you-to-debug-like-a
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "When D-Stated Chaos Strikes: A Red Hat War Story That Teaches You to Debug Like a Pro - aws-devops-pro"
question: "You're debugging a production system where processes are hanging. Using only Unix tools, how would you identify which processes are stuck in uninterruptible sleep (D state) and what could be causing this?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

It was 3am when a flood of D-state processes made a Red Hat Enterprise Linux 7 machine go non-responsive, a scene later traced to kthreadd in an NFS failure recovery path tied to pNFS



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** You're debugging a production system where processes are hanging. Using only Unix tools, how would you identify which processes are stuck in uninterruptible sleep (D state) and what could be causing this?

**A:** Use `ps aux | awk '$8 ~ /^D/ {print $2, $11}'` to identify processes in uninterruptible sleep state. Examine `/proc//stack` for kernel stack traces to understand what system calls are blocking. Common causes include NFS server issues, faulty storage drivers, hardware I/O problems, or disk bottlenecks. Use `iostat -x 1` to monitor I/O activity and `dmesg | grep -i error` to check for hardware or driver errors.

</details>

## Conclusion

It was 3am when a flood of D-state processes made a Red Hat Enterprise Linux 7 machine go non-responsive, a scene later traced to kthreadd in an NFS failure recovery path tied to pNFS

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)