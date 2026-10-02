/**
 * Lightweight Mermaid syntax highlighting and autocompletion for CodeMirror
 */

import { StreamLanguage, type StringStream } from '@codemirror/language';
import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const DIAGRAM_TYPES = [
    'flowchart',
    'graph',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram-v2',
    'stateDiagram',
    'erDiagram',
    'gantt',
    'pie',
    'journey',
    'gitGraph',
    'mindmap',
    'timeline',
    'quadrantChart',
    'requirementDiagram',
    'C4Context',
    'sankey-beta',
    'xychart-beta',
    'block-beta',
    'packet-beta',
    'kanban',
    'architecture-beta',
];

export const KEYWORDS = [
    'subgraph',
    'end',
    'direction',
    'participant',
    'actor',
    'activate',
    'deactivate',
    'autonumber',
    'loop',
    'alt',
    'else',
    'opt',
    'par',
    'and',
    'critical',
    'break',
    'rect',
    'box',
    'note',
    'Note',
    'over',
    'left of',
    'right of',
    'class',
    'classDef',
    'style',
    'linkStyle',
    'click',
    'title',
    'section',
    'dateFormat',
    'axisFormat',
    'excludes',
    'todayMarker',
    'state',
    'commit',
    'branch',
    'checkout',
    'merge',
    'cherry-pick',
    'root',
    'as',
    'accTitle',
    'accDescr',
];

const DIRECTIONS = ['TD', 'TB', 'BT', 'RL', 'LR'];

const KEYWORD_SET = new Set(KEYWORDS.flatMap(k => k.split(' ')));
const DIAGRAM_TYPE_SET = new Set(DIAGRAM_TYPES);
const DIRECTION_SET = new Set(DIRECTIONS);

interface MermaidState {
    /** Rest of the line after ':' is free text (messages, labels) */
    inText: boolean;
}

// Flowchart, class, sequence and ER connectors: -->, ==>, -.->, <|--, ->>, -x, --)
const ARROW =
    /^(?:(<\|--|<<|<|o|x|\*)?(-{2,}|={2,}|-\.+-|\.{2,}|~{3})(\|>|>>|>|o|x|\*|\))?|-(>>|>|x|\)))/;
const BRACKETED =
    /^(\(\(.*?\)\)|\[\[.*?\]\]|\[\(.*?\)\]|\(\[.*?\]\)|\{\{.*?\}\}|\[.*?\]|\(.*?\)|\{.*?\}|>.*?\])/;

export const mermaidStreamParser = {
    name: 'mermaid',
    startState: (): MermaidState => ({ inText: false }),
    token(stream: StringStream, state: MermaidState): string | null {
        if (stream.sol()) state.inText = false;
        if (stream.eatSpace()) return null;

        if (stream.match('%%')) {
            stream.skipToEnd();
            return 'comment';
        }

        if (state.inText) {
            stream.skipToEnd();
            return 'string';
        }

        if (stream.match(/^"[^"]*"?/)) return 'string';
        if (stream.match(/^\|[^|]*\|/)) return 'labelName';
        if (stream.match(':::')) return 'operator';
        if (stream.match(ARROW)) return 'operator';

        if (stream.peek() === ':') {
            stream.next();
            state.inText = true;
            return 'punctuation';
        }

        if (stream.match(/^-?\d+(\.\d+)?%?/)) return 'number';

        // Hyphens join words (stateDiagram-v2, cherry-pick) but not arrows (A->>B)
        const word = stream.match(/^[A-Za-z_]\w*(?:-[A-Za-z0-9]\w*)*/) as RegExpMatchArray | null;
        if (word) {
            const text = word[0];
            if (DIAGRAM_TYPE_SET.has(text)) return 'typeName';
            if (KEYWORD_SET.has(text)) return 'keyword';
            if (DIRECTION_SET.has(text)) return 'atom';
            return 'variableName';
        }

        if (stream.match(BRACKETED)) return 'string';

        stream.next();
        return 'punctuation';
    },
    languageData: {
        commentTokens: { line: '%%' },
    },
};

export const mermaidLanguage = StreamLanguage.define(mermaidStreamParser);

/**
 * Completions: diagram types on the first line, then keywords, directions
 * and identifiers already used in the document.
 */
export function mermaidCompletions(context: CompletionContext): CompletionResult | null {
    const word = context.matchBefore(/[\w-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const doc = context.state.doc;
    const line = doc.lineAt(context.pos);
    const isFirstContentLine =
        doc.sliceString(0, line.from).trim().replace(/%%.*$/gm, '').trim() === '';

    if (isFirstContentLine) {
        return {
            from: word.from,
            options: DIAGRAM_TYPES.map(label => ({ label, type: 'type' })),
        };
    }

    const known = new Set([...KEYWORD_SET, ...DIRECTION_SET, ...DIAGRAM_TYPE_SET]);
    const currentWord = doc.sliceString(word.from, word.to);
    const identifiers = new Set<string>();
    for (const match of doc.toString().matchAll(/\b[A-Za-z_][\w-]*\b/g)) {
        const id = match[0];
        if (id.length > 1 && !known.has(id) && id !== currentWord) identifiers.add(id);
    }

    return {
        from: word.from,
        options: [
            ...KEYWORDS.map(label => ({ label, type: 'keyword' })),
            ...DIRECTIONS.map(label => ({ label, type: 'constant' })),
            ...[...identifiers].map(label => ({ label, type: 'variable' })),
        ],
        validFor: /^[\w-]*$/,
    };
}
