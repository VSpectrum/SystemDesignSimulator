import LZString from 'lz-string';
import { SystemDesignGraph } from '../types/system';

export function serializeGraphToUrl(graph: SystemDesignGraph): string {
  try {
    const jsonStr = JSON.stringify(graph);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    return compressed;
  } catch (err) {
    console.error('Failed to serialize graph:', err);
    return '';
  }
}

export function deserializeGraphFromUrl(hash: string): SystemDesignGraph | null {
  try {
    // Strip leading '#' or 'data='
    let clean = hash;
    if (clean.startsWith('#')) clean = clean.slice(1);
    if (clean.startsWith('data=')) clean = clean.slice(5);
    if (!clean) return null;

    const decompressed = LZString.decompressFromEncodedURIComponent(clean);
    if (!decompressed) return null;

    const parsed = JSON.parse(decompressed);
    if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return parsed as SystemDesignGraph;
    }
    return null;
  } catch (err) {
    console.error('Failed to parse graph from URL hash:', err);
    return null;
  }
}

export function generateShareUrl(graph: SystemDesignGraph): string {
  const compressed = serializeGraphToUrl(graph);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#data=${compressed}`;
}
