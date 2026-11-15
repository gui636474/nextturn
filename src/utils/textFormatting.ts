/**
 * Formatação e Sanitização Segura de Texto para o Chat RPG
 * Suporta: **negrito**, *itálico*, __sublinhado__, ~~tachado~~, > citação, `código`
 * Proteção nativa contra XSS / injeção de HTML
 */

export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function parseRPGMarkdown(rawText: string): string {
  if (!rawText) return ''
  
  // 1. Sanitizar primeiro
  let safe = sanitizeText(rawText)

  // 2. Negrito: **texto** ou __texto__
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-nt-text">$1</strong>')
  
  // 3. Itálico: *texto* ou _texto_
  safe = safe.replace(/(^|[^*])\*(?!\*)(.*?)\*(?!\*)/g, '$1<em class="italic text-nt-text/90">$2</em>')
  safe = safe.replace(/(^|[^_])_(?!_)(.*?)_(?!_)/g, '$1<em class="italic text-nt-text/90">$2</em>')

  // 4. Tachado: ~~texto~~
  safe = safe.replace(/~~(.*?)~~/g, '<del class="line-through opacity-70">$1</del>')

  // 5. Código inline: `código`
  safe = safe.replace(/`([^`]+)`/g, '<code class="bg-nt-surface3 px-1.5 py-0.5 rounded text-sm text-nt-gold font-mono">$1</code>')

  // 6. Citação: &gt; texto
  safe = safe.replace(/^&gt;\s?(.*)$/gm, '<blockquote class="border-l-2 border-nt-bordeaux pl-3 my-1 italic text-nt-muted">$1</blockquote>')

  // 7. Menções: @username
  safe = safe.replace(/@([a-zA-Z0-9_]{3,30})/g, '<span class="text-nt-gold font-medium bg-nt-gold/10 px-1 py-0.5 rounded">@$1</span>')

  // 8. Quebras de linha
  safe = safe.replace(/\n/g, '<br />')

  return safe
}
