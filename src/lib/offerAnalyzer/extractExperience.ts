export function extractExperience(text: string): string {
  const expMatch =
    text.match(/\bd[ée]butant\s+accept[ée]?\b/i) ??
    text.match(/\bexp(?:[ée]rience)?\s+confirm[ée]e?\b/i) ??
    text.match(/\bexp(?:[ée]rience)?\s+souhait[ée]e?\b/i) ??
    text.match(
      /\bExp(?:[ée]rience)?\.?\s*[:-]?\s*(\d+\s*(?:à|-)\s*\d+|\d+)\s*ans?\s*(min(?:imum)?\.?|et\s*\+|ou\s*plus)?/i,
    ) ??
    text.match(
      /\b(\d+\s*(?:à|-)\s*\d+|\d+)\s*ans?\s*(?:min(?:imum)?\.?|d['']exp(?:[ée]rience)?|d['']experience)/i,
    ) ??
    text.match(
      /(\d+)\s*(?:à|-)\s*(\d+)?\s*ans?\s*(?:d'exp|d'expérience|d'experience)?/i,
    ) ??
    text.match(/(\d+)\s*ans?\s*(?:d'exp|d'expérience|d'experience)/i) ??
    text.match(
      /(?:expérience|experience)\s*[:\s]*(\d+\s*(?:à|-)\s*\d+|\d+)\s*ans?/i,
    );

  return expMatch ? expMatch[0].replace(/\s+/g, " ").trim() : "";
}
