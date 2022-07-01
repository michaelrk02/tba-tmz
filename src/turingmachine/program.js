import Module from './module.js';

export default class Program {

    constructor(name, format) {
        this.name = name;
        this.tape = null;
        this.head = 0;
        this.counter = 0;
        this.routineAddress = null;
        this.routines = [];
        this.halted = true;
        this.instructionLog = [];
        this.format = format;

        this.onStart = [];
        this.onRoutineExecute = [];
        this.onRoutineClock = [];
        this.onChangeTape = [];
        this.onChangeHead = [];
        this.onChangeState = [];
        this.onBeforeTransition = [];
        this.onAfterTransition = [];
        this.onHalt = [];

        this.onAfterTransition.push((function(t) {
            this.instructionLog.push('#' + this.counter + ' [' + this.routine().name + '] ' + Program.formatTransition(t));
        }).bind(this));

        this.reset(new Tape(), 0);
    }

    state() {
        if (this.routine() === null) {
            return '<HALT>';
        }
        if (this.routine().type === 'callback') {
            return '<EXEC>';
        }
        return this.routine().state !== null ? this.routine().state : '<NULL>';
    }

    setTape(tape) {
        let previous = this.tape;
        this.tape = tape;
        let next = this.tape;
        for (let callback of this.onChangeTape) {
            callback(previous, next);
        }
    }

    setHead(head) {
        let previous = this.head;
        this.head = head;
        let next = this.head;
        for (let callback of this.onChangeHead) {
            callback(previous, next);
        }
    }

    reset(tape, head) {
        for (let routine of this.routines) {
            if (routine.type === 'module') {
                routine.state = null;
            }
        }

        this.counter = 0;
        this.routineAddress = null;
        this.halted = true;
        this.instructionLog = [];

        this.setTape(tape);
        this.setHead(head);
    }

    routine() {
        if (this.routineAddress === null) {
            return null;
        }
        if (this.routineAddress >= this.routines.length) {
            return null;
        }
        return this.routines[this.routineAddress];
    }

    run() {
        this.halted = false;
        this.counter = 0;
        for (let callback of this.onStart) {
            callback();
        }

        this.routineAddress = 0;
        this.executeRoutine();
    }

    executeRoutine() {
        if (this.routine() !== null) {
            this.routine().execute(this);
        }
    }

    running() {
        return (this.routine() !== null) && this.routine().running;
    }

    read() {
        return this.tape.at(this.head);
    }

    step() {
        if (this.routine() !== null) {
            if (!this.routine().running) {
                this.routineAddress++;
                this.executeRoutine();
                if (this.routine() === null) {
                    this.halted = true;
                    for (let callback of this.onHalt) {
                        callback();
                    }
                    return;
                }
            }
            this.counter++;
            this.routine().clock(this);
        }
    }

    static formatTransition(t) {
        const movement = {
            stay: 'S',
            left: 'L',
            right: 'R'
        };
        return t === null ? '<ROUTINE CLOCK>' : '' + t.cur + ' -> ' + t.next + ' : ' + (t.read === null ? '_' : t.read) + ' / ' + (t.replace === null ? '_' : t.replace) + ' , ' + movement[t.move];
    }

