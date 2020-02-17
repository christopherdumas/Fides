import React from 'react';
import * as database from './DataOperations';
import CSS from 'csstype';
import {
    Link,
} from 'react-router-dom';

interface RateState {
    contracts: { [uniqid: string]: database.Contract },
    currentUid: string
}

export class Rate extends React.Component<{}, RateState> {
    constructor(props: {}) {
        super(props);

        this.state = {
            contracts: {},
            currentUid: ""
        }
    }

    componentDidMount() {
        database.fireapp.auth().onAuthStateChanged(user => {
            if (user) {
                this.setState({ currentUid: user.uid });
                database.fireapp.database().ref('/people/' + user.uid + '/ratings').on('value', ratingsSnap => {
                    if (ratingsSnap.val() != null) {
                        Object.keys(ratingsSnap.val()).forEach(uniqid => {
                            database.fireapp.database().ref('/contracts/' + uniqid).on('value', contractSnap => {
                                console.log(uniqid, contractSnap.val());
                                this.setState(state => {
                                    return {
                                        contracts: Object.assign(state.contracts,
                                            { [uniqid]: contractSnap.val() })
                                    };
                                });
                            });
                        });
                    }
                });
            }
        });
    }

    render() {
        return (
            <div>
                <h2>Currently Active Contracts</h2>
                {Object.entries(this.state.contracts).map(([uniqid, c]) =>
                    <Contract key={uniqid} data={c} currentUid={this.state.currentUid} />)}
            </div>
        );
    }
}

interface ContractProps {
    data: database.Contract,
    currentUid: string,
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

class Contract extends React.Component<ContractProps, { users: database.Person[] }> {
    constructor(props: ContractProps) {
        super(props);
        this.state = {
            users: []
        }
    }

    callHandlerWrapped = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, targetUid: string) => {
        e.preventDefault();
        const rating = window.prompt("What is your rating of this user?", "0");
        if (rating) {
            database.review(this.props.data, this.props.currentUid, targetUid, +rating);
        }
    }

    componentDidMount() {
        Object.values(this.props.data.people).forEach(contractEntry => {
            database.fireapp.database().ref('/people/' + contractEntry.uid)
                .orderByChild("metadata/name")
                .on('value', snapshot => {
                    this.setState(state => {
                        return {
                            users: Object.assign(state.users, { [contractEntry.uid]: snapshot.val() })
                        };
                    });
                });
        });
        console.log(this.state.users, this.props.data.people);
    }

    render() {
        const style: CSS.Properties = {
            border: '1px solid black',
            margin: '10px auto',
            width: '80%'
        };
        // @ts-ignore: Object is possibly 'null'.
        const cuid = database.fireapp.auth().currentUser.uid;
        const stylize = (u: any) => {
            return { color: this.props.data.people[u.uid].accepted ? 'green' : 'red' };
        }
        return (
            <div style={style}>
                <div>
                    <h2>{this.props.data.title}</h2>
                    <h3>Details</h3>
                    <p><b>Deadline:</b> {this.props.data.deadline}</p>
                    <p><b>Instructions:</b><br />{this.props.data.desc}</p>
                    <h3>People</h3>
                    {Object.values(this.state.users).map(u => <div>
                        <p>
                            <b>{capitalize(this.props.data.people[u.uid].role)}:&nbsp;</b>
                            <Link style={stylize(u)} to={`/dashboard/${u.uid}`}>{u.metadata.name}</Link>
                        </p>
                    </div>
                    )}
                </div>
                <div>
                    {Object.values(this.state.users).map(u => {
                        if (u.uid != this.props.currentUid &&
                            this.props.data.people[u.uid].role != database.Role.Arbitrator) {
                            return (
                                <button key={`rate-${u.uid}`}
                                    onClick={e => this.callHandlerWrapped(e, u.uid)}>
                                    Rate {u.metadata.name}
                                </button>
                            );
                        }
                    })}
                </div>
            </div>
        );
    }
}
