export const uuidv4 = (): string =>
  crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2, 11);
