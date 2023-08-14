/*
INSTRUCTION SET
00: NOP
01: Push A to stack
02: Pop A from stack
03: Push PC to stack
04: Pop PC from stack
05: Swap A and B
06: Swap B and C
07: Do the next instruction only if F[0] is 1
08: Do the next instruction only if F[1] is 1
09: Do the next instruction only if F[2] is 1
1V: Set A to the value at address V
2V: Set the value at address V to A
3V: Compare A to V, put result in F[2]
4V: Add the value at V to A, put the carry in F[0]
5V: Subtract V from A, put the carry in F[0], put the negative in F[1]
6V: Bitwise AND  V with A
7V: Bitwise XOR V with A
8V: Bitwise OR V with A
9V: Bitwise NOT A
AV: Set A to V
BV: Set PC to V
CV: Set SP to V
*/


const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    theme: "theme-dark",
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: true,
    lineWrapping: true,
    autofocus: true,
    firstLineNumber: 0,
    lineNumberFormatter: (line) => {
        let l = line.toString(16);
        return "0x" + (l.length == 1 ? "0" : "") + l;
    },
    extraKeys: {
        "Ctrl-Enter": () => {
            computer.reset();
            computer.load(editor.getDoc().getValue());
            computer.run();
        },
        "Ctrl-S": () => {
            localStorage.setItem("code", editor.getDoc().getValue())
        }
    }
});

if (localStorage.getItem("code")) {
    editor.getDoc().setValue(localStorage.getItem("code"))
} else {
    editor.getDoc().setValue(`0xD\n0x1\n0x0\n0x1\n0xB\n0x0`)
}

const style = {
    primary: "#ec3750",
    secondary: "#8492a6",
    tertiary: "#33d6a6",
    pixelSize: 20,
    xOffset: 35,
    yOffset: 10,
    borderRadius: 12,
}

let viewState = {
    memScroll: 0,
    mouseX: 0,
    mouseY: 0,
}

canvas.addEventListener('wheel', function(e) {
    if (viewState.mouseX < style.pixelSize * 8.3 && viewState.mouseX > 0) {
        viewState.memScroll -= e.deltaY
        viewState.memScroll = Math.max(Math.min(viewState.memScroll, 0), -style.pixelSize * (256 - 32))
        computer.canvasDump()
    }
})

canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect()
    viewState.mouseX = e.clientX - rect.left
    viewState.mouseY = e.clientY - rect.top
    computer.canvasDump()
})

class Button {
    constructor(x, y, w, h, text, callback, color) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.text = text
        this.callback = callback
        this.color = color
    }
    draw() {
        ctx.font = "bold 20px Monospace"
        ctx.textAlign = "center"
        ctx.lineWidth = 2
        ctx.strokeStyle = this.color
        ctx.beginPath()
        ctx.roundRect(this.x, this.y, this.w, this.h, style.borderRadius)
        ctx.stroke()
        ctx.fillStyle = this.color
        ctx.fillText(this.text, this.x + this.w/2, this.y + this.h/2 + 6)
    }
}

const buttons = [
    new Button(300, 10, 80, 30, "RUN", () => {
        computer.reset();
        computer.load(editor.getDoc().getValue());
        computer.run();
    }, style.primary),
    new Button(400, 10, 80, 30, "CLK++", () => {if (1/(computer.clockSpeed/1000) < 128) computer.clockSpeed /= 2}, style.primary),
    new Button(500, 10, 80, 30, "CLK--", () => {if (1/(computer.clockSpeed/1000) > 0.5) computer.clockSpeed *= 2}, style.primary)
]

canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    for (let button of buttons) {
        if (x > button.x && x < button.x + button.w && y > button.y && y < button.y + button.h) {
            button.callback()
        }
    }
})

