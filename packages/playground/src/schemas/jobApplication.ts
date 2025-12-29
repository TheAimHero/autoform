import type { AutoFormSchema } from '@autoform/core';

/**
 * Job application form schema - demonstrates nested objects and arrays
 */
export const jobApplicationSchema: AutoFormSchema = {
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
          placeholder: '+1 (555) 000-0000',
        },
      ],
    },
    {
      name: 'position',
      type: 'select',
      label: 'Position Applied For',
      placeholder: 'Select a position',
      options: [
        { label: 'Software Engineer', value: 'swe' },
        { label: 'Senior Software Engineer', value: 'senior-swe' },
        { label: 'Tech Lead', value: 'tech-lead' },
        { label: 'Engineering Manager', value: 'em' },
        { label: 'Product Manager', value: 'pm' },
        { label: 'Designer', value: 'designer' },
      ],
      validation: { required: 'Please select a position' },
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
      name: 'experience',
      type: 'array',
      label: 'Work Experience',
      description: 'Add your previous work experience (at least 1)',
      itemType: 'object',
      minItems: 1,
      maxItems: 5,
      itemFields: [
        {
          name: 'company',
          type: 'text',
          label: 'Company',
          placeholder: 'Company Name',
          validation: { required: 'Company name is required' },
        },
        {
          name: 'role',
          type: 'text',
          label: 'Role',
          placeholder: 'Your role',
          validation: { required: 'Role is required' },
        },
        {
          name: 'duration',
          type: 'text',
          label: 'Duration',
          placeholder: 'e.g., 2020 - 2023',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          placeholder: 'Describe your responsibilities...',
          fieldProps: { rows: 3 },
        },
      ],
    },
    {
      name: 'skills',
      type: 'array',
      label: 'Skills',
      description: 'List your relevant skills',
      itemType: 'text',
      minItems: 1,
      maxItems: 10,
      itemDefinition: {
        type: 'text',
        placeholder: 'Enter a skill',
      },
    },
    {
      name: 'education',
      type: 'object',
      label: 'Education',
      fields: [
        {
          name: 'degree',
          type: 'select',
          label: 'Highest Degree',
          placeholder: 'Select degree',
          options: [
            { label: 'High School', value: 'high-school' },
            { label: "Associate's", value: 'associates' },
            { label: "Bachelor's", value: 'bachelors' },
            { label: "Master's", value: 'masters' },
            { label: 'PhD', value: 'phd' },
            { label: 'Other', value: 'other' },
          ],
          validation: { required: 'Please select your degree' },
        },
        {
          name: 'field',
          type: 'text',
          label: 'Field of Study',
          placeholder: 'Computer Science',
        },
        {
          name: 'institution',
          type: 'text',
          label: 'Institution',
          placeholder: 'University Name',
        },
        {
          name: 'graduationYear',
          type: 'number',
          label: 'Graduation Year',
          placeholder: '2020',
        },
      ],
    },
    {
      name: 'coverLetter',
      type: 'textarea',
      label: 'Cover Letter',
      placeholder: "Tell us why you're a great fit for this role...",
      fieldProps: { rows: 6 },
      validation: {
        required: 'Cover letter is required',
        minLength: { value: 100, message: 'Please write at least 100 characters' },
      },
    },
    {
      name: 'salary',
      type: 'number',
      label: 'Expected Salary (USD/year)',
      placeholder: '100000',
      description: 'Optional - helps us match you with the right opportunities',
    },
    {
      name: 'startDate',
      type: 'select',
      label: 'Available to Start',
      placeholder: 'Select availability',
      options: [
        { label: 'Immediately', value: 'immediate' },
        { label: 'Within 2 weeks', value: '2-weeks' },
        { label: 'Within 1 month', value: '1-month' },
        { label: 'Within 3 months', value: '3-months' },
        { label: 'Other', value: 'other' },
      ],
      validation: { required: 'Please select your availability' },
    },
    {
      name: 'remoteWork',
      type: 'checkbox',
      label: 'I am open to remote work',
      defaultValue: true,
    },
    {
      name: 'relocation',
      type: 'checkbox',
      label: 'I am willing to relocate',
      defaultValue: false,
    },
  ],
};
