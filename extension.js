// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const vscode = require('vscode');
const { spawn } = require('child_process');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

class Logger {
	static showInformationMessage(message, ...items) {
		return vscode.window.showInformationMessage(message, ...items);
	}

	static showErrorMessage(message, ...items) {
		return vscode.window.showErrorMessage(message, ...items);
	}
}

function createImageDirWithImagePath(imagePath) {
	return new Promise((resolve, reject) => {
		let imageDir = path.dirname(imagePath);

		fs.stat(imageDir, (err, stats) => {
			if (err == null) {
				if (stats.isDirectory()) {
					resolve(imagePath);
				} else {
					reject(`The image dest directory '${imageDir}' is a file. Please check your 'copyAndInsert.path' config.`)
				}
			} else if (err.code == "ENOENT") {
				fse.ensureDir(imageDir, (err) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(imagePath);
				});
			} else {
				reject(err);
			}
		});
	});
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "copy-and-insert" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('copy-and-insert.func', function () {
		// The code you place here will be executed every time your command is executed
		const editor = vscode.window.activeTextEditor
		const tPath = vscode.workspace.getConfiguration().get('copyAndInsert.path');
		const alias = vscode.workspace.getConfiguration().get('copyAndInsert.alias');
		const rootPath = vscode.workspace.rootPath;
		const targetPath = path.join(rootPath, tPath);
		let scriptPath = path.join(__dirname, './res/apple.applescript');
		let url = '';

		let ascript = spawn('osascript', [scriptPath]);
		ascript.on('error', function (e) {
			Logger.showErrorMessage(e);
		});

		ascript.stdout.on('data', function (data) {
			url += data.toString().trim();
		});

		ascript.stdout.on('end', function () {
			let fname = path.basename(url)
			let targetFilePath = path.join(targetPath, fname)

			while (fs.existsSync(targetFilePath)) {
				const [newFname, type] = fname.split('.');
				fname = [newFname + '_new', type].join('.')
				targetFilePath = path.join(targetPath, fname);
			}

			if (fs.existsSync(url)) {
				createImageDirWithImagePath(targetFilePath)
					.then(() => {
						fs.copyFile(url, targetFilePath, (err) => {
							if (!err) {
								vscode.window.showInformationMessage('CopyAndPaste done');

								editor.edit(edit => {
									let current = editor.selection;
									if (alias) {
										edit.insert(current.start, targetFilePath.replace(path.join(rootPath, alias), '@'));
									} else {
										edit.insert(current.start, targetFilePath.replace(rootPath, ''));
									}
								});

							} else console.error(err);
						})
					})
					.catch(e => {
						console.error(e);
					})
			} else {
				console.error(url, 'not exist');
			}
		});
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
