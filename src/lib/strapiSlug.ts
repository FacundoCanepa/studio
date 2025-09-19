export function toStrapiSlug(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^A-Za-z0-9\-_.~]/g, '')
      .replace(/-+/g, '-')
      .replace(/(^-+|-+$)/g, '')
      .toLowerCase();
  }