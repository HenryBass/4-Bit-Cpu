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

class Computer {
    constructor() {
        this.memory = new Array(32).fill(0x0);
        this.PC = 0xf;
        this.A = 0x0;
        this.B = 0x0;
        this.C = 0x0;
        this.SP = 0x0;
        this.F = [0x0, 0x0, 0x0, 0x0];
        this.clockSpeed = 500;
        // Carry, Negative, Equal, Error
    }
    reset() {
        this.memory = new Array(32).fill(0x0);
        this.PC = 0xf;
        this.A = 0x0;
        this.B = 0x0;
        this.C = 0x0;
        this.SP = 0x0;
        this.F = [0x0, 0x0, 0x0, 0x0];
    }
    fetch() {
        return [this.memory[this.PC++], this.memory[this.PC++]];
    }
    load(program) {
        for (let i = 0; i < program.length; i++) {
            this.memory[i + 0xf] = program[i];
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
        const primary = "#ec3750";
        const secondary = "#8492a6";
        const tertiary = "#33d6a6"
        const pixelSize = 20;
        const xOffset = 35;
        const yOffset = 10;

        ctx.font = "bold 20px Monospace"

        const borderRadius = 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0x0; i < this.memory.length; i++) {
            let nibble = this.memory[i]
            let bits = nibble.toString(2);
            bits = '0'.repeat(4 - bits.length) + bits
            console.log(bits)
            for (let j in bits) {
                let bit = bits[j]

                if (bit == '1') {
                    if (i == this.PC || i == this.PC + 1) {
                        ctx.fillStyle = secondary
                    } else if (i < this.SP) {
                        ctx.fillStyle = tertiary
                    } else {
                        ctx.fillStyle = primary
                    }
                    ctx.beginPath()
                    ctx.roundRect(xOffset + j*pixelSize, yOffset + i*pixelSize, pixelSize, pixelSize, borderRadius)
                    ctx.fill()
                }
            }
            ctx.fillStyle = secondary
            let stringified = i.toString(16)
            stringified = stringified.length == 1 ? "0" + stringified : stringified
            ctx.beginPath()
            ctx.fillText(stringified, 5, yOffset + i*pixelSize + pixelSize/2 + 4)
            ctx.fill()
        }
        ctx.lineWidth = 2
        ctx.fillStyle = secondary
        ctx.beginPath()
        ctx.fillText("PC", xOffset + pixelSize * 4.5, yOffset + pixelSize * this.PC + pixelSize - 4)
        ctx.fill()

        ctx.strokeStyle = secondary
        ctx.beginPath()
        ctx.roundRect(xOffset, yOffset + pixelSize * this.PC, pixelSize * 4, pixelSize * 2, borderRadius)
        ctx.stroke()

        ctx.fillStyle = tertiary
        ctx.beginPath()
        ctx.fillText("SP", (this.SP == this.PC ? 30 : 0) + xOffset + pixelSize * 4.5, yOffset + pixelSize * this.SP + pixelSize - 4)
        ctx.fill()

        ctx.strokeStyle = tertiary
        ctx.beginPath()
        ctx.roundRect(xOffset, yOffset + pixelSize * this.SP, pixelSize * 4, pixelSize, borderRadius)
        ctx.stroke()

    }
    run(cycles) {
        setTimeout(() => {
            this.step();
            if (cycles > 0) this.run(cycles-1);
        }, this.clockSpeed);
    }
    step() {
        const [opcode, operand] = this.fetch();
        //console.log("Opcode:", opcode, "Operand:", operand)
        switch (opcode) {
            case 0x0:
                switch (operand) {
                    case 0x0:
                        break;
                    case 0x1:
                        if (this.SP == 0xf) {
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
                        if (this.SP == 0xf) {
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

                    default:
                        console.log("Invalid operand")
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
                console.log("Invalid opcode")
                break;
        }
        this.canvasDump()
        //this.emojiDump()
        console.log(this.A, this.PC, this.SP)

    }
}

const computer = new Computer();
computer.load([
    0xD, 0x2, // Add 1 to A
    0x0, 0x1, // Push A to stack
    0xB, 0x0, // Set PC to 0x1f
]);
computer.emojiDump();
computer.run(256);