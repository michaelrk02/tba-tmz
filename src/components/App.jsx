import React from 'react';

import Program, {Tape} from '../turingmachine/program.js';
import Module from '../turingmachine/module.js';
import Rule from '../turingmachine/rule.js';

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            input: '',
            tape: '',
            machineState: null,
            machineHead: null,
            machineRead: null
        };

        this.clock = null;
        this.program = new Program();

        let rules = [
            new Rule('q0', 'a', 'x', 'right', 'q1'),
            new Rule('q0', 'y', 'y', 'right', 'q4'),
            new Rule('q1', 'a', 'a', 'right', 'q1'),
            new Rule('q1', 'y', 'y', 'right', 'q1'),
            new Rule('q1', 'b', 'y', 'right', 'q2'),
            new Rule('q2', 'b', 'b', 'right', 'q2'),
            new Rule('q2', 'z', 'z', 'right', 'q2'),
            new Rule('q2', 'c', 'z', 'left', 'q3'),
            new Rule('q3', 'z', 'z', 'left', 'q3'),
            new Rule('q3', 'b', 'b', 'left', 'q3'),
            new Rule('q3', 'y', 'y', 'left', 'q3'),
            new Rule('q3', 'a', 'a', 'left', 'q3'),
            new Rule('q3', 'x', 'x', 'right', 'q0'),
            new Rule('q4', 'y', 'y', 'right', 'q4'),
            new Rule('q4', 'b', 'y', 'right', 'q5'),
            new Rule('q4', 'z', 'z', 'right', 'q7'),
            new Rule('q5', 'b', 'b', 'right', 'q5'),
            new Rule('q5', 'z', 'z', 'right', 'q5'),
            new Rule('q5', 'c', 'z', 'left', 'q6'),
            new Rule('q6', 'z', 'z', 'left', 'q6'),
            new Rule('q6', 'b', 'b', 'left', 'q6'),
            new Rule('q6', 'y', 'y', 'right', 'q4'),
            new Rule('q7', 'z', 'z', 'right', 'q7'),
            new Rule('q7', 'c', 'z', 'right', 'halt')
        ];
        this.module = new Module('q0', rules);

        this.program.setTape(Tape.fromString('aaabbbbbcccccc'));
        this.program.setModule(this.module);

        this.program.onChangeState.push((function(previous, next) {
            this.setState({machineState: next});
        }).bind(this));

        this.program.onChangeHead.push((function(previous, next) {
            this.setState({
                machineHead: next,
                machineRead: this.program.read()
            });
        }).bind(this));

        this.program.onAfterTransition.push((function(t) {
            this.setState({tape: this.program.tape.toString(true, this.program.head)});
        }).bind(this));

        this.onStart = this.onStart.bind(this);

        this.state.tape = this.program.tape.toString(true, this.program.head);
        this.state.machineState = this.program.state;
        this.state.machineHead = this.program.head;
    }

    render() {
        const panelInformation = (
            <div>
                <div className="p-2">
                    <div className="tmz-display-port">
                        <h6 className="text-center">MODULE</h6>
                        <div className="tmz-display text-center">unnamed</div>
                    </div>
                </div>
                <div className="flex justify-between2">
                    <div className="flex-auto w-full p-2">
                        <div className="tmz-display-port w-full">
                            <h6 className="text-center">STATE</h6>
                            <div className="tmz-display text-center">{this.state.machineState === null ? 'NULL' : this.state.machineState}</div>
                        </div>
                    </div>
                    <div className="flex-auto w-full p-2">
                        <div className="tmz-display-port w-full">
                            <h6 className="text-center">HEAD</h6>
                            <div className="tmz-display text-center">{this.state.machineHead}</div>
                        </div>
                    </div>
                    <div className="flex-auto w-full p-2">
                        <div className="tmz-display-port w-full">
                            <h6 className="text-center">READ</h6>
                            <div className="tmz-display text-center">{this.state.machineRead === null ? 'BLANK' : this.state.machineRead}</div>
                        </div>
                    </div>
                </div>
            </div>
        );

        const panelButtons = (
            <div className="flex justify-between">
                <div className="flex-auto w-full p-2"><button className="tmz-button w-full" type="button">CONFIGURE</button></div>
                <div className="flex-auto w-full p-2"><button className="tmz-button w-full" type="button" onClick={this.onStart}>START</button></div>
            </div>
        );

        const tapeCells = [];
        for (let i = 0; i < this.state.tape.length; i++) {
            let cell = (this.program.head == this.program.tape.absolute(i)) ? (<span className="tmz-display-cell-head">{this.state.tape[i]}</span>) : (<span>{this.state.tape[i]}</span>);
            tapeCells.push(cell);
        }

        const tapeDisplay = (
            <div>
                {tapeCells}
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
                                <div className="tmz-display overflow-auto" style={{height: '300px'}}>{tapeDisplay}</div>
                            </div>
                        </div>
                        <div className="p-3 w-full">
                            <div className="tmz-panel w-full">
                                <h5 className="text-center">CONTROL PANEL</h5>
                                <div>{panelInformation}</div>
                                <div>{panelButtons}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    onStart() {
        this.program.run();
        this.clock = setInterval((function() {
            if (this.program.halted()) {
                clearInterval(this.clock);
                return;
            }
            this.program.step();
        }).bind(this), 200)
    }

}

