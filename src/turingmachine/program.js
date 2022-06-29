export default class Program {

    constructor() {
        this.tape = null;
        this.head = null;
        this.state = null;
        this.module = null;

        this.onInit = [];
        this.onStart = [];
        this.onChangeTape = [];
        this.onChangeHead = [];
        this.onChangeState = [];
        this.onBeforeTransition = [];
        this.onAfterTransition = [];
        this.onHalt = [];

        this.setTape(new Tape());
        this.setHead(0);
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

    setState(state) {
        let previous = this.state;
        this.state = state;
        let next = this.state;
        for (let callback of this.onChangeState) {
            callback(previous, next);
        }
    }

    setModule(module) {
        let previous = this.module;
        this.module = module;
        let next = this.module;
        for (let callback of this.onInit) {
            callback(previous, next);
        }
    }

    run() {
        this.state = this.module.start;
        for (let callback of this.onStart) {
            callback();
        }
    }

    cur() {
        return this.module.states[this.state];
    }

    read() {
        return this.tape.at(this.head);
    }

    transition() {
        let cur = this.state;
        let read = this.read();
        return this.module.transition(cur, read);
    }

    halted() {
        return this.transition() === null;
    }

    step() {
        if (!this.halted()) {
            let t = this.transition();

            for (let callback of this.onBeforeTransition) {
                callback(t);
            }

            this.tape.replace(this.head, t.replace);

            switch (t.move) {
            case 'left':
                this.setHead(this.head - 1);
                break;
            case 'right':
                this.setHead(this.head + 1);
                break;
            }

            this.setState(t.next);

            for (let callback of this.onAfterTransition) {
                callback(t);
            }
        }
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
                contents += '.';
            }
        }
        return contents;
    }

    static fromString(input) {
        let tape = new Tape();
        for (let i = 0; i < input.length; i++) {
            if (input[i] !== ' ') {
                tape.replace(i, input[i]);
            }
        }
        return tape;
    }

}

