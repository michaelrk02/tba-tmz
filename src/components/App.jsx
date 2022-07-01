import React from 'react';

import Program, {ModuleRoutine, CallbackRoutine, Tape} from '../turingmachine/program.js';
import Module from '../turingmachine/module.js';
import Rule from '../turingmachine/rule.js';

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showInstructionLog: false,
            showTransitionTable: false,
            input: '',
            initialHead: 0,
            instruction: 'NONE',
            running: false,
            paused: false,
            clockSpeed: 100,
            configure: false
        };

        this.clock = null;
        this.program = null;
        this.instructionLogDisplay = React.createRef();

        this.programs = [];
        this.programs.push(Program.addition());
        this.programs.push(Program.subtraction());
        this.programs.push(Program.multiplication());
        this.programs.push(Program.division());
        this.programs.push(Program.factorial());
        this.programs.push(Program.power());
        this.programs.push(Program.binaryLogarithm());
        this.programs.push(Program.celciusToKelvin());
        this.programs.push(Program.kelvinToCelcius());
        this.programs.push(Program.celciusToFahrenheit());
        this.programs.push(Program.fahrenheitToCelcius());
        this.programs.push(Program.kelvinToFahrenheit());
        this.programs.push(Program.fahrenheitToKelvin());

        for (let program of this.programs) {
            this.link(program);
        }

        this.onToggleInstructionLog = this.onToggleInstructionLog.bind(this);
        this.onToggleTransitionTable = this.onToggleTransitionTable.bind(this);
        this.onToggleConfigure = this.onToggleConfigure.bind(this);
        this.onStart = this.onStart.bind(this);
        this.onReset = this.onReset.bind(this);
        this.onPause = this.onPause.bind(this);
        this.onResume = this.onResume.bind(this);
        this.onProgramChange = this.onProgramChange.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.onInitialHeadChange = this.onInitialHeadChange.bind(this);
        this.onClockSpeedChange = this.onClockSpeedChange.bind(this);
    }

    load(name) {
        if (name === 'null') {
            this.program = null;
            this.forceUpdate();
            return;
        }

        for (let program of this.programs) {
            if (program.name === name) {
                this.program = program;
                this.forceUpdate();
                break;
            }
        }
    }

    reset() {
        if (this.program !== null) {
            clearInterval(this.clock);
            this.program.reset(Tape.fromString(this.state.input), this.state.initialHead);
            this.setState({running: false, paused: false});
            this.forceUpdate();
        }
    }

    link(program) {
        program.onStart.push((function() {
            this.setState({running: true});
        }).bind(this));

        program.onHalt.push((function() {
            this.setState({running: false});
        }).bind(this));

        program.onChangeTape.push((function(prev, next) {
            this.forceUpdate();
        }).bind(this));

        program.onChangeState.push((function() {
            this.forceUpdate();
        }).bind(this));

        program.onChangeHead.push((function() {
            this.forceUpdate();
        }).bind(this));

        program.onAfterTransition.push((function(t) {
            this.setState({instruction: Program.formatTransition(t)});
        }).bind(this));
    }

    render() {
        const instructionLogContents = this.program === null ? [] : this.program.instructionLog;
        const instructionLog = !this.state.showInstructionLog ? null : (
        <div className="tmz-display-port">
            <h6 className="text-center">INSTRUCTION LOG</h6>
            <div ref={this.instructionLogDisplay} className="tmz-display overflow-auto" style={{height: '200px'}}>
                {instructionLogContents.map(e => (<div>{e}</div>))}
            </div>
        </div>
        );

        let states = [];
        let symbols = [];
        let showTransitionTable = this.state.showTransitionTable && (this.program !== null) && (this.program.routine() !== null) && (this.program.routine().type === 'module');
        if (showTransitionTable) {
            for (let state of this.program.routine().module.states.keys()) {
                states.push(state);
            }
            for (let symbol of this.program.routine().module.symbols.values()) {
                symbols.push(symbol);
            }
        }
        const transitionTable = !showTransitionTable ? null : (
        <div className="tmz-display-port">
            <h6 className="text-center">TRANSITION TABLE</h6>
            <div className="tmz-display overflow-auto" style={{height: '500px'}}>
                <table className="tmz-table border-light">
                    <thead>
                        <tr>
                            <th scope="col">STATE</th>
                            {symbols.map((symbol) => (<th scrope="col">READ : {symbol === null ? '<B>' : symbol}</th>))}
                        </tr>
                    </thead>
                    <tbody>
                        {states.map((state) => (
                        <tr>
                            <th scope="row">{state}</th>
                            {symbols.map((symbol) => {
                                let transition = this.program.routine().module.transition(state, symbol);
                                if (transition !== null) {
                                    transition.replace = transition.replace === null ? '<B>' : transition.replace;
                                    transition.move = {stay: 'S', left: 'L', right: 'R'}[transition.move];
                                }
                                transition = transition === null ? '-' : '(' + transition.next + ', ' + transition.replace + ', ' + transition.move + ')';
                                return (<td>{transition}</td>);
                            })}
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        );

        const programInformation = (
        <div>
            <div className="p-2">
                <div className="tmz-display-port">
                    <h6 className="text-center">PROGRAM</h6>
                    <div className="tmz-display text-center">{(this.program !== null) ? this.program.name : 'NULL'}</div>
                </div>
            </div>
            <div className="p-2">
                <div className="tmz-display-port">
                    <h6 className="text-center">ROUTINE</h6>
                    <div className="tmz-display text-center">{this.program === null ? '<UNLOAD>' : (<span>ADDRESS {this.program.routineAddress === null ? 'NULL' : this.program.routineAddress} [{this.program.routine() === null ? 'NULL' : this.program.routine().name}]</span>)}</div>
                </div>
            </div>
            <div className="flex justify-between">
                <div className="flex-auto w-full p-2">
                    <div className="tmz-display-port w-full">
                        <h6 className="text-center">STATE</h6>
                        <div className="tmz-display text-center">{this.program === null ? '<UNLOAD>' : this.program.state()}</div>
                    </div>
                </div>
                <div className="flex-auto w-full p-2">
                    <div className="tmz-display-port w-full">
                        <h6 className="text-center">HEAD</h6>
                        <div className="tmz-display text-center">{this.program === null ? '<UNLOAD>' : this.program.head}</div>
                    </div>
                </div>
                <div className="flex-auto w-full p-2">
                    <div className="tmz-display-port w-full">
                        <h6 className="text-center">READ</h6>
                        <div className="tmz-display text-center">{this.program === null ? '<UNLOAD>' : (this.program.read() === null ? 'BLANK' : this.program.read())}</div>
                    </div>
                </div>
                <div className="flex-auto w-full p-2">
                    <div className="tmz-display-port w-full">
                        <h6 className="text-center">COUNTER</h6>
                        <div className="tmz-display text-center">{this.program === null ? '<UNLOAD>' : this.program.counter}</div>
                    </div>
                </div>
            </div>
            <div className="p-2">
                <div className="tmz-display-port w-full">
                    <h6 className="text-center">INSTRUCTION</h6>
                    <div className="tmz-display text-center">{this.state.instruction}</div>
                </div>
            </div>
        </div>
        );

        const panelInformation = (
        <div>
            {programInformation}
        </div>
        );

        let action = null;
        if (this.program !== null) {
            if (!this.state.running) {
                if (this.program.counter == 0) {
                    action = (<button className="tmz-button w-full" type="button" onClick={this.onStart}>START</button>);
                } else {
                    action = (<button className="tmz-button w-full" type="button" onClick={this.onReset}>RESET</button>);
                }
            } else {
                if (this.state.paused) {
                    action = (<button className="tmz-button w-full" type="button" onClick={this.onResume}>RESUME</button>);
                } else {
                    action = (<button className="tmz-button w-full" type="button" onClick={this.onPause}>PAUSE</button>);
                }
            }
        }

        const panelButtons = (
        <div className="flex justify-between">
            <div className="flex-auto w-full p-2"><button className={['tmz-button', 'w-full', this.state.configure ? 'tmz-button-toggled' : ''].join(' ')} type="button" onClick={this.onToggleConfigure}>CONFIGURE</button></div>
            <div className="flex-auto w-full p-2">{action}</div>
        </div>
        );

        let inputMatches = this.inputMatches();
        const inputMatch = inputMatches === null ? (<div><span className="px-2">FORMAT NONE</span></div>) : (
        <div>
            <div>
                <span className="px-2">FORMAT <span style={{color: 'yellow'}}>{this.program.format.toString()}</span></span>
                <span className="px-2">{inputMatches ? (<span style={{color: 'green'}}>MATCHES</span>) : (<span style={{color: 'red'}}>DOES NOT MATCH</span>)}</span>
            </div>
        </div>
        );

        const toolboxOptions = (
        <div>
            <div className="p-2">
                <div className="tmz-display-port">
                    <h6>LOAD</h6>
                    <div>
                        <select className="tmz-select" value={this.program === null ? 'null' : this.program.name} onChange={this.onProgramChange} disabled={this.state.running}>
                            <option value="null">-- Choose Program --</option>
                            {this.programs.map((e) => (<option value={e.name}>{e.name}</option>))}
                        </select>
                    </div>
                </div>
            </div>
            <div className="p-2">
                <div className="tmz-display-port">
                    <h6>INPUT</h6>
                    <div className="py-2"><div className="tmz-display">{inputMatch}</div></div>
                    <div className="py-2"><textarea ref={this.toolboxInput} className="tmz-input resize-y" rows="5" placeholder="Enter tape contents" value={this.state.input} onChange={this.onInputChange} disabled={this.state.running} /></div>
                </div>
            </div>
            <div className="p-2">
                <div className="tmz-display-port">
                    <h6>INITIAL HEAD</h6>
                    <div className="py-2"><input type="number" className="tmz-input" placeholder="Enter initial head position" value={this.state.initialHead} onChange={this.onInitialHeadChange} disabled={this.state.running} /></div>
                </div>
            </div>
            <div className="p-2">
                <div className="tmz-display-port">
                    <h6>CLOCK SPEED</h6>
                    <div className="py-2"><input type="number" className="tmz-input" placeholder="Enter clock speed (in milliseconds)" value={this.state.clockSpeed} onChange={this.onClockSpeedChange} disabled={this.state.running} /></div>
                </div>
            </div>
            <div className="p-2">
                <button className="tmz-button w-full" type="button" onClick={this.onReset}>RESET</button>
            </div>
        </div>
        );

        const tapeCells = [];
        if (this.program !== null) {
            let tape = this.program.tape.toString();
            for (let i = 0; i < tape.length; i++) {
                let symbol = tape[i] === ' ' ? '.' : tape[i];
                let cell = (this.program.head == this.program.tape.absolute(i)) ? (<span className="tmz-display-cell-head">{symbol}</span>) : (<span>{symbol}</span>);
                tapeCells.push(cell);
            }
        }

        const toolboxPanel = !this.state.configure ? null : (
        <div className="p-3 w-full">
            <div className="tmz-panel w-full">
                <h5 className="text-center">TOOLBOX</h5>
                <div>{toolboxOptions}</div>
            </div>
        </div>
        );

        return (
        <div>
            <div className="bg-primary text-light p-4">
                <h1 className="text-center">TMZ</h1>
                <h3 className="text-center">Turing Machine Simulator</h3>
            </div>
            <div className="py-2 flex flex-col items-center">
                <div className="w-full" style={{maxWidth: '700px'}}>
                    <div className="p-3 w-full">
                        <div className="tmz-display-port tmz-display-port-external w-full">
                            <h5 className="text-center text-dark">TAPE DISPLAY</h5>
                            <div className="tmz-display overflow-auto" style={{height: '64px'}}>{tapeCells}</div>
                            <hr />
                            <div className="py-2">
                                <label className="flex items-center text-dark">
                                    <div><input type="checkbox" checked={this.state.showInstructionLog} onChange={this.onToggleInstructionLog}/></div>
                                    <div className="px-2">Show instruction log</div>
                                </label>
                            </div>
                            <div className="py-2">
                                <label className="flex items-center text-dark">
                                    <div><input type="checkbox" checked={this.state.showTransitionTable} onChange={this.onToggleTransitionTable}/></div>
                                    <div className="px-2">Show transition table</div>
                                </label>
                            </div>
                            <div>{instructionLog}</div>
                            <div>{transitionTable}</div>
                        </div>
                    </div>
                    <div className="p-3 w-full">
                        <div className="tmz-panel w-full">
                            <h5 className="text-center">CONTROL PANEL</h5>
                            <div>{panelInformation}</div>
                            <div>{panelButtons}</div>
                        </div>
                    </div>
                    {toolboxPanel}
                </div>
            </div>
        </div>
        );
    }

    componentDidUpdate() {
        if (this.instructionLogDisplay.current !== null) {
            this.instructionLogDisplay.current.scrollTop = this.instructionLogDisplay.current.scrollHeight;
        }
    }

    inputMatches() {
        if (this.program === null) {
            return null;
        }
        return this.program.format.test(this.state.input);
    }

    onToggleInstructionLog() {
        this.setState((state) => {return {showInstructionLog: !state.showInstructionLog}});
    }

    onToggleTransitionTable() {
        this.setState((state) => {return {showTransitionTable: !state.showTransitionTable}});
    }

    onToggleConfigure() {
        this.setState((state) => {return {configure: !state.configure}});
    }

    onStart() {
        this.program.run();
        this.clock = setInterval((function() {
            if (!this.state.paused) {
                if (this.program.halted) {
                    clearInterval(this.clock);
                    return;
                }
                this.program.step();
            }
        }).bind(this), this.state.clockSpeed)
    }

    onReset() {
        this.reset();
    }

    onPause() {
        this.setState({paused: true});
    }

    onResume() {
        this.setState({paused: false});
    }

    onProgramChange(e) {
        this.load(e.target.value);
    }

    onInputChange(e) {
        this.setState({input: e.target.value});
    }

    onInitialHeadChange(e) {
        this.setState({initialHead: e.target.value});
    }

    onClockSpeedChange(e) {
        this.setState({clockSpeed: e.target.value});
    }

}

