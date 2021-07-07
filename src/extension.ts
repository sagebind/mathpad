import * as vscode from 'vscode';
import EditorDecorator from './decorator';

export function activate(context: vscode.ExtensionContext) {
    let decorator = new EditorDecorator(context);
    context.subscriptions.push(decorator);
    context.subscriptions.push(vscode.commands.registerCommand('Mathpad.enable', () => {
        let config = vscode.workspace.getConfiguration('Mathpad', );
        config.update('enabled', true, vscode.ConfigurationTarget.Global);
        setTimeout(() => {decorator.renderAll();}, 1000);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('Mathpad.disable', () => {
        let config = vscode.workspace.getConfiguration('Mathpad');
        config.update('enabled', false, vscode.ConfigurationTarget.Global);
        setTimeout(() => {decorator.renderAll();}, 1000);
    }));
}
