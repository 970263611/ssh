const {Terminal} = require('xterm')
const {FitAddon} = require('xterm-addon-fit')
const {ipcRenderer} = require('electron')
const fitAddon = new FitAddon()
const terminal = new Terminal({
    rendererType: "canvas", //渲染类型
    rows: 30,
    cols: 170,
    convertEol: true, //启用时，光标将设置为下一行的开头
    scrollback: 50, //终端中的回滚量
    disableStdin: false, //是否应禁用输入。
    cursorStyle: "underline", //光标样式
    cursorBlink: true, //光标闪烁
    theme: {
        foreground: "#7e9192", //字体
        background: "#28313a", //背景色
        lineHeight: 16
    }
})

function openTerminal(dom, id) {
    terminal.open(dom)
    terminal.loadAddon(fitAddon)
    terminal.write('Welcome to use HUA-SSH\r\n')
    // terminal.onKey()
    terminal.onData(msg => {
        ipcRenderer.send('instruction', {
            id: id,
            'instruction': msg
        })
    })
    fit(560)
}

ipcRenderer.on('terminal', (event, arg) => {
    openTerminal(document.getElementById('terminal'), arg)
})

ipcRenderer.on('instruction-reply', (event, arg) => {
    terminal.write(arg)
})

ipcRenderer.on('resize', (event, arg) => {
    let height
    if (arg.isMax) {
        height = arg.height - 25
    } else {
        height = arg.height - 40
    }
    fit(height)
})

function fit(height) {
    setTimeout(function () {
        document.getElementsByClassName('xterm-viewport')[0].style.width =
            document.body.offsetWidth + 'px'
        document.getElementsByClassName('terminal')[0].style.height =
            height + 'px'
        const canvasAry = document.getElementsByTagName('canvas')
        for (const canvas of canvasAry) {
            canvas.style.height = height + 'px'
        }
        fitAddon.fit()
    }, 100)
}
