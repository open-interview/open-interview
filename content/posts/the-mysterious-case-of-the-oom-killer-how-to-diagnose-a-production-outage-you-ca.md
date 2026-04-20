---
id: bed47377-708c-41b8-b605-f62d85297356
title: "The Mysterious Case of the OOM Killer: How to Diagnose a Production Outage You Can’t Ignore"
slug: the-mysterious-case-of-the-oom-killer-how-to-diagnose-a-production-outage-you-ca
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "The Mysterious Case of the OOM Killer: How to Diagnose a Production Outage You Can’t Ignore - aws-devops-pro"
question: "You're troubleshooting a production server where a critical process keeps getting killed. How would you diagnose if it's an OOM kill versus other issues, and what specific commands would you use to investigate?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

Seqera Labs faced a brutal wake-up call in mid-2022: Nextflow tasks on AWS EC2 containers began dying with OOM errors even when memory appeared sufficient



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** You're troubleshooting a production server where a critical process keeps getting killed. How would you diagnose if it's an OOM kill versus other issues, and what specific commands would you use to investigate?

**A:** Check dmesg for 'Out of memory' messages and /var/log/messages. Use `free -h` to see memory usage, `ps aux --sort=-%mem` to find memory hogs, and `cat /proc//status` for VmRSS. If OOM, check `/proc/sys/vm/panic_on_oom` and `/proc/sys/vm/oom_kill_allocating_task` to understand kernel behavior.

</details>

## Conclusion

Seqera Labs faced a brutal wake-up call in mid-2022: Nextflow tasks on AWS EC2 containers began dying with OOM errors even when memory appeared sufficient

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)