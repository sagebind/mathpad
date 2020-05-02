import { MathJsStatic } from 'mathjs';
import { TextDocument } from 'vscode';
import { defaultScope } from './math';

/**
 * A math-enabled text document.
 */
export default class MathDocument {
    document: TextDocument;
    results = new Map<number, any>();

    // Expression compiler cache.
    private compileCache = new Map<string, math.EvalFunction>();

    constructor(document: TextDocument, private math: MathJsStatic) {
        this.document = document;
    }

    /**
     * Re-evaluate any math expressions in the document.
     */
    evaluate() {
        this.results.clear();
        let scope = defaultScope();

        for (let lineNumber = 0; lineNumber < this.document.lineCount; lineNumber++) {
            const line = this.document.lineAt(lineNumber);

            if (!line.isEmptyOrWhitespace) {
                const trimmed = line.text.trim();
                const compiled = this.compile(trimmed);

                if (compiled) {
                    try {
                        const result = compiled.evaluate(scope);
                        scope["last"] = result;

                        // Only display value results.
                        if (typeof result !== "function" && typeof result !== "undefined") {
                            this.results.set(lineNumber, result);
                        }
                    } catch (error) {
                        // console.log(error);
                    }
                }
            }
        }
    }

    /**
     * Attempt to compile the given string as a math expression.
     *
     * @param text The math expression to compile.
     */
    private compile(text: string): math.EvalFunction | null {
        let compiled = this.compileCache.get(text);

        if (!compiled) {
            try {
                compiled = this.math.compile(text);
                this.compileCache.set(text, compiled);
            } catch (error) {
                // console.log(error);
                return null;
            }
        }

        return compiled;
    }
}
