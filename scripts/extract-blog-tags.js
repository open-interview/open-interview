import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogPostsPath = path.join(__dirname, '..', 'data', 'blog-posts.json');
const outputPath = path.join(__dirname, '..', 'data', 'blog-tags.json');

try {
  const blogPosts = JSON.parse(fs.readFileSync(blogPostsPath, 'utf8'));
  
  const tagsSet = new Set();
  
  blogPosts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => tagsSet.add(tag));
    }
  });
  
  const uniqueTags = Array.from(tagsSet).sort();
  
  const tagsData = {
    tags: uniqueTags,
    count: uniqueTags.length
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(tagsData, null, 2));
  
  console.log(`Extracted ${uniqueTags.length} unique tags`);
  console.log(`Output written to: ${outputPath}`);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
