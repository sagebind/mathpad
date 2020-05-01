import { TextDocument } from 'vscode';
import * as math from 'mathjs';

/**
 * A math-enabled text document.
 */
export default class MathDocument {
    document: TextDocument;
    results = new Map<number, any>();

    // Expression compiler cache.
    private compileCache = new Map<string, math.EvalFunction>();

    constructor(document: TextDocument) {
        this.document = document;
    }

    /**
     * Re-evaluate any math expressions in the document.
     */
    evaluate() {
        this.results.clear();
        let scope: any = {};

        for (let lineNumber = 0; lineNumber < this.document.lineCount; lineNumber++) {
            const line = this.document.lineAt(lineNumber);

            if (!line.isEmptyOrWhitespace) {
                const compiled = this.compile(line.text);

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
        const trimmed = text.trim();
        let compiled = this.compileCache.get(trimmed);

        if (!compiled) {
            try {
                compiled = math.compile(trimmed);
                this.compileCache.set(trimmed, compiled);
            } catch (error) {
                return null;
            }
        }

        return compiled;
    }
}
