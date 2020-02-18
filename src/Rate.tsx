import React from 'react';
import * as database from './DataOperations';
import CSS from 'csstype';
import $ from 'jquery';
import {
    Link,
} from 'react-router-dom';
import { Contract } from './Contract';

interface RateState {
    contracts: { [uniqid: string]: database.Contract },
    currentUid: string,
    callback: () => void,
    rating: string,
    banner: JSX.Element | null
}

export class Rate extends React.Component<{}, RateState> {
    constructor(props: {}) {
        super(props);

        this.state = {
            contracts: {},
            callback: () => { },
            rating: "",
            currentUid: "",
            banner: null
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

    callHandlerWrapped = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, contract: database.Contract, targetUid: string) => {
        e.preventDefault();
        $('#rateModal').modal('show');
        this.setState({
            callback: () => {
                const rating = this.state.rating;
                if (rating) {
                    try {
                        database.review(contract, this.state.currentUid, targetUid, +rating);
                        this.setState({
                            banner: <div className="alert alert-success"><b>Success</b> Rating posted</div>
                        })
                    } catch (e) {
                        this.setState({
                            banner: <div className="alert alert-danger"><b>{e.name}</b> {e.message}</div>
                        });
                    } finally {
                        setTimeout(_ => this.setState({ banner: null }), 3500);
                    }
                }
            }
        });
    }

    render() {
        return (
            <div>
                {this.state.banner}
                <div className="modal" role="dialog" id="rateModal">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">How would you like to rate this person?</h5>
                            </div>
                            <div className="modal-body">
                                <p>Please be careful and thoughtful&mdash;this does effect how they look to other people! Also, please choose a number between ten and negative ten.</p>
                            </div>
                            <div className="modal-footer">
                                <input type="number" className="form-control"
                                    max="10"
                                    min="-10"
                                    value={this.state.rating}
                                    onChange={e => this.setState({ rating: e.target.value })} />
                                <button type="button" className="btn btn-success" data-dismiss="modal"
                                    onClick={this.state.callback.bind(this)}>Rate</button>
                                <button className="btn btn-warning" data-dismiss="modal">Nevermind</button>
                            </div>
                        </div>
                    </div>
                </div>
                <h2>Currently Active Contracts</h2>
                <div className="card-columns">
                    {Object.entries(this.state.contracts).map(([uniqid, c]) => (
                        <Contract key={uniqid} data={c} render={(users: database.Person[]) => {
                            let roles = Object.values(users).map((u: database.Person) => {
                                if (u.uid != this.state.currentUid &&
                                    c.people[u.uid].role != database.Role.Arbitrator) {
                                    return (
                                        <button key={`rate-${u.uid}`}
                                            className="btn btn-info btn-sm"
                                            onClick={e => this.callHandlerWrapped(e, c, u.uid)}>
                                            Rate {u.metadata.name}
                                        </button>
                                    );
                                }
                            });
                            return (
                                <div className="btn-group" role="role-group" aria-label="Users involved">
                                    {roles}
                                </div>
                            );
                        }} />
                    ))}
                </div>
            </div>
        );
    }
}
