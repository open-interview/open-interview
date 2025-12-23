/**
 * Coding Challenges System
 * Generates simple to medium coding questions that can be tested in browser
 * Auto-calculates complexity and provides sample answers
 */

export type Difficulty = 'easy' | 'medium';
export type Language = 'javascript' | 'python';

export interface CodingChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  tags: string[]; // e.g., ['array', 'hash-map', 'two-pointers']
  starterCode: Record<Language, string>;
  testCases: TestCase[];
  hints: string[];
  sampleSolution: Record<Language, string>;
  complexity: ComplexityAnalysis;
  timeLimit: number; // minutes
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  description?: string;
}

export interface ComplexityAnalysis {
  time: string;
  space: string;
  explanation: string;
}

export interface ChallengeAttempt {
  challengeId: string;
  code: string;
  language: Language;
  startedAt: string;
  completedAt?: string;
  passed: boolean;
  testResults: TestResult[];
  timeSpent: number; // seconds
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: string;
  error?: string;
  executionTime?: number;
}

// Challenge templates for generation
const challengeTemplates: Omit<CodingChallenge, 'id'>[] = [
  // Easy challenges
  {
    title: 'Reverse a String',
    description: 'Write a function that reverses a string. The input string is given as an array of characters.',
    difficulty: 'easy',
    category: 'strings',
    tags: ['string', 'two-pointers', 'recursion'],
    starterCode: {
      javascript: `function reverseString(s) {
  // Your code here
  
}`,
      python: `def reverse_string(s):
    # Your code here
    pass`
    },
    testCases: [
      { id: '1', input: '"hello"', expectedOutput: '"olleh"', description: 'Basic string' },
      { id: '2', input: '"world"', expectedOutput: '"dlrow"', description: 'Another basic string' },
      { id: '3', input: '""', expectedOutput: '""', description: 'Empty string' },
      { id: '4', input: '"a"', expectedOutput: '"a"', description: 'Single character' },
    ],
    hints: [
      'Think about using two pointers',
      'You can also use built-in methods like split, reverse, join',
      'Consider the time complexity of your approach'
    ],
    sampleSolution: {
      javascript: `function reverseString(s) {
  return s.split('').reverse().join('');
}`,
      python: `def reverse_string(s):
    return s[::-1]`
    },
    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      explanation: 'We iterate through the string once and create a new string of the same length.'
    },
    timeLimit: 10
  },
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.',
    difficulty: 'easy',
    category: 'arrays',
    tags: ['array', 'hash-map', 'two-pointers'],
    starterCode: {
      javascript: `function twoSum(nums, target) {
  // Your code here
  
}`,
      python: `def two_sum(nums, target):
    # Your code here
    pass`
    },
    testCases: [
      { id: '1', input: '[2,7,11,15], 9', expectedOutput: '[0,1]', description: 'Basic case' },
      { id: '2', input: '[3,2,4], 6', expectedOutput: '[1,2]', description: 'Non-adjacent elements' },
      { id: '3', input: '[3,3], 6', expectedOutput: '[0,1]', description: 'Same numbers' },
    ],
    hints: [
      'A brute force approach would be O(n²)',
      'Can you use a hash map to improve efficiency?',
      'Store the complement of each number as you iterate'
    ],
    sampleSolution: {
      javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      python: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`
    },
    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      explanation: 'We iterate through the array once and use a hash map for O(1) lookups.'
    },
    timeLimit: 15
  },
  {
    title: 'Palindrome Check',
    description: 'Write a function that checks if a given string is a palindrome. Consider only alphanumeric characters and ignore cases.',
    difficulty: 'easy',
    category: 'strings',
    tags: ['string', 'two-pointers', 'regex'],
    starterCode: {
      javascript: `function isPalindrome(s) {
  // Your code here
  
}`,
      python: `def is_palindrome(s):
    # Your code here
    pass`
    },
    testCases: [
      { id: '1', input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', description: 'Classic palindrome' },
      { id: '2', input: '"race a car"', expectedOutput: 'false', description: 'Not a palindrome' },
      { id: '3', input: '""', expectedOutput: 'true', description: 'Empty string' },
      { id: '4', input: '"a"', expectedOutput: 'true', description: 'Single character' },
    ],
    hints: [
      'First, clean the string by removing non-alphanumeric characters',
      'Convert to lowercase for case-insensitive comparison',
      'Compare characters from both ends moving inward'
    ],
    sampleSolution: {
      javascript: `function isPalindrome(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0, right = cleaned.length - 1;
  while (left < right) {
    if (cleaned[left] !== cleaned[right]) return false;
    left++;
    right--;
  }
  return true;
}`,
      python: `def is_palindrome(s):
    cleaned = ''.join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]`
    },
    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      explanation: 'We process each character once. Space is O(n) for the cleaned string.'
    },
    timeLimit: 10
  },
  {
    title: 'FizzBuzz',
    description: 'Write a function that returns an array of strings from 1 to n. For multiples of 3, use "Fizz". For multiples of 5, use "Buzz". For multiples of both, use "FizzBuzz".',
    difficulty: 'easy',
    tags: ['math', 'simulation', 'string'],
    category: 'basics',
    starterCode: {
      javascript: `function fizzBuzz(n) {
  // Your code here
  
}`,
      python: `def fizz_buzz(n):
    # Your code here
    pass`
    },
    testCases: [
      { id: '1', input: '3', expectedOutput: '["1","2","Fizz"]', description: 'Up to 3' },
      { id: '2', input: '5', expectedOutput: '["1","2","Fizz","4","Buzz"]', description: 'Up to 5' },
      { id: '3', input: '15', expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', description: 'Up to 15' },
    ],
    hints: [
      'Check divisibility using the modulo operator %',
      'Check for divisibility by 15 first (or both 3 and 5)',
      'Build the result array as you iterate'
    ],
    sampleSolution: {
      javascript: `function fizzBuzz(n) {
  const result = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) result.push("FizzBuzz");
    else if (i % 3 === 0) result.push("Fizz");
    else if (i % 5 === 0) result.push("Buzz");
    else result.push(String(i));
  }
  return result;
}`,
      python: `def fizz_buzz(n):
    result = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            result.append("FizzBuzz")
        elif i % 3 == 0:
            result.append("Fizz")
        elif i % 5 == 0:
            result.append("Buzz")
        else:
            result.append(str(i))
    return result`
    },
    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      explanation: 'We iterate from 1 to n once and store n elements in the result array.'
    },
    timeLimit: 10
  },

  // Medium challenges
  {
    title: 'Valid Parentheses',
    description: 'Given a string containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid. An input string is valid if brackets are closed in the correct order.',
    difficulty: 'medium',
    tags: ['stack', 'string', 'hash-map'],
    category: 'stacks',
    starterCode: {
      javascript: `function isValid(s) {
  // Your code here
  
}`,
      python: `def is_valid(s):
    # Your code here
    pass`
    },
    testCases: [
      { id: '1', input: '"()"', expectedOutput: 'true', description: 'Simple parentheses' },
      { id: '2', input: '"()[]{}"', expectedOutput: 'true', description: 'Multiple types' },
      { id: '3', input: '"(]"', expectedOutput: 'false', description: 'Mismatched' },
      { id: '4', input: '"([)]"', expectedOutput: 'false', description: 'Wrong order' },
      { id: '5', input: '"{[]}"', expectedOutput: 'true', description: 'Nested' },
    ],
    hints: [
      'Use a stack data structure',
      'Push opening brackets onto the stack',
      'When you see a closing bracket, check if it matches the top of the stack'
    ],
    sampleSolution: {
      javascript: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char in map) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
      python: `def is_valid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            if not stack or stack.pop() != mapping[char]:
                return False
        else:
            stack.append(char)
    return len(stack) == 0`
    },
    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      explanation: 'We iterate through the string once. In the worst case, all characters are opening brackets.'
    },
    timeLimit: 15
  },
  {
    title: 'Maximum Subarray',
    description: 'Given an integer array nums, find the contiguous subarray which has the largest sum and return its sum.',
    difficulty: 'medium',
    tags: ['array', 'dynamic-programming', 'divide-conquer'],
    category: 'arrays',
    starterCode: {
      javascript: `function maxSubArray(nums) {
  // Your code here
  
}`,
      python: `def max_sub_array(nums):
    # Your code here
    pass`
    },
    testCases: [
      { id: '1', input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', description: 'Mixed array' },
      { id: '2', input: '[1]', expectedOutput: '1', description: 'Single element' },
      { id: '3', input: '[5,4,-1,7,8]', expectedOutput: '23', description: 'Mostly positive' },
      { id: '4', input: '[-1]', expectedOutput: '-1', description: 'Single negative' },
    ],
    hints: [
      'This is a classic dynamic programming problem',
      'Think about Kadane\'s algorithm',
      'At each position, decide whether to extend the previous subarray or start fresh'
    ],
    sampleSolution: {
      javascript: `function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}`,
      python: `def max_sub_array(nums):
    max_sum = current_sum = nums[0]
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    return max_sum`
    },
    complexity: {
      time: 'O(n)',
      space: 'O(1)',
      explanation: 'Kadane\'s algorithm processes each element once with constant extra space.'
    },
    timeLimit: 15
  },
  {
    title: 'Merge Two Sorted Arrays',
    description: 'Given two sorted integer arrays nums1 and nums2, merge nums2 into nums1 as one sorted array. Return the merged array.',
    difficulty: 'easy',
    tags: ['array', 'two-pointers', 'sorting'],
    category: 'arrays',
    starterCode: {
      javascript: `function mergeSorted(nums1, nums2) {
  // Your code here
  
}`,
      python: `def merge_sorted(nums1, nums2):
    # Your code here
    pass`
    },
    testCases: [
      { id: '1', input: '[1,2,3], [2,5,6]', expectedOutput: '[1,2,2,3,5,6]', description: 'Basic merge' },
      { id: '2', input: '[1], []', expectedOutput: '[1]', description: 'Empty second array' },
      { id: '3', input: '[], [1]', expectedOutput: '[1]', description: 'Empty first array' },
    ],
    hints: [
      'Use two pointers, one for each array',
      'Compare elements and add the smaller one to the result',
      'Don\'t forget to handle remaining elements'
    ],
    sampleSolution: {
      javascript: `function mergeSorted(nums1, nums2) {
  const result = [];
  let i = 0, j = 0;
  while (i < nums1.length && j < nums2.length) {
    if (nums1[i] <= nums2[j]) {
      result.push(nums1[i++]);
    } else {
      result.push(nums2[j++]);
    }
  }
  while (i < nums1.length) result.push(nums1[i++]);
  while (j < nums2.length) result.push(nums2[j++]);
  return result;
}`,
      python: `def merge_sorted(nums1, nums2):
    result = []
    i = j = 0
    while i < len(nums1) and j < len(nums2):
        if nums1[i] <= nums2[j]:
            result.append(nums1[i])
            i += 1
        else:
            result.append(nums2[j])
            j += 1
    result.extend(nums1[i:])
    result.extend(nums2[j:])
    return result`
    },
    complexity: {
      time: 'O(n + m)',
      space: 'O(n + m)',
      explanation: 'We process each element from both arrays once and create a new merged array.'
    },
    timeLimit: 10
  },
  {
    title: 'Find First Duplicate',
    description: 'Given an array of integers, find the first duplicate number for which the second occurrence has the minimal index.',
    difficulty: 'medium',
    tags: ['array', 'hash-set', 'in-place'],
    category: 'arrays',
    starterCode: {
      javascript: `function firstDuplicate(nums) {
  // Your code here
  // Return -1 if no duplicate found
  
}`,
      python: `def first_duplicate(nums):
    # Your code here
    # Return -1 if no duplicate found
    pass`
    },
    testCases: [
      { id: '1', input: '[2,1,3,5,3,2]', expectedOutput: '3', description: '3 appears twice first' },
      { id: '2', input: '[2,2]', expectedOutput: '2', description: 'Simple duplicate' },
      { id: '3', input: '[1,2,3]', expectedOutput: '-1', description: 'No duplicates' },
      { id: '4', input: '[2,4,3,5,1]', expectedOutput: '-1', description: 'No duplicates' },
    ],
    hints: [
      'Use a Set to track seen numbers',
      'Return the first number you\'ve seen before',
      'Think about the order of checking'
    ],
    sampleSolution: {
      javascript: `function firstDuplicate(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return num;
    seen.add(num);
  }
  return -1;
}`,
      python: `def first_duplicate(nums):
    seen = set()
    for num in nums:
        if num in seen:
            return num
        seen.add(num)
    return -1`
    },
    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      explanation: 'We iterate through the array once and use a Set for O(1) lookups.'
    },
    timeLimit: 10
  },
  {
    title: 'Count Vowels',
    description: 'Write a function that counts the number of vowels (a, e, i, o, u) in a given string. The function should be case-insensitive.',
    difficulty: 'easy',
    tags: ['string', 'hash-set', 'counting'],
    category: 'strings',
    starterCode: {
      javascript: `function countVowels(s) {
  // Your code here
  
}`,
      python: `def count_vowels(s):
    # Your code here
    pass`
    },
    testCases: [
      { id: '1', input: '"hello"', expectedOutput: '2', description: 'Basic word' },
      { id: '2', input: '"AEIOU"', expectedOutput: '5', description: 'All vowels uppercase' },
      { id: '3', input: '"xyz"', expectedOutput: '0', description: 'No vowels' },
      { id: '4', input: '""', expectedOutput: '0', description: 'Empty string' },
    ],
    hints: [
      'Convert to lowercase first',
      'Use a set of vowels for O(1) lookup',
      'Iterate through each character'
    ],
    sampleSolution: {
      javascript: `function countVowels(s) {
  const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
  return [...s.toLowerCase()].filter(c => vowels.has(c)).length;
}`,
      python: `def count_vowels(s):
    vowels = set('aeiou')
    return sum(1 for c in s.lower() if c in vowels)`
    },
    complexity: {
      time: 'O(n)',
      space: 'O(1)',
      explanation: 'We iterate through the string once. The vowel set is constant size.'
    },
    timeLimit: 5
  },

  // New challenges added
  {
    title: 'Remove Duplicates',
    description: 'Given a sorted array, remove the duplicates in-place such that each element appears only once and return the new length. Return the array with unique elements.',
    difficulty: 'easy',
    category: 'arrays',
    tags: ['array', 'two-pointers', 'in-place'],
    starterCode: {
      javascript: `function removeDuplicates(nums) {
  // Your code here
  // Return array with unique elements
  
}`,
      python: `def remove_duplicates(nums):
    # Your code here
    # Return array with unique elements
    pass`
    },
    testCases: [
      { id: '1', input: '[1,1,2]', expectedOutput: '[1,2]', description: 'Simple duplicates' },
      { id: '2', input: '[0,0,1,1,1,2,2,3,3,4]', expectedOutput: '[0,1,2,3,4]', description: 'Multiple duplicates' },
      { id: '3', input: '[1]', expectedOutput: '[1]', description: 'Single element' },
      { id: '4', input: '[]', expectedOutput: '[]', description: 'Empty array' },
    ],
    hints: [
      'Since the array is sorted, duplicates will be adjacent',
      'Use two pointers: one for iterating, one for placing unique elements',
      'You can also use a Set for O(n) solution'
    ],
    sampleSolution: {
      javascript: `function removeDuplicates(nums) {
  return [...new Set(nums)];
}`,
      python: `def remove_duplicates(nums):
    return list(dict.fromkeys(nums))`
    },
    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      explanation: 'Using a Set/dict to track unique elements requires O(n) space.'
    },
    timeLimit: 10
  },
  {
    title: 'Binary Search',
    description: 'Given a sorted array of integers and a target value, return the index if the target is found. If not, return -1.',
    difficulty: 'easy',
    category: 'searching',
    tags: ['array', 'binary-search', 'divide-conquer'],
    starterCode: {
      javascript: `function binarySearch(nums, target) {
  // Your code here
  
}`,
      python: `def binary_search(nums, target):
    # Your code here
    pass`
    },
    testCases: [
      { id: '1', input: '[-1,0,3,5,9,12], 9', expectedOutput: '4', description: 'Target exists' },
      { id: '2', input: '[-1,0,3,5,9,12], 2', expectedOutput: '-1', description: 'Target not found' },
      { id: '3', input: '[5], 5', expectedOutput: '0', description: 'Single element found' },
      { id: '4', input: '[1,2,3,4,5], 1', expectedOutput: '0', description: 'First element' },
    ],
    hints: [
      'Binary search works by repeatedly dividing the search interval in half',
      'Compare the target with the middle element',
      'If target < middle, search left half; if target > middle, search right half'
    ],
    sampleSolution: {
      javascript: `function binarySearch(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
      python: `def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`
    },
    complexity: {
      time: 'O(log n)',
      space: 'O(1)',
      explanation: 'Binary search halves the search space each iteration, giving logarithmic time.'
    },
    timeLimit: 10
  },
  {
    title: 'Rotate Array',
    description: 'Given an array, rotate the array to the right by k steps, where k is non-negative. Return the rotated array.',
    difficulty: 'medium',
    category: 'arrays',
    tags: ['array', 'math', 'two-pointers', 'reverse'],
    starterCode: {
      javascript: `function rotateArray(nums, k) {
  // Your code here
  // Return the rotated array
  
}`,
      python: `def rotate_array(nums, k):
    # Your code here
    # Return the rotated array
    pass`
    },
    testCases: [
      { id: '1', input: '[1,2,3,4,5,6,7], 3', expectedOutput: '[5,6,7,1,2,3,4]', description: 'Rotate by 3' },
      { id: '2', input: '[-1,-100,3,99], 2', expectedOutput: '[3,99,-1,-100]', description: 'Rotate by 2' },
      { id: '3', input: '[1,2], 3', expectedOutput: '[2,1]', description: 'k > length' },
      { id: '4', input: '[1], 0', expectedOutput: '[1]', description: 'No rotation' },
    ],
    hints: [
      'Handle the case where k is greater than array length using modulo',
      'One approach: reverse the entire array, then reverse first k elements, then reverse the rest',
      'Another approach: use slice and concatenation'
    ],
    sampleSolution: {
      javascript: `function rotateArray(nums, k) {
  k = k % nums.length;
  return [...nums.slice(-k), ...nums.slice(0, -k || nums.length)];
}`,
      python: `def rotate_array(nums, k):
    k = k % len(nums) if nums else 0
    return nums[-k:] + nums[:-k] if k else nums[:]`
    },
    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      explanation: 'We create a new array with sliced portions. In-place solution possible with O(1) space.'
    },
    timeLimit: 15
  },
  {
    title: 'Longest Common Prefix',
    description: 'Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.',
    difficulty: 'easy',
    category: 'strings',
    tags: ['string', 'trie', 'binary-search'],
    starterCode: {
      javascript: `function longestCommonPrefix(strs) {
  // Your code here
  
}`,
      python: `def longest_common_prefix(strs):
    # Your code here
    pass`
    },
    testCases: [
      { id: '1', input: '["flower","flow","flight"]', expectedOutput: '"fl"', description: 'Common prefix fl' },
      { id: '2', input: '["dog","racecar","car"]', expectedOutput: '""', description: 'No common prefix' },
      { id: '3', input: '["a"]', expectedOutput: '"a"', description: 'Single string' },
      { id: '4', input: '["","b"]', expectedOutput: '""', description: 'Empty string in array' },
    ],
    hints: [
      'Start with the first string as the prefix',
      'Compare character by character with each subsequent string',
      'Shorten the prefix whenever a mismatch is found'
    ],
    sampleSolution: {
      javascript: `function longestCommonPrefix(strs) {
  if (!strs.length) return "";
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (strs[i].indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return "";
    }
  }
  return prefix;
}`,
      python: `def longest_common_prefix(strs):
    if not strs:
        return ""
    prefix = strs[0]
    for s in strs[1:]:
        while not s.startswith(prefix):
            prefix = prefix[:-1]
            if not prefix:
                return ""
    return prefix`
    },
    complexity: {
      time: 'O(S)',
      space: 'O(1)',
      explanation: 'S is the sum of all characters in all strings. We compare each character at most once.'
    },
    timeLimit: 10
  },
  {
    title: 'Climbing Stairs',
    description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    difficulty: 'easy',
    category: 'dynamic-programming',
    tags: ['dynamic-programming', 'math', 'memoization', 'fibonacci'],
    starterCode: {
      javascript: `function climbStairs(n) {
  // Your code here
  
}`,
      python: `def climb_stairs(n):
    # Your code here
    pass`
    },
    testCases: [
      { id: '1', input: '2', expectedOutput: '2', description: '1+1 or 2' },
      { id: '2', input: '3', expectedOutput: '3', description: '1+1+1, 1+2, 2+1' },
      { id: '3', input: '4', expectedOutput: '5', description: 'Five ways' },
      { id: '4', input: '1', expectedOutput: '1', description: 'Single step' },
    ],
    hints: [
      'This is similar to the Fibonacci sequence',
      'To reach step n, you can come from step n-1 or step n-2',
      'ways(n) = ways(n-1) + ways(n-2)'
    ],
    sampleSolution: {
      javascript: `function climbStairs(n) {
  if (n <= 2) return n;
  let prev = 1, curr = 2;
  for (let i = 3; i <= n; i++) {
    [prev, curr] = [curr, prev + curr];
  }
  return curr;
}`,
      python: `def climb_stairs(n):
    if n <= 2:
        return n
    prev, curr = 1, 2
    for _ in range(3, n + 1):
        prev, curr = curr, prev + curr
    return curr`
    },
    complexity: {
      time: 'O(n)',
      space: 'O(1)',
      explanation: 'We iterate from 3 to n once, using only two variables for state.'
    },
    timeLimit: 10
  },
];

