/** The screen for creating a template. */
export const NEW_TEMPLATE_PATH = '/workout/templates/new';

/** The editor for the template `templateId`. */
export function templatePath(templateId: number): string {
  return `/workout/templates/${templateId}`;
}
