import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_POSTS_PATH = path.join(__dirname, '..', 'data', 'blog-posts.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'client', 'public', 'data', 'posts.json');

// Category mapping from channel names to category objects
const CHANNEL_TO_CATEGORY = {
  'backend': { id: 'backend', name: 'Backend', slug: 'backend' },
  'frontend': { id: 'frontend', name: 'Frontend', slug: 'frontend' },
  'devops': { id: 'devops', name: 'DevOps', slug: 'devops' },
  'database': { id: 'database', name: 'Database', slug: 'database' },
  'ai-ml': { id: 'ai-ml', name: 'AI/ML', slug: 'ai-ml' },
  'cloud': { id: 'cloud', name: 'Cloud', slug: 'cloud' },
  'engineering': { id: 'engineering', name: 'Engineering', slug: 'engineering' },
  'security': { id: 'security', name: 'Security', slug: 'security' },
  'mobile': { id: 'mobile', name: 'Mobile', slug: 'mobile' },
  'testing': { id: 'testing', name: 'Testing', slug: 'testing' },
  'architecture': { id: 'architecture', name: 'Architecture', slug: 'architecture' }
};

// Default author for all posts
const DEFAULT_AUTHOR = 'OpenStack Daily';

// Calculate reading time based on content length (200 words per minute)
function calculateReadingTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return readingTime;
}

// Generate content from blog sections
function generateContent(post) {
  let content = `# ${post.blogTitle}\n\n`;

  if (post.blogIntro) {
    content += `${post.blogIntro}\n\n`;
  }

  if (post.blogSections && Array.isArray(post.blogSections)) {
    post.blogSections.forEach(section => {
      content += `## ${section.heading}\n\n`;
      content += `${section.content}\n\n`;
    });
  }

  if (post.blogConclusion) {
    content += `## Wrapping Up\n\n${post.blogConclusion}\n`;
  } else if (post.blogMeta) {
    content += `## Wrapping Up\n\n${post.blogMeta}\n`;
  }

  return content.trim();
}

// Generate excerpt from blogIntro
function generateExcerpt(blogIntro) {
  if (!blogIntro) return '';
  // Remove markdown and trim to ~200 characters
  const plainText = blogIntro.replace(/[#*_~`]/g, '').trim();
  if (plainText.length <= 200) return plainText;
  return plainText.substring(0, 197) + '...';
}

// Generate cover image path from category
function generateCoverImage(category) {
  return `/assets/blog/${category}.jpg`;
}

// Main conversion function
function convertBlogPosts() {
  console.log('Reading blog posts from:', BLOG_POSTS_PATH);
  const blogPosts = JSON.parse(fs.readFileSync(BLOG_POSTS_PATH, 'utf8'));
  console.log(`Found ${blogPosts.length} blog posts`);

  const categoriesMap = new Map();
  const tagsSet = new Set();
  const convertedPosts = [];

  blogPosts.forEach((post, index) => {
    // Map channel to category
    const channel = post.channel || 'backend';
    const category = CHANNEL_TO_CATEGORY[channel] || CHANNEL_TO_CATEGORY['backend'];

    // Track categories
    if (!categoriesMap.has(category.id)) {
      categoriesMap.set(category.id, category);
    }

    // Track tags
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => tagsSet.add(tag));
    }

    // Generate full content
    const fullContent = generateContent(post);

    // Calculate reading time
    const readingTimeMinutes = calculateReadingTime(fullContent);

    // Generate excerpt
    const excerpt = generateExcerpt(post.blogIntro);

    // Create converted post
    const convertedPost = {
      title: post.blogTitle || '',
      slug: post.blogSlug || '',
      excerpt: excerpt,
      coverImage: generateCoverImage(channel),
      author: DEFAULT_AUTHOR,
      category: category.name,
      tags: post.tags || [],
      publishedAt: post.createdAt ? post.createdAt.split('T')[0] : '2026-03-16',
      readingTimeMinutes: readingTimeMinutes,
      featured: false,
      content: fullContent,
      id: post.blogSlug || post.id
    };

    convertedPosts.push(convertedPost);

    if ((index + 1) % 20 === 0) {
      console.log(`Processed ${index + 1}/${blogPosts.length} posts`);
    }
  });

  // Build categories array with descriptions
  const categories = Array.from(categoriesMap.values()).map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: `${cat.name} related articles and tutorials`
  }));

  // Build final output
  const output = {
    posts: convertedPosts,
    categories: categories,
    tags: Array.from(tagsSet).sort()
  };

  // Write output
  console.log('Writing output to:', OUTPUT_PATH);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');

  console.log('\nConversion complete!');
  console.log(`- Posts: ${convertedPosts.length}`);
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Tags: ${output.tags.length}`);

  return output;
}

// Run conversion
try {
  convertBlogPosts();
} catch (error) {
  console.error('Error during conversion:', error);
  process.exit(1);
}
