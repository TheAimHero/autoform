import type { AutoFormSchema, DataSourcesConfig } from '@autoform/core';

/**
 * Developer Profile schema - showcases multiple async data sources from real public APIs
 * 
 * APIs used:
 * - GitHub API (https://api.github.com) - user search, repository search
 * - NPM Registry (https://registry.npmjs.org) - package search
 * - REST Countries (https://restcountries.com) - country data
 * - PokeAPI (https://pokeapi.co) - just for fun!
 */
export const developerProfileSchema: AutoFormSchema = {
  fields: [
    // ============================================
    // SECTION 1: Basic Information
    // ============================================
    {
      name: 'basicInfo',
      type: 'object',
      label: 'Basic Information',
      fields: [
        {
          name: 'displayName',
          type: 'text',
          label: 'Display Name',
          placeholder: 'John Doe',
          validation: {
            required: 'Display name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
          },
        },
        {
          name: 'title',
          type: 'text',
          label: 'Professional Title',
          placeholder: 'Senior Full Stack Developer',
          validation: { required: 'Title is required' },
        },
        {
          name: 'country',
          type: 'select',
          label: 'Country',
          placeholder: 'Select your country...',
          dataSourceKey: 'countries',
          validation: { required: 'Country is required' },
          description: 'Loaded from REST Countries API',
        },
        {
          name: 'yearsOfExperience',
          type: 'number',
          label: 'Years of Experience',
          placeholder: '5',
          validation: {
            required: 'Years of experience is required',
            min: { value: 0, message: 'Must be at least 0' },
            max: { value: 50, message: 'Must be at most 50' },
          },
        },
        {
          name: 'bio',
          type: 'textarea',
          label: 'Bio',
          placeholder: 'Tell us about yourself...',
          fieldProps: { rows: 3 },
          validation: {
            required: 'Bio is required',
            minLength: { value: 50, message: 'Bio must be at least 50 characters' },
          },
        },
      ],
    },

    // ============================================
    // SECTION 2: GitHub Integration
    // Uses GitHub API for real-time search
    // ============================================
    {
      name: 'github',
      type: 'object',
      label: 'GitHub Integration',
      fields: [
        {
          name: 'username',
          type: 'autocomplete',
          label: 'GitHub Username',
          placeholder: 'Search for a GitHub user...',
          dataSourceKey: 'githubUsers',
          validation: { required: 'GitHub username is required' },
          description: '🔍 Type to search GitHub users (uses GitHub API)',
        },
        {
          name: 'favoriteRepo',
          type: 'autocomplete',
          label: 'Featured Repository',
          placeholder: 'Search GitHub repositories...',
          dataSourceKey: 'githubRepos',
          description: '🔍 Search any public GitHub repository',
        },
        {
          name: 'contributionLevel',
          type: 'select',
          label: 'Open Source Contribution Level',
          options: [
            { label: '🌱 Beginner - Just getting started', value: 'beginner' },
            { label: '🌿 Intermediate - Regular contributor', value: 'intermediate' },
            { label: '🌳 Advanced - Core maintainer', value: 'advanced' },
            { label: '🏆 Expert - Leading multiple projects', value: 'expert' },
          ],
        },
      ],
    },

    // ============================================
    // SECTION 3: NPM Packages
    // Uses NPM Registry API for package search
    // ============================================
    {
      name: 'npmPackages',
      type: 'object',
      label: 'Favorite NPM Packages',
      fields: [
        {
          name: 'favoritePackage',
          type: 'autocomplete',
          label: 'All-time Favorite Package',
          placeholder: 'Search NPM packages...',
          dataSourceKey: 'npmPackages',
          validation: { required: 'Please select your favorite package' },
          description: '🔍 Search the NPM registry (500k+ packages)',
        },
        {
          name: 'currentlyUsing',
          type: 'autocomplete',
          label: 'Currently Using',
          placeholder: 'Search NPM packages...',
          dataSourceKey: 'npmPackages',
          description: 'What package are you most excited about right now?',
        },
        {
          name: 'wouldRecommend',
          type: 'autocomplete',
          label: 'Would Recommend',
          placeholder: 'Search NPM packages...',
          dataSourceKey: 'npmPackages',
          description: 'What package would you recommend to others?',
        },
      ],
    },

    // ============================================
    // SECTION 4: Tech Stack (Array of selections)
    // ============================================
    {
      name: 'techStack',
      type: 'object',
      label: 'Tech Stack',
      fields: [
        {
          name: 'primaryLanguage',
          type: 'select',
          label: 'Primary Programming Language',
          placeholder: 'Select your primary language',
          dataSourceKey: 'programmingLanguages',
          validation: { required: 'Primary language is required' },
          description: '🔍 Loaded from GitHub Linguist',
        },
        {
          name: 'frameworks',
          type: 'array',
          label: 'Frameworks & Libraries',
          description: 'Add frameworks you work with',
          itemType: 'text',
          minItems: 1,
          maxItems: 8,
          itemDefinition: {
            type: 'text',
            placeholder: 'e.g., React, Vue, Django',
          },
        },
        {
          name: 'databases',
          type: 'select',
          label: 'Preferred Database',
          options: [
            { label: '🐘 PostgreSQL', value: 'postgresql' },
            { label: '🍃 MongoDB', value: 'mongodb' },
            { label: '🐬 MySQL', value: 'mysql' },
            { label: '🔴 Redis', value: 'redis' },
            { label: '📊 SQLite', value: 'sqlite' },
            { label: '🔥 Firebase', value: 'firebase' },
            { label: '⚡ Supabase', value: 'supabase' },
          ],
        },
        {
          name: 'cloud',
          type: 'select',
          label: 'Cloud Platform',
          options: [
            { label: '☁️ AWS', value: 'aws' },
            { label: '🔵 Azure', value: 'azure' },
            { label: '🌈 Google Cloud', value: 'gcp' },
            { label: '▲ Vercel', value: 'vercel' },
            { label: '🟣 Heroku', value: 'heroku' },
            { label: '🔶 Cloudflare', value: 'cloudflare' },
          ],
        },
      ],
    },

    // ============================================
    // SECTION 5: Fun Section - PokeAPI!
    // Just to show variety of API integrations
    // ============================================
    {
      name: 'funSection',
      type: 'object',
      label: '🎮 Fun Section',
      fields: [
        {
          name: 'favoritePokemon',
          type: 'autocomplete',
          label: 'Favorite Pokémon',
          placeholder: 'Search for a Pokémon...',
          dataSourceKey: 'pokemon',
          description: '🔍 Because every developer needs a coding buddy! (PokeAPI)',
        },
        {
          name: 'spiritAnimal',
          type: 'select',
          label: 'Developer Spirit Animal',
          options: [
            { label: '🦊 Firefox - Quick and clever', value: 'firefox' },
            { label: '🐙 Octocat - GitHub native', value: 'octocat' },
            { label: '🐍 Python - Elegant and readable', value: 'python' },
            { label: '🦀 Ferris - Rust enthusiast', value: 'ferris' },
            { label: '🐹 Gopher - Go developer', value: 'gopher' },
            { label: '☕ Duke - Java veteran', value: 'duke' },
            { label: '🐘 Elephant - PHP survivor', value: 'elephant' },
          ],
        },
        {
          name: 'codingPlaylist',
          type: 'select',
          label: 'Coding Playlist Vibe',
          options: [
            { label: '🎵 Lo-fi beats', value: 'lofi' },
            { label: '🎸 Classic rock', value: 'rock' },
            { label: '🎹 Electronic/EDM', value: 'edm' },
            { label: '🎻 Classical', value: 'classical' },
            { label: '🔇 Complete silence', value: 'silence' },
            { label: '☕ Coffee shop ambiance', value: 'ambient' },
          ],
        },
      ],
    },

    // ============================================
    // SECTION 6: Availability & Contact
    // ============================================
    {
      name: 'availability',
      type: 'object',
      label: 'Availability & Contact',
      fields: [
        {
          name: 'openToWork',
          type: 'checkbox',
          label: 'Open to work opportunities',
        },
        {
          name: 'preferredRole',
          type: 'select',
          label: 'Preferred Role',
          placeholder: 'Select preferred role',
          options: [
            { label: '💻 Individual Contributor', value: 'ic' },
            { label: '👥 Tech Lead', value: 'lead' },
            { label: '🏗️ Architect', value: 'architect' },
            { label: '📊 Engineering Manager', value: 'manager' },
            { label: '🎯 Consultant', value: 'consultant' },
          ],
          condition: {
            when: 'availability.openToWork',
            operator: 'eq',
            value: true,
          },
        },
        {
          name: 'remotePreference',
          type: 'select',
          label: 'Remote Preference',
          options: [
            { label: '🏠 Fully Remote', value: 'remote' },
            { label: '🏢 On-site', value: 'onsite' },
            { label: '🔄 Hybrid', value: 'hybrid' },
            { label: '🌍 Anywhere', value: 'anywhere' },
          ],
          condition: {
            when: 'availability.openToWork',
            operator: 'eq',
            value: true,
          },
        },
        {
          name: 'freelance',
          type: 'checkbox',
          label: 'Available for freelance projects',
        },
        {
          name: 'mentoring',
          type: 'checkbox',
          label: 'Interested in mentoring',
        },
      ],
    },

    // ============================================
    // SECTION 7: Profile Visibility
    // ============================================
    {
      name: 'settings',
      type: 'object',
      label: 'Profile Settings',
      fields: [
        {
          name: 'visibility',
          type: 'select',
          label: 'Profile Visibility',
          options: [
            { label: '🌍 Public - Anyone can view', value: 'public' },
            { label: '🔗 Link Only - Only people with link', value: 'link' },
            { label: '🔒 Private - Only you', value: 'private' },
          ],
          defaultValue: 'public',
        },
        {
          name: 'showEmail',
          type: 'checkbox',
          label: 'Show email on profile',
          defaultValue: false,
        },
        {
          name: 'allowMessages',
          type: 'checkbox',
          label: 'Allow direct messages',
          defaultValue: true,
        },
        {
          name: 'newsletter',
          type: 'checkbox',
          label: 'Subscribe to developer newsletter',
          defaultValue: true,
        },
      ],
    },
  ],
};

