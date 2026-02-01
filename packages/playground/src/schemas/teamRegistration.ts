import type { AutoFormSchema, DataSourcesConfig } from '@autoform/core';

/**
 * Team Registration schema - demonstrates nested objects, arrays, and async data sources
 * Uses public APIs:
 * - REST Countries API (https://restcountries.com) for country data
 * - Universities API (http://universities.hipolabs.com) for university autocomplete
 */
export const teamRegistrationSchema: AutoFormSchema = {
  fields: [
    // ============================================
    // NESTED OBJECT: Team Information
    // ============================================
    {
      name: 'teamInfo',
      type: 'object',
      label: 'Team Information',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Team Name',
          placeholder: 'The Innovators',
          validation: {
            required: 'Team name is required',
            minLength: { value: 3, message: 'Team name must be at least 3 characters' },
            maxLength: { value: 50, message: 'Team name must be at most 50 characters' },
          },
        },
        {
          name: 'category',
          type: 'select',
          label: 'Competition Category',
          placeholder: 'Select a category',
          options: [
            { label: '🎯 Open Innovation', value: 'open' },
            { label: '🌱 Sustainability', value: 'sustainability' },
            { label: '🤖 AI/ML', value: 'ai-ml' },
            { label: '🔐 Cybersecurity', value: 'security' },
            { label: '💼 Sponsored Track', value: 'sponsored' },
          ],
          validation: { required: 'Please select a category' },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Team Description',
          placeholder: 'Tell us about your team and what motivates you...',
          fieldProps: { rows: 3 },
          validation: {
            required: 'Team description is required',
            minLength: { value: 50, message: 'Please provide at least 50 characters' },
          },
        },
      ],
    },

    // ============================================
    // CONDITIONAL NESTED OBJECT: Sponsor Information
    // Only shown when category is 'sponsored'
    // ============================================
    {
      name: 'sponsorInfo',
      type: 'object',
      label: 'Sponsor Information',
      condition: {
        when: 'teamInfo.category',
        operator: 'eq',
        value: 'sponsored',
      },
      fields: [
        {
          name: 'companyName',
          type: 'text',
          label: 'Sponsoring Company',
          placeholder: 'Acme Corp',
          validation: { required: 'Company name is required' },
        },
        {
          name: 'sponsorContact',
          type: 'object',
          label: 'Sponsor Contact Person',
          fields: [
            {
              name: 'name',
              type: 'text',
              label: 'Contact Name',
              placeholder: 'Jane Smith',
              validation: { required: 'Contact name is required' },
            },
            {
              name: 'email',
              type: 'email',
              label: 'Contact Email',
              placeholder: 'jane@acme.corp',
              validation: {
                required: 'Contact email is required',
                email: 'Please enter a valid email',
              },
            },
          ],
        },
        {
          name: 'sponsorshipTier',
          type: 'select',
          label: 'Sponsorship Tier',
          options: [
            { label: '🥉 Bronze', value: 'bronze' },
            { label: '🥈 Silver', value: 'silver' },
            { label: '🥇 Gold', value: 'gold' },
            { label: '💎 Platinum', value: 'platinum' },
          ],
          validation: { required: 'Please select a tier' },
        },
      ],
    },

    // ============================================
    // DEEPLY NESTED OBJECT: Team Lead
    // Includes async data source for country
    // ============================================
    {
      name: 'teamLead',
      type: 'object',
      label: 'Team Lead',
      fields: [
        {
          name: 'personalInfo',
          type: 'object',
          label: 'Personal Information',
          fields: [
            {
              name: 'firstName',
              type: 'text',
              label: 'First Name',
              placeholder: 'John',
              validation: { required: 'First name is required' },
            },
            {
              name: 'lastName',
              type: 'text',
              label: 'Last Name',
              placeholder: 'Doe',
              validation: { required: 'Last name is required' },
            },
            {
              name: 'email',
              type: 'email',
              label: 'Email',
              placeholder: 'john.doe@example.com',
              validation: {
                required: 'Email is required',
                email: 'Please enter a valid email',
              },
            },
            {
              name: 'phone',
              type: 'text',
              label: 'Phone',
              placeholder: '+1 555 123 4567',
            },
          ],
        },
        {
          name: 'location',
          type: 'object',
          label: 'Location',
          fields: [
            {
              name: 'country',
              type: 'select',
              label: 'Country',
              placeholder: 'Select your country',
              dataSourceKey: 'restCountries',
              validation: { required: 'Country is required' },
            },
            {
              name: 'city',
              type: 'text',
              label: 'City',
              placeholder: 'San Francisco',
            },
            {
              name: 'timezone',
              type: 'select',
              label: 'Timezone',
              placeholder: 'Select timezone',
              dataSourceKey: 'countryTimezones',
              dependsOn: ['teamLead.location.country'],
              description: 'Based on your selected country',
            },
          ],
        },
        {
          name: 'affiliation',
          type: 'object',
          label: 'Affiliation',
          fields: [
            {
              name: 'type',
              type: 'select',
              label: 'Affiliation Type',
              options: [
                { label: '🎓 University/College', value: 'university' },
                { label: '🏢 Company', value: 'company' },
                { label: '👤 Independent', value: 'independent' },
              ],
              validation: { required: 'Please select your affiliation type' },
            },
            {
              name: 'university',
              type: 'autocomplete',
              label: 'University',
              placeholder: 'Search for your university...',
              dataSourceKey: 'hipolabsUniversities',
              dependsOn: ['teamLead.location.country'],
              condition: {
                when: 'teamLead.affiliation.type',
                operator: 'eq',
                value: 'university',
              },
              description: 'Start typing to search universities in your country',
            },
            {
              name: 'company',
              type: 'text',
              label: 'Company Name',
              placeholder: 'Tech Corp Inc.',
              condition: {
                when: 'teamLead.affiliation.type',
                operator: 'eq',
                value: 'company',
              },
              validation: { required: 'Company name is required' },
            },
          ],
        },
      ],
    },

    // ============================================
    // ARRAY OF COMPLEX OBJECTS: Team Members
    // ============================================
    {
      name: 'teamMembers',
      type: 'array',
      label: 'Team Members',
      description: 'Add your team members (minimum 1, maximum 4 additional members)',
      itemType: 'object',
      minItems: 1,
      maxItems: 4,
      itemFields: [
        {
          name: 'name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Jane Smith',
          validation: { required: 'Name is required' },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'jane@example.com',
          validation: {
            required: 'Email is required',
            email: 'Please enter a valid email',
          },
        },
        {
          name: 'role',
          type: 'select',
          label: 'Role',
          placeholder: 'Select role',
          options: [
            { label: '💻 Developer', value: 'developer' },
            { label: '🎨 Designer', value: 'designer' },
            { label: '📊 Data Scientist', value: 'data-scientist' },
            { label: '📝 Product Manager', value: 'pm' },
            { label: '🔧 DevOps', value: 'devops' },
            { label: '🎯 Other', value: 'other' },
          ],
          validation: { required: 'Role is required' },
        },
        {
          name: 'country',
          type: 'select',
          label: 'Country',
          placeholder: 'Select country',
          dataSourceKey: 'restCountries',
        },
        {
          name: 'dietary',
          type: 'select',
          label: 'Dietary Requirements',
          placeholder: 'Select dietary preference',
          options: [
            { label: 'None', value: 'none' },
            { label: '🥬 Vegetarian', value: 'vegetarian' },
            { label: '🌱 Vegan', value: 'vegan' },
            { label: '✡️ Kosher', value: 'kosher' },
            { label: '☪️ Halal', value: 'halal' },
            { label: '🚫🥜 Nut-Free', value: 'nut-free' },
            { label: '🚫🌾 Gluten-Free', value: 'gluten-free' },
          ],
        },
        {
          name: 'tshirtSize',
          type: 'select',
          label: 'T-Shirt Size',
          placeholder: 'Select size',
          options: [
            { label: 'XS', value: 'xs' },
            { label: 'S', value: 's' },
            { label: 'M', value: 'm' },
            { label: 'L', value: 'l' },
            { label: 'XL', value: 'xl' },
            { label: 'XXL', value: 'xxl' },
          ],
        },
      ],
    },

    // ============================================
    // NESTED OBJECT: Project Idea
    // ============================================
    {
      name: 'projectIdea',
      type: 'object',
      label: 'Project Idea',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Project Title',
          placeholder: 'EcoTrack - Carbon Footprint Tracker',
          validation: {
            required: 'Project title is required',
            minLength: { value: 5, message: 'Title must be at least 5 characters' },
          },
        },
        {
          name: 'summary',
          type: 'textarea',
          label: 'Project Summary',
          placeholder: 'Describe your project idea, the problem it solves, and your approach...',
          fieldProps: { rows: 4 },
          validation: {
            required: 'Project summary is required',
            minLength: { value: 100, message: 'Please provide at least 100 characters' },
          },
        },
        {
          name: 'targetAudience',
          type: 'text',
          label: 'Target Audience',
          placeholder: 'e.g., Small business owners, Students, Healthcare workers',
          validation: { required: 'Target audience is required' },
        },
      ],
    },

    // ============================================
    // ARRAY OF PRIMITIVES: Tech Stack
    // ============================================
    {
      name: 'techStack',
      type: 'array',
      label: 'Tech Stack',
      description: 'List the technologies you plan to use',
      itemType: 'text',
      minItems: 1,
      maxItems: 10,
      itemDefinition: {
        type: 'text',
        placeholder: 'e.g., React, Node.js, PostgreSQL',
      },
    },

    // ============================================
    // NESTED OBJECT: Additional Info
    // ============================================
    {
      name: 'additionalInfo',
      type: 'object',
      label: 'Additional Information',
      fields: [
        {
          name: 'howDidYouHear',
          type: 'select',
          label: 'How did you hear about us?',
          placeholder: 'Select an option',
          options: [
            { label: '🐦 Twitter/X', value: 'twitter' },
            { label: '💼 LinkedIn', value: 'linkedin' },
            { label: '👥 Friend/Colleague', value: 'referral' },
            { label: '🎓 University', value: 'university' },
            { label: '🔍 Search Engine', value: 'search' },
            { label: '📰 News/Blog', value: 'news' },
            { label: '🎯 Other', value: 'other' },
          ],
        },
        {
          name: 'previousParticipation',
          type: 'checkbox',
          label: 'I have participated in hackathons before',
        },
        {
          name: 'needsAccommodation',
          type: 'checkbox',
          label: 'I require accessibility accommodations',
        },
        {
          name: 'accommodationDetails',
          type: 'textarea',
          label: 'Accommodation Details',
          placeholder: 'Please describe your accommodation needs...',
          fieldProps: { rows: 2 },
          condition: {
            when: 'additionalInfo.needsAccommodation',
            operator: 'eq',
            value: true,
          },
        },
        {
          name: 'agreeToTerms',
          type: 'checkbox',
          label: 'I agree to the terms and conditions and code of conduct',
          validation: { required: 'You must agree to the terms to continue' },
        },
        {
          name: 'subscribeNewsletter',
          type: 'checkbox',
          label: 'Subscribe to our newsletter for updates and future events',
          defaultValue: true,
        },
      ],
    },
  ],
};

