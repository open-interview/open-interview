# Job Title Personalization Feature

## Overview

The Job Title Personalization feature creates customized learning paths based on a user's job title, experience level, and target company. This enhancement works entirely client-side (localStorage) and integrates with the GitHub Actions content pipeline to generate role-specific content.

## Architecture

### Client-Side Components

1. **User Profile Service** (`client/src/lib/user-profile-service.ts`)
   - Manages user profile in localStorage
   - Defines job title configurations with required/recommended channels
   - Maps experience levels to appropriate difficulty levels
   - Generates personalized learning paths

2. **Personalized Path Page** (`client/src/pages/PersonalizedPath.tsx`)
   - Profile setup wizard for new users
   - Displays customized learning path based on profile
   - Shows required topics, recommended topics, and certifications
   - Direct navigation to relevant channels

### Server-Side Components (GitHub Actions Pipeline)

1. **Job Title Relevance Service** (`script/ai/services/job-title-relevance.js`)
   - Calculates relevance scores for each question across 8 job titles
   - Analyzes channel, tags, keywords, and content
   - Determines appropriate experience levels
   - Scores: 0-100 (higher = more relevant)

2. **Enhanced Question Generation** (`script/generate-question.js`)
   - Automatically enriches new questions with job title metadata
   - Adds `jobTitleRelevance` (JSON mapping of job titles to scores)
   - Adds `experienceLevelTags` (array of suitable experience levels)

3. **Backfill Script** (`script/backfill-job-title-relevance.js`)
   - Updates existing questions with job title relevance
   - Run once to enrich historical data

## Supported Job Titles

