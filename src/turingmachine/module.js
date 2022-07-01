import Rule from './rule.js';

import M_ADD from '../modules/001-add.tmz';
import M_SUB from '../modules/002-sub.tmz';
import M_MUL from '../modules/003-mul.tmz';
import M_DIV from '../modules/004-div.tmz';
import M_FAC from '../modules/005-fac.tmz';
import M_POW from '../modules/006-pow.tmz';
import M_LOG from '../modules/007-log.tmz';

export default class Module {

    constructor(name, start, rules) {
        this.name = name;
        this.start = start;
        this.rules = rules;
        this.states = new Map();
        this.symbols = new Set();

        for (let rule of rules) {
            if (!this.symbols.has(rule.read)) {
                this.symbols.add(rule.read);
            }
            if (!this.symbols.has(rule.replace)) {
                this.symbols.add(rule.replace);
            }

            let cur = null;
            if (this.states.has(rule.cur)) {
                cur = this.states.get(rule.cur);
            } else {
                cur = new _State();
                this.states.set(rule.cur, cur);
            }

            if (!this.states.has(rule.next)) {
                this.states.set(rule.next, new _State());
            }

            cur.transition(rule.read, new _Transition(
                rule.replace,
                rule.move,
                rule.next
            ));
        }
    }

    transition(cur, read) {
        let t = this.states.get(cur).feed(read);
        if (t === null) {
            return null;
        }

        return {
            cur: cur,
            read: read,
            replace: t.replace,
            move: t.move,
            next: t.next
        };
    }

    static parse(name, source) {
        let lines = source.split("\n");
        let moduleName = null;
        let start = null;
        let rules = [];
        let number = 1;
        while (number <= lines.length) {
            let line = lines[number - 1].trim();
            if (line.length > 0) {
                if (!line.startsWith(';')) {
                    let instruction = line.match(/^([a-zA-Z0-9]+) (.) (.) ([SLRslr*]) ([a-zA-Z0-9]+)$/);
                    if (instruction !== null) {
                        const movement = {
                            '*': 'stay',
                            'l': 'left',
                            'r': 'right'
                        };
                        let cur = instruction[1];
                        let read = (instruction[2] === '_') ? null : instruction[2];
                        let replace = (instruction[3] === '_') ? null : instruction[3];
                        let move = movement[instruction[4].toLowerCase()];
                        let next = instruction[5];
                        let rule = new Rule(cur, read, replace, move, next);
                        rules.push(rule);
                    } else {
                        throw 'Invalid syntax at line ' + number + ' (reading module: ' + name + ')';
                    }
                } else {
                    let preprocessor = line.match(/^; @([a-z]+)( (.+))?$/);
                    if (preprocessor !== null) {
                        let directive = preprocessor[1];
                        let parameter = typeof(preprocessor[3]) === 'undefined' ? null : preprocessor[3];
                        if (directive === 'module') {
                            moduleName = parameter;
                            if (moduleName !== name) {
                                throw 'Invalid module name specified (found ' + moduleName + ' instead) (reading module: ' + name + ')';
                            }
                        }
                        if (directive === 'start') {
                            start = parameter;
                        }
                        if (directive === 'morphett') {
                            number++;
                        }
                    }
                }
            }
            number++;
        }
        return new Module(name, start, rules);
    }

    static _add = null;
    static add() {
        if (Module._add === null) {
            Module._add = Module.parse('add', M_ADD);
        }
        return Module._add;
    }

    static _sub = null;
    static sub() {
        if (Module._sub === null) {
            Module._sub = Module.parse('sub', M_SUB);
        }
        return Module._sub;
    }

    static _mul = null;
    static mul() {
        if (Module._mul === null) {
            Module._mul = Module.parse('mul', M_MUL);
        }
        return Module._mul;
    }

    static _div = null;
    static div() {
        if (Module._div === null) {
            Module._div = Module.parse('div', M_DIV);
        }
        return Module._div;
    }

    static _fac = null;
    static fac() {
        if (Module._fac === null) {
            Module._fac = Module.parse('fac', M_FAC);
        }
        return Module._fac;
    }

    static _pow = null;
    static pow() {
        if (Module._pow === null) {
            Module._pow = Module.parse('pow', M_POW);
        }
        return Module._pow;
    }

    static _log = null;
    static log() {
        if (Module._log === null) {
            Module._log = Module.parse('log', M_LOG);
        }
        return Module._log;
    }

}

class _State {

    constructor() {
        this.transitions = new Map();
    }

    transition(read, transition) {
        this.transitions.set(read, transition);
    }

    feed(read) {
        if (!this.transitions.has(read)) {
            return null;
        }
        return this.transitions.get(read);
    }

}

class _Transition {

    constructor(replace, move, next) {
        this.replace = replace;
        this.move = move;
        this.next = next;
    }

}