    static _addition = null;
    static addition() {
        if (Program._addition === null) {
            Program._addition = new Program('Addition', /^[+-]{2} 1*#1*$/);
            Program._addition.routines.push(new ModuleRoutine(Module.add()));
        }
        return Program._addition;
    }

    static _subtraction = null;
    static subtraction() {
        if (Program._subtraction === null) {
            Program._subtraction = new Program('Subtraction', /^[+-]{2} 1*#1*$/);
            Program._subtraction.routines.push(new ModuleRoutine(Module.sub()));
        }
        return Program._subtraction;
    }

    static _multiplication = null;
    static multiplication() {
        if (Program._multiplication === null) {
            Program._multiplication = new Program('Multiplication', /^[+-]{2}1*#1*#$/);
            Program._multiplication.routines.push(new ModuleRoutine(Module.mul()));
        }
        return Program._multiplication;
    }

    static _division = null;
    static division() {
        if (Program._division === null) {
            Program._division = new Program('Division', /^[+-]{2}1*#1*#$/);
            Program._division.routines.push(new ModuleRoutine(Module.div()));
        }
        return Program._division;
    }

    static _factorial = null;
    static factorial() {
        if (Program._factorial === null) {
            Program._factorial = new Program('Factorial', /^1+$/);
            Program._factorial.routines.push(new ModuleRoutine(Module.fac()));
        }
        return Program._factorial;
    }

    static _power = null;
    static power() {
        if (Program._power === null) {
            Program._power = new Program('Power', /^1+#1+#$/);
            Program._power.routines.push(new ModuleRoutine(Module.pow()));
        }
        return Program._power;
    }

    static _binaryLogarithm = null;
    static binaryLogarithm() {
        if (Program._binaryLogarithm === null) {
            Program._binaryLogarithm = new Program('BinaryLogarithm', /^1+#$/);
            Program._binaryLogarithm.routines.push(new ModuleRoutine(Module.log()));
        }
        return Program._binaryLogarithm;
    }

    static _celciusToKelvin = null;
    static celciusToKelvin() {
        if (Program._celciusToKelvin === null) {
            Program._celciusToKelvin = new Program('CelciusToKelvin', /^[+-]1+$/);
            Program._celciusToKelvin.routines.push(CallbackRoutine.prepareAddSub('cncadd273', 273));
            Program._celciusToKelvin.routines.push(new ModuleRoutine(Module.add()));
        }
        return Program._celciusToKelvin;
    }

    static _kelvinToCelcius = null;
    static kelvinToCelcius() {
        if (Program._kelvinToCelcius === null) {
            Program._kelvinToCelcius = new Program('KelvinToCelcius', /^[+-]1+$/);
            Program._celciusToKelvin.routines.push(CallbackRoutine.prepareAddSub('cncsub273', 273));
            Program._kelvinToCelcius.routines.push(new ModuleRoutine(Module.sub()));
        }
        return Program._kelvinToCelcius;
    }

    static _celciusToFahrenheit = null;
    static celciusToFahrenheit() {
        if (Program._celciusToFahrenheit === null) {
            Program._celciusToFahrenheit = new Program('CelciusToFahrenheit', /^[+-]1+$/);
            Program._celciusToFahrenheit.routines.push(CallbackRoutine.prepareMulDiv('cncmul9', 9));
            Program._celciusToFahrenheit.routines.push(new ModuleRoutine(Module.mul()));
            Program._celciusToFahrenheit.routines.push(CallbackRoutine.prepareMulDiv('cncdiv5', 5));
            Program._celciusToFahrenheit.routines.push(new ModuleRoutine(Module.div()));
            Program._celciusToFahrenheit.routines.push(CallbackRoutine.prepareAddSub('cncadd32', 32));
            Program._celciusToFahrenheit.routines.push(new ModuleRoutine(Module.add()));
        }
        return Program._celciusToFahrenheit;
    }

    static _fahrenheitToCelcius = null;
    static fahrenheitToCelcius() {
        if (Program._fahrenheitToCelcius === null) {
            Program._fahrenheitToCelcius = new Program('FahrenheitToCelcius', /^[+-]1+$/);
            Program._fahrenheitToCelcius.routines.push(CallbackRoutine.prepareAddSub('cncsub32', 32));
            Program._fahrenheitToCelcius.routines.push(new ModuleRoutine(Module.sub()));
            Program._fahrenheitToCelcius.routines.push(CallbackRoutine.prepareMulDiv('cncmul5', 5));
            Program._fahrenheitToCelcius.routines.push(new ModuleRoutine(Module.mul()));
            Program._fahrenheitToCelcius.routines.push(CallbackRoutine.prepareMulDiv('cncdiv9', 9));
            Program._fahrenheitToCelcius.routines.push(new ModuleRoutine(Module.div()));
        }
        return Program._fahrenheitToCelcius;
    }

    static _kelvinToFahrenheit = null;
    static kelvinToFahrenheit() {
        if (Program._kelvinToFahrenheit === null) {
            Program._kelvinToFahrenheit = new Program('KelvinToFahrenheit', /^[+-]1+$/);
            Program._kelvinToFahrenheit.routines.push(CallbackRoutine.prepareAddSub('cncsub273', 273));
            Program._kelvinToFahrenheit.routines.push(new ModuleRoutine(Module.sub()));
            Program._kelvinToFahrenheit.routines.push(CallbackRoutine.prepareMulDiv('cncmul9', 9));
            Program._kelvinToFahrenheit.routines.push(new ModuleRoutine(Module.mul()));
            Program._kelvinToFahrenheit.routines.push(CallbackRoutine.prepareMulDiv('cncdiv5', 5));
            Program._kelvinToFahrenheit.routines.push(new ModuleRoutine(Module.div()));
            Program._kelvinToFahrenheit.routines.push(CallbackRoutine.prepareAddSub('cncadd32', 32));
            Program._kelvinToFahrenheit.routines.push(new ModuleRoutine(Module.add()));
        }
        return Program._kelvinToFahrenheit;
    }

    static _fahrenheitToKelvin = null;
    static fahrenheitToKelvin() {
        if (Program._fahrenheitToKelvin === null) {
            Program._fahrenheitToKelvin = new Program('FahrenheitToKelvin', /^[+-]1+$/);
            Program._fahrenheitToKelvin.routines.push(CallbackRoutine.prepareAddSub('cncsub32', 32));
            Program._fahrenheitToKelvin.routines.push(new ModuleRoutine(Module.sub()));
            Program._fahrenheitToKelvin.routines.push(CallbackRoutine.prepareMulDiv('cncmul5', 5));
            Program._fahrenheitToKelvin.routines.push(new ModuleRoutine(Module.mul()));
            Program._fahrenheitToKelvin.routines.push(CallbackRoutine.prepareMulDiv('cncdiv9', 9));
            Program._fahrenheitToKelvin.routines.push(new ModuleRoutine(Module.div()));
            Program._fahrenheitToKelvin.routines.push(CallbackRoutine.prepareAddSub('cncadd273', 273));
            Program._fahrenheitToKelvin.routines.push(new ModuleRoutine(Module.add()));
        }
        return Program._fahrenheitToKelvin;
    }

}

export class Routine {

    constructor() {
        this.callback = function() {};
        this.type = 'unknown';
        this.name = 'unnamed';
        this.running = false;
    }

    execute(program) {
        this.running = true;
        for (let callback of program.onRoutineExecute) {
            callback(this);
        }
    }

    clock(program) {
        for (let callback of program.onRoutineClock) {
            callback(this);
        }
        this.callback(program, this);
    }

}

export class CallbackRoutine extends Routine {

    constructor(name, step) {
        super();
        this.name = 'callback:' + name;
        this.step = step;
        this.type = 'callback';
        this.callback = (function(program, routine) {
            for (let callback of program.onChangeState) {
                callback(null, null);
            }
            for (let callback of program.onBeforeTransition) {
                callback(null);
            }
            this.step(program, routine);
            for (let callback of program.onAfterTransition) {
                callback(null);
            }
        }).bind(this);
    }

    static prepareAddSub(name, rhs) {
        return new CallbackRoutine(name, function(program, routine) {
            let tape = program.tape.toString() + '#';
            for (let i = 0; i < rhs; i++) {
                tape += '1';
            }
            tape = tape[0] + '+' + ' ' + tape.substring(1);
            program.setTape(Tape.fromString(tape));
            program.setHead(0);
            routine.running = false;
        });
    }

    static prepareMulDiv(name, rhs) {
        return new CallbackRoutine(name, function(program, routine) {
            let tape = program.tape.toString() + '#';
            for (let i = 0; i < rhs; i++) {
                tape += '1';
            }
            tape = tape[0] + '+' + tape.substring(1) + '#';
            program.setTape(Tape.fromString(tape));
            program.setHead(0);
            routine.running = false;
        });
    }

}

export class ModuleRoutine extends Routine {

    constructor(module) {
        super();
        this.name = 'module:' + module.name;
        this.type = 'module';
        this.module = module;
        this.callback = (function(program, routine) {
            if (this.state === null) {
                this.state = module.start;
            }
            if (!this.halted(program)) {
                let t = this.transition(program);

                for (let callback of program.onBeforeTransition) {
                    callback(t);
                }

                program.tape.replace(program.head, t.replace);

                switch (t.move) {
                case 'left':
                    program.setHead(program.head - 1);
                    break;
                case 'right':
                    program.setHead(program.head + 1);
                    break;
                }

                this.setState(program, t.next);

                for (let callback of program.onAfterTransition) {
                    callback(t);
                }
            } else {
                this.running = false;
            }
        }).bind(this);

        this.state = null;
    }

    setState(program, state) {
        let previous = this.state;
        this.state = state;
        let next = this.state;
        for (let callback of program.onChangeState) {
            callback(previous, next);
        }
    }

    transition(program) {
        let cur = this.state;
        let read = program.read();
        return this.module.transition(cur, read);
    }

    halted(program) {
        return this.transition(program) === null;
    }

}

export class Tape {

    constructor() {
        this.cells = new Map();
    }

    at(position) {
        if (!this.cells.has(position)) {
            return null;
        }
        return this.cells.get(position);
    }

    replace(position, symbol) {
        if (symbol === null) {
            this.cells.delete(position);
            return;
        }

        this.cells.set(position, symbol);
    }

    boundaries() {
        let minPosition = Infinity;
        let maxPosition = -Infinity;
        for (let key of this.cells.keys()) {
            if (key < minPosition) {
                minPosition = key;
            }
            if (key > maxPosition) {
                maxPosition = key;
            }
        }

        return {
            min: minPosition,
            max: maxPosition
        };
    }

    absolute(position) {
        return this.boundaries().min + position;
    }

    toString() {
        let b = this.boundaries();
        let contents = '';
        for (let i = b.min; i <= b.max; i++) {
            let symbol = this.at(i);
            if (symbol !== null) {
                contents += symbol;
            } else {
                contents += ' ';
            }
        }
        return contents;
    }

    static fromString(input) {
        let tape = new Tape();
        for (let i = 0; i < input.length; i++) {
            if ((input[i] !== ' ') && (input[i] !== "\n")) {
                tape.replace(i, input[i]);
            }
        }
        return tape;
    }

}

