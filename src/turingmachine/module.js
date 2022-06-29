export default class Module {

    constructor(start, rules) {
        this.start = start;
        this.rules = rules;
        this.states = new Map();

        for (let rule of rules) {
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
            replace: t.replace,
            move: t.move,
            next: t.next
        };
    }

    static parse(stream) {
        
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

