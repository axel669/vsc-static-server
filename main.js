const vscode = require("vscode")
const fs = require("fs-jetpack")
const path = require("path")
const yaml = require("yaml")
const express = require("express")
const proxyTo = require("express-http-proxy")

const buttonText = {
    idle: "$(play) Start",
}

let button = null
let state = "idle"
let app = null
let server = null
let port = null

const setHeaders = (global = {}, local = {}) => {
    const list = [
        ...Object.entries(global),
        ...Object.entries(local),
    ]

    const setHeaders = (res) => {
        for (const [name, value] of list) {
            res.setHeader(name, value)
        }
    }

    return { setHeaders }
}
const startServer = async () => {
    state = "init"
    button.text = "Initializing..."

    const [sourceFolder] = vscode.workspace.workspaceFolders ?? []

    if (sourceFolder === undefined) {
        state = "idle"
        vscode.window.showWarningMessage(
            "Static Server only runs in a workspace"
        )
        return
    }

    const configPath = path.resolve(
        sourceFolder.uri.fsPath,
        "static-serve.yml"
    )
    if (fs.exists(configPath) === false) {
        state = "idle"
        vscode.window.showWarningMessage(
            "static-serve.yaml not found"
        )
        return
    }
    const config = yaml.parse(
        await fs.readAsync(configPath)
    )

    app = express()
    port = config.port ?? 45067
    for (const source of config.sources) {
        const { dir, proxy, headers = {} } = source
        console.log("adding", dir ?? proxy)

        const router =
            (dir !== undefined)
            ? express.static(
                path.resolve(sourceFolder.uri.fsPath, dir),
                setHeaders(config.headers, headers)
            )
            : proxyTo(
                proxy,
                {
                    userResHeaderDecorator(headers) {
                        return {
                            ...headers,
                            ...Object.fromEntries([
                                ...Object.entries(config.headers),
                                ...Object.entries(headers),
                            ])
                        }
                    }
                }
            )
        app.use(router)
    }
    server = app.listen(
        port,
        () => {
            state = "running"
            button.text = `$(stop) Running: ${port}`
            button.show()
        }
    )
}
const stopServer = () => {
    state = "shutdown"
    server.close()
    button.text = buttonText.idle

    state = "idle"
}

module.exports = {
    activate: (context) => {
        const { subscriptions } = context

        const cmd = "axel669.static-serve.start"

        button = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            0
        )
        button.command = cmd

        subscriptions.push(
            vscode.commands.registerCommand(
                cmd,
                () => {
                    if (state === "running") {
                        stopServer()
                        return
                    }
                    if (state !== "idle") {
                        return
                    }
                    startServer()
                }
            )
        )

        button.text = buttonText.idle
        button.show()
    }
}
