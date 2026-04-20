---
id: 329302d1-fde3-40d4-a1fa-5aecacb50372
title: "From Netflix to Your Serverless: A Journey to Secure, Tenant-Isolated Image Upload on AWS"
slug: from-netflix-to-your-serverless-a-journey-to-secure-tenant-isolated-image-upload
date: "2026-03-21"
author: "Satishkumar Dhule"
channel: aws-devops-pro
category: ""
difficulty: beginner
tags: ["aws-devops-pro"]
description: "From Netflix to Your Serverless: A Journey to Secure, Tenant-Isolated Image Upload on AWS - aws-devops-pro"
question: "Design a beginner-friendly serverless image upload workflow on AWS: users upload images to S3 under a user-specific prefix; a Lambda triggers to resize to two sizes and stores results back; metadata is recorded in DynamoDB. Describe the exact IAM roles and policies for each component to enforce least privilege, and show how you would test that cross-user data access is impossible?"
---

| Difficulty | Channel | Tags |
|---|---|---|
| beginner | aws-devops-pro | aws-devops-pro |

Ever wondered why some image pipelines scale so effortlessly while others stumble? Picture Netflix’s move to a serverless-first image workflow, where preprocessing sits on one side and generation on the other, all while keeping tenants apart and costs in check



---



---







---







<details>
<summary><strong>Original Interview Question</strong></summary>

**Q:** Design a beginner-friendly serverless image upload workflow on AWS: users upload images to S3 under a user-specific prefix; a Lambda triggers to resize to two sizes and stores results back; metadata is recorded in DynamoDB. Describe the exact IAM roles and policies for each component to enforce least privilege, and show how you would test that cross-user data access is impossible?

**A:** Implement a secure serverless image upload workflow with proper IAM segmentation: 1) S3 bucket policy: Enforce user-specific prefix access with `s3:PutObject` and `s3:GetObject` permissions restricted to `${userID}/*` paths for each authenticated user. 2) Lambda execution role: Grant minimal permissions including `s3:GetObject` on source prefixes, `s3:PutObject` on resized image destination prefixes, and `dynamodb:PutItem` on the metadata table. 3) DynamoDB: Implement fine-grained access control using IAM conditions to restrict operations to specific partition keys, ensuring users can only read/write their own records. Apply resource-based policies and IAM condition keys like `aws:PrincipalTag` or `aws:SourceIdentity` to enforce tenant isolation at the infrastructure level.

</details>

## Conclusion

Ever wondered why some image pipelines scale so effortlessly while others stumble? Picture Netflix’s move to a serverless-first image workflow, where preprocessing sits on one side and generation on t

---





---

**Author:** Satishkumar Dhule — [GitHub](https://github.com/satishkumar-dhule) · [LinkedIn](https://linkedin.com/in/satishkumar-dhule) · [Website](https://satishkumar-dhule.github.io)