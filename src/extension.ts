import * as vscode from 'vscode';
import EditorDecorator from './decorator';

export function activate(context: vscode.ExtensionContext) {
    let decorator = new EditorDecorator(context);
    context.subscriptions.push(decorator);
    context.subscriptions.push(vscode.commands.registerCommand('Mathpad.replace', () => {
        decorator.renderSelection();
    }));
}