class Computer {
    constructor() {
        this.memory = new Array(256).fill(0x0);
        this.PC = 0xf;
        this.A = 0x0;
        this.B = 0x0;
        this.C = 0x0;
        this.SP = 0x0;
        this.F = [0x0, 0x0, 0x0, 0x0];
        this.clockSpeed = 500;
        this.haltRequest = false;
        // Carry, Negative, Equal, Error
    }
    reset() {
        this.memory = new Array(256).fill(0x0);
        this.PC = 0xf;
        this.A = 0x0;
        this.B = 0x0;
        this.C = 0x0;
        this.SP = 0x0;
        this.F = [0x0, 0x0, 0x0, 0x0];
        this.haltRequest = true;
    }
    fetch() {
        return [this.memory[this.PC++], this.memory[this.PC++]];
    }
    load(program) {
        program = program.split("\n");
        for (let i = 0; i < program.length; i++) {
            let hex = eval(program[i].toLowerCase());
            console.log(hex)
            this.memory[i + 0xf] = hex;
        }
    }
    memoryDump() {
        console.log(this.memory);
    }
    emojiDump() {
        let output = ""
        for (let i in this.memory) {
            let nibble = this.memory[i]
            let bits = nibble.toString(2).split('');
            let emojiBits = ""
            for (let bit of bits) {
                emojiBits += bit=='1' ? '🟥' : '⬛'
            }            
            emojiBits = '⬛'.repeat(4 - bits.length) + emojiBits
            if (i == this.PC) emojiBits += " <-- PC"
            if (i == this.SP) emojiBits += " <-- SP"
            output += (emojiBits + "\n")
        }
        console.log(output)
    }
    canvasDump() {
        ctx.font = "bold 20px Monospace"

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let button of buttons) {
            button.draw()
        }
        ctx.textAlign = "left"
        for (let i = 0x0; i < this.memory.length; i++) {
            let nibble = this.memory[i]
            let bits = nibble.toString(2);
            bits = '0'.repeat(4 - bits.length) + bits
            for (let j in bits) {
                let bit = bits[j]

                if (bit == '1') {
                    if (i == this.PC || i == this.PC + 1) {
                        ctx.fillStyle = style.secondary
                    } else if (i < this.SP) {
                        ctx.fillStyle = style.tertiary
                    } else {
                        ctx.fillStyle = style.primary
                    }
                    ctx.beginPath()
                    ctx.roundRect(style.xOffset + j*style.pixelSize, viewState.memScroll + style.yOffset + i*style.pixelSize, style.pixelSize, style.pixelSize, style.borderRadius)
                    ctx.fill()
                }
            }
            ctx.fillStyle = style.primary//(i == this.PC) ? style.secondary : ((i == this.SP) ? style.tertiary : style.primary)
            let stringified = i.toString(16)
            stringified = stringified.length == 1 ? "0" + stringified : stringified
            ctx.beginPath()
            ctx.fillText(stringified, 5, viewState.memScroll + style.yOffset + i*style.pixelSize + style.pixelSize/2 + 6)
            ctx.fill()
        }

        let PCPos = viewState.memScroll + style.yOffset + style.pixelSize * this.PC + style.pixelSize - 4
        let SPPos = viewState.memScroll + style.yOffset + style.pixelSize * this.SP + style.pixelSize - 4


        ctx.lineWidth = 2
        ctx.fillStyle = style.secondary
        ctx.beginPath()
        ctx.fillText("*PC", style.xOffset + style.pixelSize * 4.2, PCPos)
        ctx.fill()

        ctx.strokeStyle = style.secondary
        ctx.beginPath()
        ctx.roundRect(style.xOffset, viewState.memScroll + style.yOffset + style.pixelSize * this.PC, style.pixelSize * 4, style.pixelSize * 2, style.borderRadius)
        ctx.stroke()

        ctx.fillStyle = style.tertiary
        ctx.beginPath()
        ctx.fillText("*SP", (this.SP == this.PC ? 30 : 0) + style.xOffset + style.pixelSize * 4.2, SPPos)
        ctx.fill()

        ctx.strokeStyle = style.tertiary
        ctx.beginPath()
        ctx.roundRect(style.xOffset, viewState.memScroll + style.yOffset + style.pixelSize * this.SP, style.pixelSize * 4, style.pixelSize, style.borderRadius)
        ctx.stroke()

        ctx.strokeStyle = style.primary
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.moveTo(style.pixelSize * 8.3, 0)
        ctx.lineTo(style.pixelSize * 8.3, style.yOffset + style.pixelSize * 33)
        ctx.stroke()
        ctx.lineWidth = 2