// Storage key
const CODING_PROGRESS_KEY = 'coding-challenge-progress';

// Cache for loaded challenges from JSON
let loadedChallenges: CodingChallenge[] | null = null;
let loadPromise: Promise<CodingChallenge[]> | null = null;

// Load challenges from JSON file (database source)
async function loadChallengesFromJson(): Promise<CodingChallenge[]> {
  if (loadedChallenges) return loadedChallenges;
  if (loadPromise) return loadPromise;
  
  loadPromise = (async (): Promise<CodingChallenge[]> => {
    try {
      const response = await fetch('/data/coding-challenges.json');
      if (!response.ok) throw new Error('Failed to load challenges');
      const data = await response.json();
      
      // Transform database format to app format
      const challenges: CodingChallenge[] = data.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        difficulty: c.difficulty as Difficulty,
        category: c.category,
        tags: c.tags || [],
        starterCode: c.starterCode || { javascript: '', python: '' },
        testCases: (c.testCases || []).map((tc: any) => ({
          id: tc.id || String(Math.random()),
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
          description: tc.description
        })),
        hints: c.hints || [],
        sampleSolution: c.solution || c.sampleSolution || { javascript: '', python: '' },
        complexity: c.complexity || { time: 'O(n)', space: 'O(1)', explanation: '' },
        timeLimit: c.timeLimit || 15
      }));
      
      loadedChallenges = challenges;
      return challenges;
    } catch (error) {
      console.warn('Failed to load challenges from JSON, using fallback templates:', error);
      // Fallback to hardcoded templates if JSON fails
      const fallback: CodingChallenge[] = challengeTemplates.map((template, index) => ({
        ...template,
        id: `challenge-${index}`
      }));
      loadedChallenges = fallback;
      return fallback;
    }
  })();
  
  return loadPromise;
}