// ============================================
// API Response Types
// ============================================

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface NPMPackage {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  date: string;
  links: {
    npm: string;
    homepage?: string;
    repository?: string;
  };
  publisher: {
    username: string;
  };
}

interface NPMSearchResult {
  objects: Array<{
    package: NPMPackage;
    score: {
      final: number;
    };
  }>;
  total: number;
}

interface RestCountry {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
  flag: string;
}

interface Pokemon {
  name: string;
  url: string;
}

interface PokemonListResponse {
  count: number;
  results: Pokemon[];
}

/**
 * Data sources configuration using multiple real public APIs
 */
export const developerProfileDataSources: DataSourcesConfig = {
  // ============================================
  // GitHub Users Search
  // ============================================
  githubUsers: {
    fetch: async ({ searchQuery, signal }) => {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }

      console.log('🐙 Searching GitHub users:', searchQuery);

      const response = await fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(searchQuery)}&per_page=10`,
        {
          signal,
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        }
        throw new Error('Failed to search GitHub users');
      }

      const data = await response.json();
      console.log(`✅ Found ${data.items?.length || 0} GitHub users`);
      return data.items || [];
    },
    transform: (data) =>
      (data as GitHubUser[]).map((user) => ({
        label: `@${user.login}`,
        value: user.login,
      })),
    debounceMs: 400,
    staleTime: 60000,
  },

  // ============================================
  // GitHub Repositories Search
  // ============================================
  githubRepos: {
    fetch: async ({ searchQuery, signal }) => {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }

      console.log('📦 Searching GitHub repositories:', searchQuery);

      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&per_page=10`,
        {
          signal,
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded');
        }
        throw new Error('Failed to search repositories');
      }

      const data = await response.json();
      console.log(`✅ Found ${data.items?.length || 0} repositories`);
      return data.items || [];
    },
    transform: (data) =>
      (data as GitHubRepo[]).map((repo) => ({
        label: `${repo.full_name} ⭐ ${repo.stargazers_count.toLocaleString()}`,
        value: repo.full_name,
      })),
    debounceMs: 400,
    staleTime: 60000,
  },

  // ============================================
  // NPM Package Search
  // ============================================
  npmPackages: {
    fetch: async ({ searchQuery, signal }) => {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }

      console.log('📦 Searching NPM packages:', searchQuery);

      const response = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(searchQuery)}&size=15`,
        { signal }
      );

      if (!response.ok) {
        throw new Error('Failed to search NPM packages');
      }

      const data: NPMSearchResult = await response.json();
      console.log(`✅ Found ${data.objects?.length || 0} NPM packages`);
      return data.objects || [];
    },
    transform: (data) =>
      (data as NPMSearchResult['objects']).map((item) => ({
        label: `${item.package.name} (v${item.package.version})`,
        value: item.package.name,
      })),
    debounceMs: 300,
    staleTime: 120000, // 2 minutes
  },

  // ============================================
  // REST Countries API
  // ============================================
  countries: {
    fetch: async ({ signal }) => {
      console.log('🌍 Fetching countries from REST Countries API...');

      const response = await fetch(
        'https://restcountries.com/v3.1/all?fields=name,cca2,flag',
        { signal }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }

      const data: RestCountry[] = await response.json();
      console.log(`✅ Fetched ${data.length} countries`);

      return data.sort((a, b) => a.name.common.localeCompare(b.name.common));
    },
    transform: (data) =>
      (data as RestCountry[]).map((country) => ({
        label: `${country.flag} ${country.name.common}`,
        value: country.cca2,
      })),
    staleTime: 600000, // 10 minutes
  },

  // ============================================
  // Programming Languages (static list for reliability)
  // ============================================
  programmingLanguages: {
    fetch: async () => {
      console.log('💻 Loading programming languages...');
      // Using static list for reliability - in production, could fetch from GitHub Linguist
      const languages = getStaticLanguages();
      console.log(`✅ Loaded ${languages.length} programming languages`);
      return languages;
    },
    transform: (data) =>
      (data as string[]).map((lang) => ({
        label: lang,
        value: lang.toLowerCase(),
      })),
    staleTime: 3600000, // 1 hour
  },

  // ============================================
  // PokeAPI - Pokemon Search
  // ============================================
  pokemon: {
    fetch: async ({ searchQuery, signal }) => {
      console.log('🎮 Fetching Pokémon...');

      // Fetch all pokemon names (cached heavily)
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151', {
        signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Pokémon');
      }

      const data: PokemonListResponse = await response.json();

      // Filter by search query if provided
      let results = data.results;
      if (searchQuery && searchQuery.length > 0) {
        const query = searchQuery.toLowerCase();
        results = results.filter((p) => p.name.includes(query));
      }

      console.log(`✅ Found ${results.length} Pokémon`);
      return results.slice(0, 20);
    },
    transform: (data) =>
      (data as Pokemon[]).map((pokemon) => {
        // Capitalize first letter
        const name = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
        // Extract ID from URL for emoji
        const id = pokemon.url.split('/').filter(Boolean).pop();
        return {
          label: `#${id?.padStart(3, '0')} ${name}`,
          value: pokemon.name,
        };
      }),
    debounceMs: 200,
    staleTime: 3600000, // 1 hour - Pokemon don't change!
  },
};

// Fallback static language list
function getStaticLanguages(): string[] {
  return [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C#',
    'C++',
    'Go',
    'Rust',
    'Ruby',
    'PHP',
    'Swift',
    'Kotlin',
    'Scala',
    'Elixir',
    'Haskell',
    'Clojure',
    'Dart',
    'R',
    'Julia',
    'Lua',
  ];
}