        this.renderRegister(this.A, "A", 180, 0, style.primary)
        this.renderRegister(this.B, "B", 180, 30, style.secondary)
        this.renderRegister(this.C, "C", 180, 60, style.secondary)
        this.renderRegister(this.PC, "PC", 180, 90, style.secondary, 1)
        this.renderRegister(this.SP, "SP", 180, 140, style.tertiary)
        this.renderFlag(this.F[0], "CAR", 180, 170, style.primary)
        this.renderFlag(this.F[1], "NEG", 180, 200, style.primary)
        this.renderFlag(this.F[2], "EQU", 180, 230, style.primary)
        this.renderFlag(this.F[3], "ERR", 180, 260, style.primary)

        ctx.fillStyle = style.primary
        ctx.beginPath()
        let Hz = Math.round(100/(computer.clockSpeed / 1000))/100
        ctx.fillText("CLK: " + Hz + "Hz" + (Hz >= 128 ? " MAX" : (Hz <= 0.5 ? " MIN" : "")), 400, 70)

        let PCPointerXOff = 4.2
        if (PCPos < (0 - style.pixelSize*2)) {
            ctx.strokeStyle = style.secondary
            ctx.beginPath()
            ctx.moveTo(style.xOffset + style.pixelSize * PCPointerXOff, 0)
            ctx.lineTo(style.xOffset + style.pixelSize * PCPointerXOff + 10, 15)
            ctx.lineTo(style.xOffset + style.pixelSize * PCPointerXOff - 10, 15)
            ctx.lineTo(style.xOffset + style.pixelSize * PCPointerXOff, 0)
            ctx.stroke()
        } else if (PCPos > canvas.height) {
            ctx.strokeStyle = style.secondary
            ctx.beginPath()
            ctx.moveTo(style.xOffset + style.pixelSize * PCPointerXOff, canvas.height)
            ctx.lineTo(style.xOffset + style.pixelSize * PCPointerXOff + 10, canvas.height - 15)
            ctx.lineTo(style.xOffset + style.pixelSize * PCPointerXOff - 10, canvas.height - 15)
            ctx.lineTo(style.xOffset + style.pixelSize * PCPointerXOff, canvas.height)
            ctx.stroke()
        }
        let SPPointerXOff = 1.5
        if (SPPos < (0 - style.pixelSize*2)) {
            ctx.strokeStyle = style.tertiary
            ctx.beginPath()
            ctx.moveTo(style.xOffset + style.pixelSize * SPPointerXOff, 0)
            ctx.lineTo(style.xOffset + style.pixelSize * SPPointerXOff + 10, 15)
            ctx.lineTo(style.xOffset + style.pixelSize * SPPointerXOff - 10, 15)
            ctx.lineTo(style.xOffset + style.pixelSize * SPPointerXOff, 0)
            ctx.stroke()
        } else if (SPPos > canvas.height) {
            ctx.strokeStyle = style.tertiary
            ctx.beginPath()
            ctx.moveTo(style.xOffset + style.pixelSize * SPPointerXOff, canvas.height)
            ctx.lineTo(style.xOffset + style.pixelSize * SPPointerXOff + 10, canvas.height - 15)
            ctx.lineTo(style.xOffset + style.pixelSize * SPPointerXOff - 10, canvas.height - 15)
            ctx.lineTo(style.xOffset + style.pixelSize * SPPointerXOff, canvas.height)
            ctx.stroke()
        }
    }

    renderRegister(value, name, x, y, col, height=0) {
        ctx.fillStyle = col
        ctx.strokeStyle = col
        ctx.beginPath()
        ctx.fillText(name, x + style.pixelSize * 4.5, style.yOffset + style.pixelSize * 0 + style.pixelSize - 4 + y)
        ctx.fill()
        ctx.beginPath()
        ctx.roundRect(x, style.yOffset + y, style.pixelSize * 4, style.pixelSize + height * style.pixelSize, style.borderRadius)
        ctx.stroke()
        let bits = value.toString(2);
        for (let j in bits) {
            let bit = bits[j]
            if (bit == '1') {
                ctx.beginPath()
                ctx.roundRect(x + (j%4)*style.pixelSize, style.yOffset + y + height + Math.floor(j/4)*style.pixelSize, style.pixelSize, style.pixelSize, style.borderRadius)
                ctx.fill()
            }
        }
    }

    renderFlag(value, name, x, y, col) {
        ctx.fillStyle = col
        ctx.strokeStyle = col
        ctx.beginPath()
        ctx.fillText(name, x + style.pixelSize * 1.5, style.yOffset + style.pixelSize * 0 + style.pixelSize - 4 + y)
        ctx.fill()
        ctx.beginPath()
        ctx.roundRect(x, style.yOffset + y, style.pixelSize, style.pixelSize, style.borderRadius)
        ctx.stroke()
        if (value == 1) {
            ctx.beginPath()
            ctx.roundRect(x, style.yOffset + y, style.pixelSize, style.pixelSize, style.borderRadius)
            ctx.fill()
        }
    }

    run() {
        setTimeout(() => {
            this.step();
            if (!this.haltRequest) {
                this.run()
            } else {
                this.haltRequest = false
            }
        }, this.clockSpeed);
    }
    step() {
        this.PC %= 0xff
        this.canvasDump()
        const [opcode, operand] = this.fetch();
        console.log("Opcode:", opcode, "Operand:", operand)
        switch (opcode) {
            case 0x0:
                switch (operand) {
                    case 0x0:
                        break;
                    case 0x1:
                        if (this.SP == 0xe) {
                            this.F[3] = 1
                            break;
                        }
                        this.memory[this.SP++] = this.A
                        break;
                    case 0x2:
                        if (this.SP == 0x0) {
                            this.F[3] = 1
                            break;
                        }
                        this.A = this.memory[this.SP--]
                        break;
                    case 0x3:
                        if (this.SP == 0xe) {
                            this.F[3] = 1
                            break;
                        }
                        this.memory[this.SP++] = this.PC
                        break;
                    case 0x4:
                        if (this.SP == 0x0) {
                            this.F[3] = 1
                            break;
                        }
                        this.PC = this.memory[this.SP--]
                        break;
                    case 0x5:
                        [this.A, this.B] = [this.B, this.A]
                        break;
                    case 0x6:
                        [this.B, this.C] = [this.C, this.B]
                        break;
                    case 0x7:
                        if (this.F[0] == 1) this.PC += 0x2
                    break;
                    case 0x8:
                        if (this.F[1] == 1) this.PC += 0x2
                    break;
                    case 0x9:
                        if (this.F[2] == 1) this.PC += 0x2
                    break;
                    case 0xA:
                        this.A += this.B
                        this.F[0] = this.A > 0xf
                        this.A %= 0xf
                    break;
                    case 0xB:
                        this.A += this.C
                        this.F[0] = this.A > 0xf
                        this.A %= 0xf

                    default:
                        console.log("Invalid operand: ", operand)
                        break;
                }
                break
            case 0x1:
                this.A = this.memory[operand]
                break;
            case 0x2:
                this.memory[operand] = this.A
                break;
            case 0x3:
                this.F[2] = this.A == operand
                break;
            case 0x4:
                this.A += this.memory[operand]
                this.F[0] = this.A > 0xf
                this.A %= 0xf
                break;
            case 0x5:
                this.A -= operand
                this.F[0] = this.A < 0
                this.F[1] = this.A < 0
                this.A %= 0xf
                break;
            case 0x6:
                this.A &= operand
                break;
            case 0x7:
                this.A ^= operand
                break;
            case 0x8:
                this.A |= operand
                break;
            case 0x9:
                this.A = ~this.A
                break;
            case 0xA:
                this.A = operand
                break;
            case 0xB:
                this.PC = operand + 0xf
                break;
            case 0xC:
                this.SP = operand
                break;
            case 0xD:
                this.A += operand
                this.F[0] = this.A > 0xf
                this.A %= 0xf
                break;
            case 0xE:
                this.A -= operand
                this.F[0] = this.A < 0
                this.F[1] = this.A < 0
                this.A %= 0xf
                break;
            case 0xF:
                this.f[2] = this.A == operand
            default:
                console.log("Invalid opcode:", opcode)
                break;
        }
        //this.emojiDump()
       // console.log(this.A, this.PC, this.SP)

    }
}

const computer = new Computer();
computer.canvasDump();
/*computer.load([
    0xD, 0x1, // Add 1 to A
    0x0, 0x1, // Push A to stack
    0xB, 0x0, // Set PC to 0x1f
]);*/
computer.run();