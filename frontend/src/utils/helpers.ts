// src/utils/helpers.ts

/**
 * Extrai as iniciais de um nome completo.
 * Exemplo: "João Silva" → "JS", "Maria" → "M", undefined → "?"
 */
export function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)          // considera apenas os dois primeiros nomes
    .map(word => word[0]) // primeira letra de cada
    .join('')
    .toUpperCase();
}