1. **Frontend Engineer**
   - Focus: JavaScript, React, HTML/CSS, Web Performance
   - Certifications: None (industry doesn't emphasize certs)

2. **Backend Engineer**
   - Focus: Node.js, Python, Databases, API Design, System Design
   - Certifications: None

3. **Full Stack Engineer**
   - Focus: JavaScript, React, Node.js, Databases, API Design
   - Certifications: None

4. **DevOps Engineer**
   - Focus: Docker, Kubernetes, CI/CD, Linux, Networking
   - Certifications: AWS Solutions Architect, CKA, Terraform Associate

5. **Site Reliability Engineer (SRE)**
   - Focus: SRE, Monitoring, Incident Response, System Design
   - Certifications: AWS Solutions Architect, CKA

6. **Data Engineer**
   - Focus: SQL, Python, Data Pipelines, ETL, Databases
   - Certifications: AWS Data Analytics, GCP Data Engineer

7. **ML Engineer**
   - Focus: Machine Learning, Python, Algorithms, Deep Learning
   - Certifications: AWS ML Specialty, TensorFlow Developer

8. **Cloud Architect**
   - Focus: AWS, System Design, Networking, Security
   - Certifications: AWS Solutions Architect, Azure Solutions Architect, GCP Architect

## Experience Levels

- **Entry**: Beginner to Intermediate difficulty
- **Mid**: Intermediate to Advanced difficulty
- **Senior**: Advanced difficulty only
- **Staff**: Advanced difficulty, leadership focus
- **Principal**: Advanced difficulty, strategy focus

## How It Works

### User Flow

1. **First Visit**
   - User navigates to `/personalized-path`
   - Sees profile setup wizard
   - Selects job title, experience level, and optionally target company
   - Profile saved to localStorage

2. **Personalized Path Display**
   - Shows "Must-Know Topics" (required channels for role)
   - Shows "Recommended Topics" (nice-to-have channels)
   - Shows "Recommended Certifications" (if applicable)
   - Each topic links directly to practice questions

3. **Profile Updates**
   - User can edit profile anytime via "Edit Profile" button
   - Changes immediately update the learning path

### Content Generation Flow

1. **Question Created**
   - Bot generates question via GitHub Actions
   - `job-title-relevance.js` analyzes the question
   - Calculates relevance scores for all 8 job titles
   - Determines suitable experience levels
   - Metadata saved to database

2. **Relevance Calculation**
   - **Primary Channel Match** (40 points): Question's channel is in job's primary list
   - **Secondary Channel Match** (20 points): Question's channel is in job's secondary list
   - **Tag/Sub-channel Match** (15 points): Tags match job's channels
   - **Keyword Match** (25 points max): Question/answer contains job-specific keywords
   - **Total**: 0-100 score per job title

3. **Experience Level Mapping**
   - Beginner questions → Entry, Mid levels
   - Intermediate questions → Entry, Mid levels
   - Advanced questions → Mid, Senior, Staff, Principal levels

## Database Schema Changes

```typescript
// Added to questions table in shared/schema.ts
jobTitleRelevance: text("job_title_relevance"), // JSON mapping job titles to scores
experienceLevelTags: text("experience_level_tags"), // JSON array of experience levels
```

Example data:
```json
{
  "jobTitleRelevance": {
    "frontend-engineer": 85,
    "fullstack-engineer": 60,
    "backend-engineer": 20,
    "devops-engineer": 10,
    "sre": 5,
    "data-engineer": 0,
    "ml-engineer": 0,
    "cloud-architect": 15
  },
  "experienceLevelTags": ["entry", "mid"]
}
```

## Usage

### For Users

1. Navigate to "My Learning Path" in the Learn menu
2. Complete profile setup (one-time)
3. Follow the customized learning path
4. Update profile as you progress in your career

### For Developers

#### Run Backfill Script
```bash
node script/backfill-job-title-relevance.js
```

#### Add New Job Title
1. Update `JOB_TITLES` in `client/src/lib/user-profile-service.ts`
2. Update `JOB_TITLE_CONFIGS` in `script/ai/services/job-title-relevance.js`
3. Run backfill script to update existing questions

#### Query Questions by Job Title
```javascript
// Client-side filtering (questions already loaded)
const relevantQuestions = allQuestions.filter(q => {
  const relevance = JSON.parse(q.jobTitleRelevance || '{}');
  return relevance['frontend-engineer'] >= 50; // 50+ = relevant
});
```

## Benefits

1. **Personalized Experience**: Users see content relevant to their career goals
2. **Efficient Learning**: Focus on must-know topics first
3. **Career Progression**: Paths adapt to experience level
4. **Company-Specific Prep**: Optional target company field for future enhancements
5. **Static Site Compatible**: No backend required, works on GitHub Pages
6. **Automatic Enrichment**: New questions automatically tagged with relevance

## Future Enhancements

1. **Company-Specific Content**
   - Generate questions based on target company's tech stack
   - Company interview style preferences (e.g., Google = algorithms heavy)

2. **Progress Tracking**
   - Track completion percentage per learning path
   - Suggest next topics based on progress

3. **Dynamic Difficulty Adjustment**
   - Adjust recommended difficulty based on performance
   - Suggest moving to next experience level

4. **Learning Path Analytics**
   - Show time estimates per topic
   - Display completion rates for each role

5. **Multi-Role Support**
   - Allow users to prepare for multiple roles simultaneously
   - Compare learning paths between roles

## Testing

### Manual Testing
1. Visit `/personalized-path`
2. Create profile with different job titles
3. Verify correct channels appear in required/recommended sections
4. Check that certifications show for relevant roles (DevOps, SRE, Data, ML, Cloud)
5. Edit profile and verify path updates

### Automated Testing
```bash
# Test job title relevance calculation
node script/ai/services/job-title-relevance.js

# Test backfill script (dry run)
node script/backfill-job-title-relevance.js
```

## Performance Considerations

- **Client-Side**: Profile stored in localStorage (< 1KB)
- **Database**: Two new text columns per question (< 500 bytes each)
- **Generation**: Adds ~50ms per question during generation
- **Backfill**: Processes ~100 questions/second

## Maintenance

- **Job Title Configs**: Update when industry trends change
- **Channel Mappings**: Keep in sync with actual channel IDs in database
- **Keyword Lists**: Expand based on question content analysis
- **Experience Levels**: Adjust difficulty mappings based on user feedback
