const {app, BrowserWindow, ipcMain, Menu, dialog, screen} = require('electron')
const path = require('path')
const fs = require('fs')
const {Client} = require('ssh2')
const filePath = app.getPath('userData') + '\\users.file'
const users = []
const connectionMap = new Map()
Menu.setApplicationMenu(null)

try {
    require('electron-reloader')(module, {});
} catch (_) {
}

function createWindow() {
    initUsers().then(() => {
        createMainWindow()
    })
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        title: 'HUA-SSH',
        width: 600,
        height: 399,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    mainWindow.loadFile('view/index.html')
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('sshUsers', JSON.stringify(users))
    })
    // mainWindow.webContents.openDevTools()
}

async function initUsers() {
    fs.stat(filePath, function (err, stats) {
        if (!err && stats.isFile()) {
            fs.readFile(filePath, 'utf8', function (err, data) {
                if (err) return console.log(err)
                for (const message of JSON.parse(data)) {
                    if (message) users.push(message)
                }
            })
        }
    })
}

function connect(msg) {
    const id = Date.now()
    const terminalWindow = new BrowserWindow({
        title: 'HUA-SSH',
        width: 800,
        height: 600,
        backgroundColor: '#28313a',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    terminalWindow.loadFile('view/terminal.html')
    const conn = new Client()
    terminalWindow.webContents.on('did-finish-load', () => {
        terminalWindow.webContents.send('terminal', id.toString())
        conn.on('ready', () => {
            conn.shell((err, stream) => {
                if (err) throw err
                connectionMap.set(id.toString(), {client: conn, shell: stream})
                stream.on('close', () => {
                    conn.end()
                }).on('data', (data) => {
                    terminalWindow.webContents.send('instruction-reply', data)
                })
            })
        }).on('error', (e) => {
            destroy(terminalWindow, conn)
            dialog.showErrorBox('连接失败', e.toString())
        }).connect({
            host: msg.host,
            port: msg.port,
            username: msg.user,
            password: msg.pass
        })
    })

    terminalWindow.on('resized', () => {
        fit(terminalWindow, false)
    })

    terminalWindow.on('maximize', () => {
        fit(terminalWindow, true)
    })

    terminalWindow.on('unmaximize', () => {
        fit(terminalWindow, false)
    })

    terminalWindow.on('closed', () => {
        destroy(terminalWindow, conn)
    })
    terminalWindow.webContents.openDevTools()
}

function write() {
    fs.writeFile(filePath, JSON.stringify(users), {encoding: 'utf8', 'flag': 'w'}, function (err) {
        if (err) console.log(err)
    })
}

ipcMain.on('sshInput', (event, message) => {
    users.push(JSON.parse(message))
    write()
})

ipcMain.on('connect', (event, message) => {
    connect(JSON.parse(message))
})

ipcMain.on('remove', (event, message) => {
    users.forEach((user, index, arr) => {
        if (user.id.toString() === message) {
            users.splice(index, 1)
        }
    })
    write()
})

ipcMain.on('instruction', (event, param) => {
    const obj = connectionMap.get(param.id)
    obj.shell.write(param.instruction)
})

function fit(terminalWindow, isMax) {
    const rectangle = terminalWindow.getNormalBounds()
    if (isMax) {
        rectangle.height = screen.getPrimaryDisplay().workAreaSize.height
        rectangle.isMax = true
    }
    terminalWindow.webContents.send('resize', rectangle)
}

function destroy(terminalWindow, conn) {
    terminalWindow.destroy()
    conn.destroy()
}
