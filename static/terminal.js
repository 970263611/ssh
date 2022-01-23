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
        background: "#003303", //背景色
        lineHeight: 16
    }
})

function openTerminal(dom, id) {
    terminal.open(dom)
    terminal.loadAddon(fitAddon)
    terminal.write('Welcome to use HUA-SSH\r\n')
    terminal.onKey(e => {
        ipcRenderer.send('instruction', {
            id: id,
            'instruction': e.key
        })
    })
    fit()
}

ipcRenderer.on('terminal', (event, arg) => {
    openTerminal(document.getElementById('terminal'), arg)
    fit()
})

ipcRenderer.on('instruction-reply', (event, arg) => {
    terminal.write(arg)
})

function fit() {
    fitAddon.fit()
    document.getElementsByClassName('xterm-viewport')[0].style.width = '764px'
}

window.addEventListener("resize", fit)
