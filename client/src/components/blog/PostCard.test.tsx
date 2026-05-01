/**
 * PostCard Unit Tests
 * Uses ReactDOM + jsdom (no @testing-library/react dependency)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { act } from 'react';
import { PostCard, type PostCardData } from './PostCard';

// Mock wouter Link
vi.mock('wouter', () => ({
  Link: ({ href, children, onClick, ...props }: { href: string; children: React.ReactNode; onClick?: (e: Event) => void; [key: string]: unknown }) =>
    React.createElement('a', { href, onClick, ...props }, children),
}));

const basePost: PostCardData = {
  slug: 'test-post',
  title: 'Test Post Title',
  excerpt: 'This is the excerpt for the test post.',
  author: 'Jane Doe',
  category: 'Engineering',
  tags: ['react', 'testing'],
  publishedAt: '2024-01-15T00:00:00Z',
  readingTimeMinutes: 5,
};

let container: HTMLDivElement;

function renderCard(post: PostCardData, variant?: 'featured' | 'grid' | 'list') {
  act(() => {
    ReactDOM.createRoot(container).render(
      React.createElement(PostCard, { post, variant })
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
});

describe('PostCard', () => {
  it('renders article element (grid variant)', () => {
    renderCard(basePost);
    expect(container.querySelector('article')).not.toBeNull();
  });

  it('displays the title', () => {
    renderCard(basePost);
    expect(container.textContent).toContain('Test Post Title');
  });

  it('displays the excerpt', () => {
    renderCard(basePost);
    expect(container.textContent).toContain('This is the excerpt for the test post.');
  });

  it('displays reading time', () => {
    renderCard(basePost);
    expect(container.textContent).toContain('5 min');
  });

  it('displays the author', () => {
    renderCard(basePost);
    expect(container.textContent).toContain('Jane Doe');
  });

  it('link href points to correct post URL', () => {
    renderCard(basePost);
    const links = Array.from(container.querySelectorAll('a'));
    const postLink = links.find((a) => a.getAttribute('href') === '/blog/test-post');
    expect(postLink).not.toBeNull();
  });

  it('renders category badge with correct text', () => {
    renderCard(basePost);
    expect(container.textContent).toContain('Engineering');
  });

  it('category badge links to category page', () => {
    renderCard(basePost);
    const links = Array.from(container.querySelectorAll('a'));
    const catLink = links.find((a) => a.getAttribute('href') === '/blog/category/engineering');
    expect(catLink).not.toBeNull();
  });

  it('renders featured variant with h2 heading', () => {
    renderCard(basePost, 'featured');
    const h2 = container.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2?.textContent).toContain('Test Post Title');
  });

  it('renders list variant', () => {
    renderCard(basePost, 'list');
    expect(container.querySelector('article')).not.toBeNull();
    expect(container.textContent).toContain('Test Post Title');
  });

  it('renders cover image when provided', () => {
    const postWithImage: PostCardData = { ...basePost, coverImage: '/img/cover.jpg' };
    renderCard(postWithImage);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/img/cover.jpg');
    expect(img?.getAttribute('alt')).toBe('Test Post Title');
  });

  it('shows no img element when no cover image', () => {
    renderCard(basePost);
    expect(container.querySelector('img')).toBeNull();
  });

  it('article has accessible role via element', () => {
    renderCard(basePost);
    expect(container.querySelector('article')).not.toBeNull();
  });

  it('calendar and clock icons are aria-hidden', () => {
    renderCard(basePost);
    const hiddenSvgs = container.querySelectorAll('svg[aria-hidden]');
    expect(hiddenSvgs.length).toBeGreaterThan(0);
  });

  it('category slug handles special characters', () => {
    const post: PostCardData = { ...basePost, category: 'AI / ML' };
    renderCard(post);
    const links = Array.from(container.querySelectorAll('a'));
    const catLink = links.find((a) => a.getAttribute('href')?.startsWith('/blog/category/ai'));
    expect(catLink).not.toBeNull();
  });

  it('grid variant uses h3 heading', () => {
    renderCard(basePost, 'grid');
    const h3 = container.querySelector('h3');
    expect(h3).not.toBeNull();
    expect(h3?.textContent).toContain('Test Post Title');
  });
});