// ============================================
// API Response Types
// ============================================

interface RestCountry {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
  cca3: string;
  timezones: string[];
  flag: string;
}

interface University {
  name: string;
  country: string;
  domains: string[];
  web_pages: string[];
  alpha_two_code: string;
}

// Country code to timezone cache
const countryTimezonesCache: Record<string, string[]> = {};

/**
 * Data sources configuration using real public APIs
 */
export const teamRegistrationDataSources: DataSourcesConfig = {
  /**
   * Countries data source - uses REST Countries API
   * https://restcountries.com
   */
  restCountries: {
    fetch: async ({ signal }) => {
      console.log('🌍 Fetching countries from REST Countries API...');

      const response = await fetch(
        'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,timezones,flag',
        { signal }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }

      const data: RestCountry[] = await response.json();
      console.log(`✅ Fetched ${data.length} countries from API`);

      // Cache timezones for dependent field
      data.forEach((country) => {
        countryTimezonesCache[country.cca2] = country.timezones;
      });

      // Sort by name
      return data.sort((a, b) => a.name.common.localeCompare(b.name.common));
    },
    transform: (data) =>
      (data as RestCountry[]).map((country) => ({
        label: `${country.flag} ${country.name.common}`,
        value: country.cca2,
      })),
    staleTime: 300000, // 5 minutes - countries don't change often
  },

  /**
   * Timezones data source - dependent on country selection
   * Uses cached data from countries fetch
   */
  countryTimezones: {
    fetch: async ({ dependencies }) => {
      const countryCode = dependencies?.['teamLead.location.country'] as string;
      console.log('🕐 Fetching timezones for country:', countryCode);

      if (!countryCode) {
        return [];
      }

      // Use cached timezone data or fetch if not available
      let timezones = countryTimezonesCache[countryCode];

      if (!timezones) {
        // Fallback: fetch country data if not cached
        console.log('🔄 Timezone not cached, fetching from API...');
        const response = await fetch(
          `https://restcountries.com/v3.1/alpha/${countryCode}?fields=timezones`
        );

        if (response.ok) {
          const data = await response.json();
          timezones = data.timezones || [];
          countryTimezonesCache[countryCode] = timezones;
        } else {
          timezones = [];
        }
      }

      console.log(`✅ Found ${timezones.length} timezones`);
      return timezones;
    },
    transform: (data) =>
      (data as string[]).map((tz) => ({
        label: tz.replace(/_/g, ' '),
        value: tz,
      })),
    staleTime: 300000, // 5 minutes
  },

  /**
   * Universities data source - uses Hipolabs Universities API
   * http://universities.hipolabs.com
   * Supports search and country filtering
   */
  hipolabsUniversities: {
    fetch: async ({ dependencies, searchQuery, signal }) => {
      const countryCode = dependencies?.['teamLead.location.country'] as string;

      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }

      console.log('🎓 Searching universities:', searchQuery, 'in country:', countryCode);

      // Build URL with parameters
      const params = new URLSearchParams({
        name: searchQuery,
      });

      // Map country code to country name for the API
      // The universities API uses full country names
      if (countryCode) {
        // First get country name from REST Countries
        try {
          const countryResponse = await fetch(
            `https://restcountries.com/v3.1/alpha/${countryCode}?fields=name`,
            { signal }
          );
          if (countryResponse.ok) {
            const countryData = await countryResponse.json();
            params.set('country', countryData.name.common);
          }
        } catch {
          // Ignore country lookup errors, search without country filter
        }
      }

      const response = await fetch(`http://universities.hipolabs.com/search?${params.toString()}`, {
        signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch universities');
      }

      const data: University[] = await response.json();
      console.log(`✅ Found ${data.length} universities`);

      // Limit results to avoid overwhelming the UI
      return data.slice(0, 20);
    },
    transform: (data) =>
      (data as University[]).map((uni) => ({
        label: uni.name,
        value: uni.name,
      })),
    debounceMs: 400, // Debounce to avoid too many API calls
    staleTime: 60000, // 1 minute
  },
};