// Synchronous getter - returns cached challenges or fallback
function getChallengesSync(): CodingChallenge[] {
  if (loadedChallenges) return loadedChallenges;
  // Return fallback templates while loading
  return challengeTemplates.map((template, index) => ({
    ...template,
    id: `challenge-${index}`
  }));
}

// Initialize challenges loading
loadChallengesFromJson();

// Generate a random challenge
export function getRandomChallenge(difficulty?: Difficulty): CodingChallenge {
  const challenges = getChallengesSync();
  let filtered = challenges;
  if (difficulty) {
    filtered = challenges.filter(c => c.difficulty === difficulty);
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// Get all available challenges
export function getAllChallenges(): CodingChallenge[] {
  return getChallengesSync();
}

// Async version for components that can wait
export async function getAllChallengesAsync(): Promise<CodingChallenge[]> {
  return loadChallengesFromJson();
}

// Get challenge by ID
export function getChallengeById(id: string): CodingChallenge | null {
  const challenges = getChallengesSync();
  return challenges.find(c => c.id === id) || null;
}

// Async version for components that can wait
export async function getChallengeByIdAsync(id: string): Promise<CodingChallenge | null> {
  const challenges = await loadChallengesFromJson();
  return challenges.find(c => c.id === id) || null;
}

// Execute JavaScript code safely in browser
export function executeJavaScript(code: string, testCase: TestCase): TestResult {
  const startTime = performance.now();
  try {
    // Create a sandboxed function
    const fn = new Function(`
      ${code}
      const input = ${testCase.input};
      const args = Array.isArray(input) && typeof input[0] !== 'object' ? input : [input];
      // Find the function name from the code
      const fnMatch = \`${code}\`.match(/function\\s+(\\w+)/);
      if (fnMatch) {
        return ${testCase.input.includes(',') ? `${code.match(/function\s+(\w+)/)?.[1]}(${testCase.input})` : `${code.match(/function\s+(\w+)/)?.[1]}(${testCase.input})`};
      }
      return null;
    `);
    
    const result = fn();
    const executionTime = performance.now() - startTime;
    const actualOutput = JSON.stringify(result);
    const passed = actualOutput === testCase.expectedOutput;
    
    return {
      testCaseId: testCase.id,
      passed,
      actualOutput,
      executionTime
    };
  } catch (error) {
    return {
      testCaseId: testCase.id,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: performance.now() - startTime
    };
  }
}

// Run all test cases
export function runTests(code: string, challenge: CodingChallenge, language: Language): TestResult[] {
  if (language === 'python') {
    // Python execution is handled asynchronously via runTestsAsync
    // This sync version returns placeholder - use runTestsAsync instead
    return challenge.testCases.map(tc => ({
      testCaseId: tc.id,
      passed: false,
      error: 'Use runTestsAsync for Python execution'
    }));
  }
  
  return challenge.testCases.map(tc => {
    try {
      return executeTestCase(code, tc, challenge);
    } catch (error) {
      return {
        testCaseId: tc.id,
        passed: false,
        error: error instanceof Error ? error.message : 'Execution error'
      };
    }
  });
}

// Normalize JSON string for comparison (removes whitespace differences)
function normalizeJsonString(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str));
  } catch {
    return str;
  }
}

