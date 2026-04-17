# Job Title Personalization - Quick Start Guide

## 🚀 What Is This?

A personalized learning path system that customizes interview prep content based on your job title, experience level, and target company. Works entirely client-side on GitHub Pages.

## ✨ Features

- **8 Job Titles**: Frontend, Backend, Full Stack, DevOps, SRE, Data Engineer, ML Engineer, Cloud Architect
- **5 Experience Levels**: Entry, Mid, Senior, Staff, Principal
- **Automatic Content Tagging**: Questions scored 0-100 for relevance to each role
- **Personalized Paths**: See only the topics that matter for your career
- **No Backend Required**: All data stored in localStorage

## 🎯 For Users

### Setup Your Profile

1. Navigate to **Learn → My Learning Path** in the menu
2. Select your job title (e.g., "Frontend Engineer")
3. Choose your experience level (e.g., "Mid")
4. Optionally add target company (e.g., "Google")
5. Click "Create My Learning Path"

### Use Your Learning Path

Your personalized path shows:
- **Must-Know Topics** (red badge): Required channels for your role
- **Recommended Topics** (blue badge): Nice-to-have channels
- **Certifications** (yellow): Relevant certification prep

Click any topic to start practicing questions!

### Update Your Profile

As you progress in your career:
1. Click "Edit Profile" button
2. Update experience level or job title
3. Your learning path updates instantly

## 🛠️ For Developers

### Test the Feature

```bash
# Test relevance calculation algorithm
npm run test:job-titles

# Expected output:
# ✅ Passed: 5/5
# 📈 Success Rate: 100%
```

### Backfill Existing Questions

```bash
# Add job title metadata to all existing questions
npm run backfill:job-titles

# Expected output:
# ✅ Backfill complete!
#    Updated: 1234
#    Skipped: 0
#    Total: 1234
```

### Generate New Questions

Questions are automatically enriched during generation:

```bash
# Generate questions (already includes job title enrichment)
node script/generate-question.js

# Output includes:
# 📊 Job title relevance calculated for 8 roles
```

### Add a New Job Title

1. **Update Client Config** (`client/src/lib/user-profile-service.ts`):
```typescript
export const JOB_TITLES = {
  'security-engineer': {
    id: 'security-engineer',
    title: 'Security Engineer',
    category: 'engineering',
    requiredChannels: ['security', 'networking', 'cryptography'],
    recommendedChannels: ['penetration-testing', 'compliance'],
    certifications: ['cissp', 'ceh'],
    experienceLevels: {
      entry: { channels: [...], difficulty: ['beginner', 'intermediate'] },
      // ... other levels
    }
  }
};
```

2. **Update Pipeline Config** (`script/ai/services/job-title-relevance.js`):
```javascript
const JOB_TITLE_CONFIGS = {
  'security-engineer': {
    primaryChannels: ['security', 'networking', 'cryptography'],
    secondaryChannels: ['penetration-testing', 'compliance'],
    keywords: ['security', 'vulnerability', 'encryption', 'threat']
  }
};
```

3. **Run Backfill**:
```bash
npm run backfill:job-titles
```

## 📊 How Relevance Scoring Works

Each question gets a score (0-100) for each job title:

```
Score = Primary Channel (40) + Secondary Channel (20) + Tags (15) + Keywords (25)

Example: React Hooks Question
├── Frontend Engineer: 85 (primary + keywords)
├── Full Stack Engineer: 60 (secondary + keywords)
├── Backend Engineer: 20 (keywords only)
└── DevOps Engineer: 10 (minimal relevance)
```

### Scoring Breakdown

| Component | Points | Description |
|-----------|--------|-------------|
| Primary Channel | 40 | Question's channel is in job's primary list |
| Secondary Channel | 20 | Question's channel is in job's secondary list |
| Tag/Sub-channel | 15 | Tags match job's channels |
| Keywords | 25 | Question/answer contains job-specific keywords (5 per keyword, max 5) |

## 🗄️ Database Schema

```typescript
// Added to questions table
jobTitleRelevance: text("job_title_relevance")
// JSON: {"frontend-engineer": 85, "backend-engineer": 20, ...}

experienceLevelTags: text("experience_level_tags")
// JSON: ["entry", "mid"]
```

## 📁 File Structure

```
client/src/
├── lib/
│   └── user-profile-service.ts      # Profile management + job configs
└── pages/
    └── PersonalizedPath.tsx          # Learning path UI

script/
├── ai/services/
│   └── job-title-relevance.js       # Relevance calculation
├── generate-question.js              # Enhanced with job title enrichment
├── backfill-job-title-relevance.js  # Backfill script
└── test-job-title-relevance.js      # Test suite

docs/
├── JOB_TITLE_PERSONALIZATION.md     # Full documentation
└── JOB_TITLE_QUICK_START.md         # This file
```

## 🧪 Testing Checklist

- [ ] Profile creation works for all job titles
- [ ] Learning paths show correct channels
- [ ] Certifications appear for relevant roles
- [ ] Profile editing updates the path
- [ ] Navigation to channels works
- [ ] localStorage persists across sessions
- [ ] Relevance calculation passes all tests
- [ ] Backfill script completes successfully

## 🚢 Deployment

### Step 1: Run Tests
```bash
npm run test:job-titles
```

### Step 2: Backfill Data
```bash
npm run backfill:job-titles
```

### Step 3: Deploy
```bash
git add .
git commit -m "Add job title personalization"
git push origin main
```

### Step 4: Verify
1. Visit deployed site
2. Go to /personalized-path
3. Create profile
4. Verify learning path appears

## 📈 Success Metrics

Track these to measure feature adoption:
- % of users who create a profile
- Most popular job titles
- Click-through rate from personalized path to channels
- Profile edit frequency

## 🐛 Troubleshooting

### Profile Not Saving
- Check browser localStorage is enabled
- Clear localStorage and try again: `localStorage.clear()`

### Learning Path Empty
- Verify job title config has channels defined
- Check that channels exist in database
- Run backfill script to ensure questions have metadata

### Relevance Scores Too Low
- Review keyword lists in `job-title-relevance.js`
- Adjust scoring weights if needed
- Add more secondary channels to job config

## 💡 Tips

1. **Start with Entry Level**: Even experienced devs benefit from reviewing fundamentals
2. **Complete Required Topics First**: These are must-knows for your role
3. **Update Profile Regularly**: As you learn, increase your experience level
4. **Target Company**: Use this to focus on company-specific tech stacks

## 🔗 Related Documentation

- [Full Documentation](./JOB_TITLE_PERSONALIZATION.md)
- [Implementation Summary](../JOB_TITLE_PERSONALIZATION_SUMMARY.md)
- [Database Schema](../shared/schema.ts)

## 🤝 Contributing

Want to add a new job title or improve relevance scoring?

1. Fork the repo
2. Add job title configs (see "Add a New Job Title" above)
3. Test with `npm run test:job-titles`
4. Submit PR with description

## 📞 Support

Questions or issues? Open a GitHub issue with:
- Job title and experience level
- Expected vs actual learning path
- Browser console errors (if any)

---

**Built with ❤️ for developers preparing for their dream job**
