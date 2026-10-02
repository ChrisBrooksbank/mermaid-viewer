import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';
import { StringStream } from '@codemirror/language';
import { mermaidCompletions, mermaidStreamParser } from './mermaidLanguage';

function tokenize(line: string): [string, string | null][] {
    const state = mermaidStreamParser.startState();
    const stream = new StringStream(line, 4, 4);
    const tokens: [string, string | null][] = [];
    while (!stream.eol()) {
        const style = mermaidStreamParser.token(stream, state);
        const text = stream.current();
        if (text.trim()) tokens.push([text, style]);
        stream.start = stream.pos;
    }
    return tokens;
}

function complete(doc: string, explicit = false) {
    const state = EditorState.create({ doc });
    return mermaidCompletions(new CompletionContext(state, doc.length, explicit));
}

describe('mermaid highlighting', () => {
    it('tokenizes a flowchart edge', () => {
        expect(tokenize('A[Start] -->|Yes| B{Done?}')).toEqual([
            ['A', 'variableName'],
            ['[Start]', 'string'],
            ['-->', 'operator'],
            ['|Yes|', 'labelName'],
            ['B', 'variableName'],
            ['{Done?}', 'string'],
        ]);
    });

    it('recognises diagram types, keywords and directions', () => {
        expect(tokenize('flowchart LR')).toEqual([
            ['flowchart', 'typeName'],
            ['LR', 'atom'],
        ]);
        expect(tokenize('subgraph one')[0]).toEqual(['subgraph', 'keyword']);
    });

    it('treats text after a colon as a string', () => {
        expect(tokenize('A->>B: Hello there')).toEqual([
            ['A', 'variableName'],
            ['->>', 'operator'],
            ['B', 'variableName'],
            [':', 'punctuation'],
            ['Hello there', 'string'],
        ]);
    });

    it('highlights comments', () => {
        expect(tokenize('%% a note')).toEqual([['%% a note', 'comment']]);
    });
});

describe('mermaid completions', () => {
    it('suggests diagram types on the first line', () => {
        const result = complete('seq');
        expect(result!.options.map(o => o.label)).toContain('sequenceDiagram');
    });

    it('suggests keywords and identifiers used in the document', () => {
        const result = complete('graph TD\n    Start --> Finish\n    Fi');
        const labels = result!.options.map(o => o.label);
        expect(labels).toContain('subgraph');
        expect(labels).toContain('Finish');
        expect(labels).toContain('Start');
        expect(labels).not.toContain('Fi');
    });

    it('stays quiet without a word unless asked', () => {
        expect(complete('graph TD\n    ')).toBeNull();
    });
});
