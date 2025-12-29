import type { AutoFormSchema, DataSourcesConfig } from '@autoform/core';

/**
 * Contact form schema example
 */
export const contactFormSchema: AutoFormSchema = {
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Full Name',
      placeholder: 'John Doe',
      validation: {
        required: 'Name is required',
        minLength: { value: 2, message: 'Name must be at least 2 characters' },
      },
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      placeholder: 'john@example.com',
      validation: {
        required: 'Email is required',
        email: 'Please enter a valid email',
      },
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Phone Number',
      placeholder: '+1 (555) 000-0000',
      description: 'Optional - for urgent inquiries',
    },
    {
      name: 'country',
      type: 'select',
      label: 'Country',
      placeholder: 'Select a country',
      dataSourceKey: 'countries',
      validation: {
        required: 'Please select a country',
      },
    },
    {
      name: 'city',
      type: 'autocomplete',
      label: 'City',
      placeholder: 'Search for a city...',
      dataSourceKey: 'cities',
      dependsOn: ['country'],
      description: 'Start typing to search',
    },
    {
      name: 'subject',
      type: 'select',
      label: 'Subject',
      placeholder: 'Select a subject',
      options: [
        { label: 'General Inquiry', value: 'general' },
        { label: 'Technical Support', value: 'support' },
        { label: 'Sales', value: 'sales' },
        { label: 'Partnership', value: 'partnership' },
        { label: 'Other', value: 'other' },
      ],
      validation: {
        required: 'Please select a subject',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      placeholder: 'How can we help you?',
      fieldProps: { rows: 5 },
      validation: {
        required: 'Message is required',
        minLength: { value: 20, message: 'Please provide more details (at least 20 characters)' },
      },
    },
    {
      name: 'newsletter',
      type: 'checkbox',
      label: 'Subscribe to our newsletter',
      description: 'Get updates about new features and releases',
      defaultValue: false,
    },
    {
      name: 'priority',
      type: 'select',
      label: 'Priority',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
      condition: {
        when: 'subject',
        operator: 'eq',
        value: 'support',
      },
      defaultValue: 'medium',
    },
  ],
};

// Mock data for countries and cities
const mockCountries = [
  { id: 'us', name: 'United States' },
  { id: 'uk', name: 'United Kingdom' },
  { id: 'ca', name: 'Canada' },
  { id: 'de', name: 'Germany' },
  { id: 'fr', name: 'France' },
  { id: 'jp', name: 'Japan' },
  { id: 'au', name: 'Australia' },
  { id: 'in', name: 'India' },
];

const mockCities: Record<string, Array<{ id: string; name: string }>> = {
  us: [
    { id: 'nyc', name: 'New York' },
    { id: 'la', name: 'Los Angeles' },
    { id: 'chi', name: 'Chicago' },
    { id: 'hou', name: 'Houston' },
    { id: 'phx', name: 'Phoenix' },
  ],
  uk: [
    { id: 'lon', name: 'London' },
    { id: 'man', name: 'Manchester' },
    { id: 'bir', name: 'Birmingham' },
    { id: 'lee', name: 'Leeds' },
  ],
  ca: [
    { id: 'tor', name: 'Toronto' },
    { id: 'van', name: 'Vancouver' },
    { id: 'mon', name: 'Montreal' },
    { id: 'cal', name: 'Calgary' },
  ],
  de: [
    { id: 'ber', name: 'Berlin' },
    { id: 'mun', name: 'Munich' },
    { id: 'ham', name: 'Hamburg' },
    { id: 'fra', name: 'Frankfurt' },
  ],
  fr: [
    { id: 'par', name: 'Paris' },
    { id: 'mar', name: 'Marseille' },
    { id: 'lyo', name: 'Lyon' },
    { id: 'tou', name: 'Toulouse' },
  ],
  jp: [
    { id: 'tok', name: 'Tokyo' },
    { id: 'osa', name: 'Osaka' },
    { id: 'kyo', name: 'Kyoto' },
    { id: 'yok', name: 'Yokohama' },
  ],
  au: [
    { id: 'syd', name: 'Sydney' },
    { id: 'mel', name: 'Melbourne' },
    { id: 'bri', name: 'Brisbane' },
    { id: 'per', name: 'Perth' },
  ],
  in: [
    { id: 'mum', name: 'Mumbai' },
    { id: 'del', name: 'Delhi' },
    { id: 'ban', name: 'Bangalore' },
    { id: 'hyd', name: 'Hyderabad' },
  ],
};

/**
 * Data sources for contact form
 */
export const contactFormDataSources: DataSourcesConfig = {
  countries: {
    fetch: async ({ signal }) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockCountries;
    },
    transform: (data) =>
      data.map((country) => ({
        label: country.name,
        value: country.id,
      })),
    staleTime: 60000, // 1 minute
  },
  cities: {
    fetch: async ({ dependencies, searchQuery, signal }) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const countryId = dependencies?.country as string;
      if (!countryId) return [];

      let cities = mockCities[countryId] || [];

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        cities = cities.filter((city) => city.name.toLowerCase().includes(query));
      }

      return cities;
    },
    transform: (data) =>
      data.map((city) => ({
        label: city.name,
        value: city.id,
      })),
    debounceMs: 200,
  },
};
