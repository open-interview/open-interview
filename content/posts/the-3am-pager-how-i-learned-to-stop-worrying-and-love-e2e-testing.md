---
id: 03b5e4de-7a0d-4c57-957d-6591a13826a2
title: "The 3am Pager: How I Learned to Stop Worrying and Love E2E Testing"
slug: the-3am-pager-how-i-learned-to-stop-worrying-and-love-e2e-testing
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "The 3am Pager: How I Learned to Stop Worrying and Love E2E Testing - aws-devops-pro"
question: "You're testing a login form with Playwright. The form has email and password fields, and a submit button. How would you write a basic E2E test to verify successful login and redirect to dashboard?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

It was 3am when the pager went off. The login form was broken in production, and our CEO had just tweeted about the new feature launch. As I stumbled through the darkness to my laptop, I realized the painful truth: our 'comprehensive' test suite had missed the one thing that actually mattered.



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** You're testing a login form with Playwright. The form has email and password fields, and a submit button. How would you write a basic E2E test to verify successful login and redirect to dashboard?

**A:** Use Playwright's test() function with page.locator() to find elements. Fill credentials with fill(), click submit, then waitForURL() or expect(page.url()).toContain('/dashboard'). Add assertions for dashboard elements.

</details>

## Conclusion

It was 3am when the pager went off. The login form was broken in production, and our CEO had just tweeted about the new feature launch. As I stumbled through the darkness to my laptop, I realized the

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)