// Run all test cases asynchronously (supports Python via Pyodide)
export async function runTestsAsync(
  code: string, 
  challenge: CodingChallenge, 
  language: Language
): Promise<TestResult[]> {
  if (language === 'javascript') {
    return runTests(code, challenge, language);
  }
  
  // Python execution via Pyodide
  const { executePython, extractPythonFunctionName } = await import('./pyodide-runner');
  
  // Extract function name from starter code
  const fnName = extractPythonFunctionName(challenge.starterCode.python);
  if (!fnName) {
    return challenge.testCases.map(tc => ({
      testCaseId: tc.id,
      passed: false,
      error: 'Could not find function definition in code'
    }));
  }
  
  const results: TestResult[] = [];
  
  for (const tc of challenge.testCases) {
    const result = await executePython(code, fnName, tc.input);
    
    if (result.success && result.output) {
      const actualOutput = result.output;
      // Normalize both outputs for comparison (handles whitespace differences)
      const normalizedActual = normalizeJsonString(actualOutput);
      const normalizedExpected = normalizeJsonString(tc.expectedOutput);
      const passed = normalizedActual === normalizedExpected;
      
      results.push({
        testCaseId: tc.id,
        passed,
        actualOutput,
        executionTime: result.executionTime
      });
    } else {
      results.push({
        testCaseId: tc.id,
        passed: false,
        error: result.error || 'Execution failed',
        executionTime: result.executionTime
      });
    }
  }
  
  return results;
}

