import {
    DecorationOptions,
    DecorationRangeBehavior,
    Disposable,
    DocumentSelector,
    languages,
    TextDocument,
    TextEditor,
    ThemeColor,
    Uri,
    window,
    workspace,
    ExtensionContext,
} from "vscode";
import MathDocument from "./document";
import { MathJsStatic } from 'mathjs';
import { create } from "./math";
import * as path from 'path';

const decorationType = window.createTextEditorDecorationType({
    after: {
        color: new ThemeColor("editorCodeLens.foreground"),
        fontStyle: "normal",
        margin: "0 0 0 24em",
    },
    isWholeLine: true,
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

export default class EditorDecorator implements Disposable {
    documentSelector: DocumentSelector = [
        "markdown"
    ];
    private documents = new Map<Uri, MathDocument>();
    private disposables: Disposable[] = [];
    private math: MathJsStatic;

    constructor(private ctx: ExtensionContext) {
        this.math = create(ctx);

        // Handle editors being created and disposed, which we might be
        // interested in.
        this.disposables.push(window.onDidChangeVisibleTextEditors(() => {
            this.renderAll();
        }));

        // An editor's language could change, so re-evaluate an editor when that
        // happens.
        this.disposables.push(window.onDidChangeTextEditorOptions(event => {
            this.renderEditor(event.textEditor);
        }));

        // Re-render when a math document is edited.
        this.disposables.push(workspace.onDidChangeTextDocument(event => {
            // If this document isn't math-enabled, then do nothing.
            if (!this.isMathEnabled(event.document)) {
                return;
            }

            // Find all editors for this document and re-render their math.
            window.visibleTextEditors.forEach(editor => {
                if (editor.document.uri === event.document.uri) {
                    this.renderEditor(editor);
                }
            });
        }));

        // Cleanup our math document data when a text document is closed.
        this.disposables.push(workspace.onDidCloseTextDocument(document => {
            this.documents.delete(document.uri);
        }));

        // Do a first-pass on initial load.
        this.renderAll();
    }

    /**
     * Re-render all math decorations on all math-enabled editors.
     */
    renderAll() {
        window.visibleTextEditors.forEach(editor => this.renderEditor(editor));
    }

    /**
     * Re-render all math decorations on the given editor.
     */
    renderEditor(editor: TextEditor) {
        let decorationsArray: DecorationOptions[] = [];

        if (this.isMathEnabled(editor.document)) {
            let document = this.getMathDocument(editor.document);

            document.evaluate();

            document.results.forEach((value, lineNumber) => {
                decorationsArray.push({
                    range: document.document.lineAt(lineNumber).range,
                    renderOptions: {
                        after: {
                            contentText: ` = ${this.format(value)}`,
                            margin: "0 0 0 24em"
                        }
                    }
                });
            });
        }

        editor.setDecorations(decorationType, decorationsArray);
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
    }

    private getMathDocument(document: TextDocument): MathDocument {
        let mathDocument = this.documents.get(document.uri);

        if (!mathDocument) {
            mathDocument = new MathDocument(document, this.math);
            this.documents.set(document.uri, mathDocument);
        }

        return mathDocument;
    }

    private isMathEnabled(document: TextDocument): boolean {
        let config = workspace.getConfiguration('Mathpad');
        let filePatterns = config.get('filePatterns') as [string];
        let currentFileName = path.basename(document.uri.toString());
        let fileMatches = filePatterns.map((pat) => new RegExp(pat).test(currentFileName));
        let enabled = config.get('enabled') as boolean;
        return fileMatches.some((val) => val) && enabled;
    }

    /**
     * Format a numeric result as a string for display.
     *
     * @param value Number to format
     */
    private format(value: any): string {
        if (value instanceof Date) {
            if (value.getHours() || value.getMinutes() || value.getSeconds() || value.getMilliseconds()) {
                return value.toLocaleString();
            }
            return value.toLocaleDateString();
        }

        return this.math.format(value, number => {
            let s = this.math.format(number, {
                lowerExp: -9,
                upperExp: 15,
            });

            // Add thousands separators if number is formatted as fixed.
            if (/^\d+(\.\d+)?$/.test(s)) {
                s = s.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
            }

            return s;
        });
    }
}
