# Enhanced Question Generation with Certification Awareness

## Overview

The question generation system now automatically considers certifications when generating questions for channels.

## How It Works

When you generate a question for a channel (e.g., 'aws', 'kubernetes'), the system:

1. ✅ Generates a regular interview question (existing logic)
2. ✅ Checks if the channel maps to any certifications
3. ✅ Optionally generates certification MCQ questions for related certs

## Channel to Certification Mappings

- **aws**: aws-saa, aws-sap, aws-dva, aws-sysops, terraform-associate, aws-security, aws-data-engineer, aws-ml-specialty, aws-database, aws-networking
- **backend**: aws-dva, ckad, psd
- **behavioral**: psd
- **data-engineering**: aws-data-engineer, aws-ml-specialty
- **database**: aws-dva, gcp-pca, az-305, aws-data-engineer, aws-database
- **devops**: aws-dva, aws-sysops, cka, ckad, cks, terraform-associate, gcp-ace, gcp-pca, az-104, psd
- **docker**: ckad
- **kubernetes**: cka, ckad, cks, gcp-ace
- **linux**: aws-sysops, cka, az-104, comptia-security-plus, linux-plus, rhcsa, ccna
- **machine-learning**: aws-ml-specialty
- **networking**: aws-saa, aws-sap, cka, cks, gcp-ace, az-900, az-104, az-305, comptia-security-plus, aws-security, linux-plus, rhcsa, ccna, aws-networking
- **operating-systems**: linux-plus, rhcsa
- **python**: aws-ml-specialty
- **security**: aws-saa, aws-sap, cks, gcp-pca, az-900, az-104, az-305, comptia-security-plus, aws-security, linux-plus, ccna, aws-networking
- **sre**: aws-sysops
- **system-design**: aws-saa, aws-sap, gcp-ace, gcp-pca, az-900, az-305, aws-database
- **terraform**: terraform-associate
- **testing**: psd

## Usage

### Basic Usage (with certifications)

```javascript
import { generateQuestionWithCertifications } from './ai/graphs/enhanced-question-generator.js';

const result = await generateQuestionWithCertifications({
  channel: 'aws',
  difficulty: 'intermediate'
});

// Result contains:
// - result.regular: Regular interview question
// - result.certifications: Array of cert questions for related certs
```

### Skip Certification Questions

```javascript
const result = await generateQuestionWithCertifications({
  channel: 'aws',
  difficulty: 'intermediate',
  includeCertifications: false  // Skip cert questions
});
```

### Control Number of Cert Questions

```javascript
const result = await generateQuestionWithCertifications({
  channel: 'kubernetes',
  difficulty: 'advanced',
  certQuestionsPerCert: 3  // Generate 3 MCQs per related cert
});
```

## Integration with Existing Code

### Option 1: Replace Existing Calls

Replace:
```javascript
import { generateQuestion } from './ai/graphs/question-graph.js';
const result = await generateQuestion({ channel: 'aws', difficulty: 'intermediate' });
```

With:
```javascript
import { generateQuestionWithCertifications } from './ai/graphs/enhanced-question-generator.js';
const result = await generateQuestionWithCertifications({ 
  channel: 'aws', 
  difficulty: 'intermediate' 
});
```

### Option 2: Use Alongside Existing

Keep existing code and add certification generation:
```javascript
import { generateQuestion } from './ai/graphs/question-graph.js';
import { getCertificationsForChannel } from './ai/graphs/enhanced-question-generator.js';
import { generateCertificationQuestions } from './ai/graphs/certification-question-graph.js';

// Generate regular question
const regularQ = await generateQuestion({ channel: 'aws' });

// Check for related certs
const certs = getCertificationsForChannel('aws');
if (certs.length > 0) {
  // Generate cert questions
  for (const certId of certs) {
    const certQ = await generateCertificationQuestions({ certificationId: certId });
  }
}
```

## Helper Functions

### getCertificationsForChannel(channel)
Returns array of certification IDs related to a channel.

```javascript
import { getCertificationsForChannel } from './ai/graphs/enhanced-question-generator.js';

const certs = getCertificationsForChannel('aws');
// Returns: ['aws-saa', 'aws-sap', 'aws-dva', 'aws-sysops', ...]
```

### hasRelatedCertifications(channel)
Check if a channel has related certifications.

```javascript
import { hasRelatedCertifications } from './ai/graphs/enhanced-question-generator.js';

if (hasRelatedCertifications('aws')) {
  console.log('AWS channel has related certifications');
}
```

### getChannelsWithCertifications()
Get all channels that have certification mappings.

```javascript
import { getChannelsWithCertifications } from './ai/graphs/enhanced-question-generator.js';

const channels = getChannelsWithCertifications();
// Returns: ['aws', 'kubernetes', 'system-design', 'networking', ...]
```

## Benefits

1. **Automatic Coverage**: Certification questions are generated automatically when working with related channels
2. **Balanced Content**: Ensures both interview questions and certification prep content
3. **Flexible**: Can enable/disable certification generation per call
4. **Discoverable**: Helper functions make it easy to see channel-cert relationships

## Files Created

- `script/ai/graphs/enhanced-question-generator.js` - Main enhanced generator
- `script/examples/enhanced-question-generation-example.js` - Usage examples
- `docs/ENHANCED_QUESTION_GENERATION.md` - This guide

## Regenerating

If certifications config changes, regenerate the enhanced generator:

```bash
node script/enhance-question-generation-with-certs.js
```

This will update the channel-to-cert mappings automatically.