// Execute a single test case
function executeTestCase(code: string, testCase: TestCase, challenge: CodingChallenge): TestResult {
  const startTime = performance.now();
  
  try {
    // Extract function name from starter code
    const fnNameMatch = challenge.starterCode.javascript.match(/function\s+(\w+)/);
    const fnName = fnNameMatch ? fnNameMatch[1] : 'solution';
    
    // Build the execution code
    const execCode = `
      ${code}
      return ${fnName}(${testCase.input});
    `;
    
    const fn = new Function(execCode);
    const result = fn();
    const executionTime = performance.now() - startTime;
    
    // Normalize output for comparison
    const actualOutput = JSON.stringify(result);
    const expectedNormalized = testCase.expectedOutput;
    const passed = actualOutput === expectedNormalized;
    
    return {
      testCaseId: testCase.id,
      passed,
      actualOutput,
      executionTime
    };
  } catch (error) {
    return {
      testCaseId: testCase.id,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: performance.now() - startTime
    };
  }
}

// Save attempt to localStorage
export function saveChallengeAttempt(attempt: ChallengeAttempt): void {
  try {
    const stored = localStorage.getItem(CODING_PROGRESS_KEY);
    const progress = stored ? JSON.parse(stored) : { attempts: [] };
    progress.attempts.push(attempt);
    localStorage.setItem(CODING_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage errors
  }
}

// Get all attempts
export function getChallengeAttempts(): ChallengeAttempt[] {
  try {
    const stored = localStorage.getItem(CODING_PROGRESS_KEY);
    const progress = stored ? JSON.parse(stored) : { attempts: [] };
    return progress.attempts;
  } catch {
    return [];
  }
}

// Check if a specific challenge has been solved
export function isChallengeSolved(challengeId: string): boolean {
  const attempts = getChallengeAttempts();
  return attempts.some(a => a.challengeId === challengeId && a.passed);
}

// Get all solved challenge IDs
export function getSolvedChallengeIds(): Set<string> {
  const attempts = getChallengeAttempts();
  return new Set(attempts.filter(a => a.passed).map(a => a.challengeId));
}

// Get stats
export function getCodingStats(): {
  totalAttempts: number;
  passedChallenges: number;
  averageTime: number;
  byDifficulty: Record<Difficulty, { attempted: number; passed: number }>;
} {
  const attempts = getChallengeAttempts();
  const passed = attempts.filter(a => a.passed);
  const avgTime = attempts.length > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.timeSpent, 0) / attempts.length)
    : 0;
  
  const byDifficulty: Record<Difficulty, { attempted: number; passed: number }> = {
    easy: { attempted: 0, passed: 0 },
    medium: { attempted: 0, passed: 0 }
  };
  
  // This would need challenge difficulty info stored with attempts
  // For now, return placeholder
  
  return {
    totalAttempts: attempts.length,
    passedChallenges: passed.length,
    averageTime: avgTime,
    byDifficulty
  };
}

