import { useState } from 'react';
import { AutoForm, useAutoForm, createFieldRegistry, FieldComponent } from '@autoform/core';

// Field components
import {
  TextField,
  NumberField,
  TextAreaField,
  SelectField,
  CheckboxField,
  AutocompleteField,
} from './components/fields';

// Wrapper components
import { ArrayFieldWrapper, ObjectFieldWrapper } from './components/wrappers';

// Shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Schemas
import {
  contactFormSchema,
  contactFormDataSources,
  jobApplicationSchema,
  teamRegistrationSchema,
  teamRegistrationDataSources,
  developerProfileSchema,
  developerProfileDataSources,
} from './schemas';

// Icons
import { Send, RotateCcw, FileText, Briefcase, Check, Github, Sparkles, Users, Code2 } from 'lucide-react';

// Create field registry with our components
const registry = createFieldRegistry({
  fields: {
    text: TextField as FieldComponent,
    email: TextField as FieldComponent,
    password: TextField as FieldComponent,
    number: NumberField as FieldComponent,
    textarea: TextAreaField as FieldComponent,
    select: SelectField as FieldComponent,
    checkbox: CheckboxField as FieldComponent,
    autocomplete: AutocompleteField as FieldComponent,
  },
  arrayField: ArrayFieldWrapper,
  objectField: ObjectFieldWrapper,
});

type FormType = 'contact' | 'job' | 'team' | 'developer';

function App() {
  const [activeForm, setActiveForm] = useState<FormType>('contact');
  const [submittedData, setSubmittedData] = useState<unknown>(null);

  // Get active schema and data sources
  const getSchemaAndDataSources = () => {
    switch (activeForm) {
      case 'contact':
        return { schema: contactFormSchema, dataSources: contactFormDataSources };
      case 'job':
        return { schema: jobApplicationSchema, dataSources: {} };
      case 'team':
        return { schema: teamRegistrationSchema, dataSources: teamRegistrationDataSources };
      case 'developer':
        return { schema: developerProfileSchema, dataSources: developerProfileDataSources };
      default:
        return { schema: contactFormSchema, dataSources: contactFormDataSources };
    }
  };

  const { schema, dataSources } = getSchemaAndDataSources();

  // Use auto form hook
  const { form } = useAutoForm({
    schema,
    mode: 'onChange',
  });

  // Reset form when switching
  const handleFormChange = (type: FormType) => {
    setActiveForm(type);
    setSubmittedData(null);
    form.reset();
  };

  const handleSubmit = (data: unknown) => {
    console.log('Form submitted:', data);
    setSubmittedData(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8 lg:py-12">
        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              AutoForm Playground
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            A demonstration of the @autoform/core library — build dynamic, schema-driven forms with
            ease.
          </p>
        </header>

        {/* Navigation */}
        <nav className="flex flex-wrap gap-3 mb-8">
          <Button
            variant={activeForm === 'contact' ? 'default' : 'outline'}
            onClick={() => handleFormChange('contact')}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Contact Form
          </Button>
          <Button
            variant={activeForm === 'job' ? 'default' : 'outline'}
            onClick={() => handleFormChange('job')}
            className="gap-2"
          >
            <Briefcase className="h-4 w-4" />
            Job Application
          </Button>
          <Button
            variant={activeForm === 'team' ? 'default' : 'outline'}
            onClick={() => handleFormChange('team')}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Team Registration
          </Button>
          <Button
            variant={activeForm === 'developer' ? 'default' : 'outline'}
            onClick={() => handleFormChange('developer')}
            className="gap-2"
          >
            <Code2 className="h-4 w-4" />
            Developer Profile
          </Button>
        </nav>

        {/* Main content */}
        <main className="grid gap-8 lg:grid-cols-2">
          {/* Form container */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-b from-card to-card/50 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {activeForm === 'contact'
                        ? 'Contact Form'
                        : activeForm === 'job'
                          ? 'Job Application Form'
                          : activeForm === 'team'
                            ? 'Team Registration Form'
                            : 'Developer Profile'}
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      {activeForm === 'contact'
                        ? 'Demonstrates async data loading, conditional fields, and validation.'
                        : activeForm === 'job'
                          ? 'Demonstrates nested objects, array fields, and complex validation.'
                          : activeForm === 'team'
                            ? 'Demonstrates deeply nested structures, async APIs, and dependent fields.'
                            : '🔥 Showcases 5 real APIs: GitHub, NPM, REST Countries, Linguist, PokeAPI'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {activeForm === 'contact'
                      ? '9 fields'
                      : activeForm === 'job'
                        ? '11 fields'
                        : activeForm === 'team'
                          ? '8 sections'
                          : '6 APIs'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <AutoForm
                  key={activeForm}
                  schema={schema}
                  form={form}
                  registry={registry}
                  dataSources={dataSources}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {({ fields, isSubmitting }) => (
                    <>
                      {fields}
                      <div className="flex gap-3 pt-4 border-t border-border">
                        <Button type="submit" disabled={isSubmitting} className="gap-2">
                          {isSubmitting ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Submit
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => form.reset()}
                          className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reset
                        </Button>
                      </div>
                    </>
                  )}
                </AutoForm>
              </CardContent>
            </Card>

            {/* Submitted Data */}
            {submittedData !== null && (
              <Card className="border-success/50 bg-success/5 animate-fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground">
                      <Check className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base text-success">
                      Form Submitted Successfully
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border bg-card p-4 overflow-x-auto scrollbar-thin">
                    <pre className="text-xs font-mono text-foreground/80">
                      {JSON.stringify(submittedData, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Schema preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Schema Definition
                </CardTitle>
                <CardDescription>The JSON schema powering this form</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-thin p-4">
                  <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap">
                    {JSON.stringify(schema, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Built with React, react-hook-form, Zod, and Jotai.
          </p>
          <a
            href="https://github.com/yourusername/auto-form"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Github className="h-4 w-4" />
            View on GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
