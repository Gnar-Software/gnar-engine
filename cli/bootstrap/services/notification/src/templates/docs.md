# Email templates

Handlebars (`.hbs`) files in this directory, compiled by
`notificationService.compileTemplate` and named by the `templateSlug` on an
email notification. An email notification carries either its own `content` or a
`templateSlug` to compile one from, so a template here is reached by naming its
filename without the extension.

## Adding a template

1. Add `my-template.hbs` to this directory.
2. Document it below: which address it goes to, which address a reply goes to,
   and every parameter it reads.
3. Raise it with `templateSlug: 'my-template'` and the parameters as
   `templateData`.

## Writing one

Table based layout with inlined styles, so it renders in the mail clients that
ignore a stylesheet, and collapsing to one column at 600px.

Handlebars escapes everything it prints, so a template never takes markup from a
caller. Anything with line breaks in it is handed over as an array of lines and
walked with `{{#each}}` rather than passed through as html: a caller that can
put markup into an email can put markup into an email sent to someone else.

Buttons use the table based pattern with `mso-padding-alt`, so Outlook renders
the shape rather than a bare link.

## Templates

None yet. Document each one here as it is added, with a table of its parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
