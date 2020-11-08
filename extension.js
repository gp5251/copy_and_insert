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

function getFiles() {
	let scriptPath = path.join(__dirname, './res/apple.applescript');
	let url = '';

	let ascript = spawn('osascript', [scriptPath]);
	ascript.on('error', function (e) {
		Logger.showErrorMessage(e);
	});

	ascript.stdout.on('data', function (data) {
		url += data.toString().trim();
	});

	return new Promise(resolve => {
		ascript.stdout.on('end', async function () {
			resolve(url)
		})
	})
}

async function getTargetPath() {
	const tPaths = vscode.workspace.getConfiguration().get('copyAndInsert.paths');

	let tPath
	if (tPaths.length > 1) {
		tPath = await vscode.window.showQuickPick(tPaths, {
			machOnDescription: true,
			machOnDetail: true,
			canPickMany: false,
			placeHolder: "复制到哪个文件夹:",
			// onDidSelectItem: (item) => console.log(`Item ${item} is selected`)
		})
	} else {
		tPath = tPaths[0]
	}

	return tPath
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "Copy & Insert" is now active!');
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('copyAndInsert.func', async function () {
		// The code you place here will be executed every time your command is executed
		const editor = vscode.window.activeTextEditor
		const alias = vscode.workspace.getConfiguration().get('copyAndInsert.alias');
		const aliasKey = vscode.workspace.getConfiguration().get('copyAndInsert.aliasKey');
		const rootPath = vscode.workspace.rootPath;
		const tPath = await getTargetPath()
		const targetPath = path.join(rootPath, tPath);
		const urlsStr = await getFiles()
		const urls = urlsStr.split('Macintosh HD')

		if (!urlsStr.length || !urls.length) {
			vscode.window.showWarningMessage('copy&insert: 没有选择文件');
			return;
		}

		let i = 0
		for (let url of urls) {
		// urls.forEach(async url => {
			let fname = path.basename(url)
			let targetFilePath = path.join(targetPath, fname)

			if (fs.existsSync(targetFilePath)) {
				const select = await vscode.window.showQuickPick(['取消', '覆盖', '重命名'], {
					machOnDescription: true,
					machOnDetail: true,
					canPickMany: false,
					placeHolder: "目标文件已经存在，如何处理？",
				})
				if (select == '取消') return;
				if (select == '重命名') {
					do {
						const [newFname, type] = fname.split('.');
						fname = [newFname + '_new', type].join('.')
						targetFilePath = path.join(targetPath, fname);
					} while (fs.existsSync(targetFilePath))
				}
			}

			if (fs.existsSync(url)) {
				createImageDirWithImagePath(targetFilePath)
					.then(() => {
						fs.copyFile(url, targetFilePath, (err) => {
							if (err) {
								console.error(err);
							} else {
								setTimeout(() => {
									editor.edit(edit => {
										let current = editor.selection;
										if (alias && aliasKey) {
											edit.insert(current.start, targetFilePath.replace(path.join(rootPath, alias), aliasKey));
										} else {
											edit.insert(current.start, targetFilePath.replace(rootPath, ''));
										}
									});
								}, 100 * (i++))
							}
						})
					})
					.catch(e => {
						console.error(e);
					})
			} else {
				console.error(url, 'not exist');
			}
		};
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