// Calculate complexity from code (simplified heuristic)
export function analyzeCodeComplexity(code: string): ComplexityAnalysis {
  const hasNestedLoop = /for[\s\S]*for|while[\s\S]*while|for[\s\S]*while|while[\s\S]*for/.test(code);
  const hasRecursion = /function\s+(\w+)[\s\S]*\1\s*\(/.test(code);
  const hasHashMap = /Map|Set|Object|{}|\[\]/i.test(code);
  const loopCount = (code.match(/for|while/g) || []).length;
  
  let time = 'O(1)';
  let space = 'O(1)';
  let explanation = 'Constant time and space operations.';
  
  if (hasNestedLoop) {
    time = 'O(n²)';
    explanation = 'Nested loops suggest quadratic time complexity.';
  } else if (loopCount > 0) {
    time = 'O(n)';
    explanation = 'Single loop iteration through the input.';
  }
  
  if (hasRecursion) {
    time = hasNestedLoop ? 'O(2^n)' : 'O(n)';
    space = 'O(n)';
    explanation = 'Recursive calls add to the call stack.';
  }
  
  if (hasHashMap) {
    space = 'O(n)';
    if (!hasNestedLoop && !hasRecursion) {
      explanation = 'Uses additional data structure for efficient lookups.';
    }
  }
  
  return { time, space, explanation };
}
