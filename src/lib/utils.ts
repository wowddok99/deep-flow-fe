import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractTextFromContent(content: any, maxLength: number = 200): string {
    if (!content) return "";
    let text = "";

    const traverse = (node: any) => {
        if (text.length >= maxLength) return;
        
        if (node.type === 'text' && node.text) {
             text += node.text + " ";
        }

        if (node.content && Array.isArray(node.content)) {
            for (const child of node.content) {
                traverse(child);
            }
        }
    }
    
    traverse(content);
    return text.trim().slice(0, maxLength).trim();
}
