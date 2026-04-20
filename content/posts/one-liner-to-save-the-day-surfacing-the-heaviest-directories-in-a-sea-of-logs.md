---
id: 0d681e4f-cc3c-4548-985c-d8c776fc8378
title: "One-Liner to Save the Day: Surfacing the Heaviest Directories in a Sea of Logs"
slug: one-liner-to-save-the-day-surfacing-the-heaviest-directories-in-a-sea-of-logs
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "One-Liner to Save the Day: Surfacing the Heaviest Directories in a Sea of Logs - aws-devops-pro"
question: "Context: On a Unix host, you need a quick robust way to identify the five largest top level directories under /work/projects by disk usage ignoring hidden dirs using a single one-liner with standard UNIX tools. Output: <dir>: <size>K per line. Must tolerate spaces in names and unreadable dirs?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

Picture this: Uber’s logs were exploding, with up to 200TB of Spark-generated data on a single busy day and a monthly mountain of 5PB uncompressed logs. The pressure to retain and search this data without breaking the bank drove a two-phase compression approach that changed everything



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** Context: On a Unix host, you need a quick robust way to identify the five largest top level directories under /work/projects by disk usage ignoring hidden dirs using a single one-liner with standard UNIX tools. Output: : K per line. Must tolerate spaces in names and unreadable dirs?

**A:** Proposed one-liner: enumerate top-level dirs with find -print0, loop per-dir to run du -sk, suppress unreadable errors, sort by size, take 5, and format as dir: sizeK with awk. Handles spaces in names

</details>

## Conclusion

Picture this: Uber’s logs were exploding, with up to 200TB of Spark-generated data on a single busy day and a monthly mountain of 5PB uncompressed logs. The pressure to retain and search this data wit

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)