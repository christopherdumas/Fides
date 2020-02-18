import React, { FormEvent } from 'react';
import './App.css';
import * as database from './DataOperations';
import CSS from 'csstype';

interface UIProps {
    user: string,
    editible: boolean
}

interface UIState {
    info?: { name: string, photo: string, email: string, bio?: string, score: number },
    showBanner: boolean
}

export class UserInformation extends React.Component<UIProps, UIState> {
    constructor(props: UIProps) {
        super(props);
        this.state = { showBanner: false };
    }

    componentDidMount() {
        database.fireapp.database()
            .ref('/people/' + this.props.user).on('value', snapshot => {
                this.setState({ info: Object.assign(snapshot.val().metadata, { score: snapshot.val().score }) });
            })
    }

    handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        database.fireapp.database()
            .ref('/people/' + this.props.user + '/metadata')
            .set(Object.assign(this.state.info, { score: null }));

        this.setState({ showBanner: true });
        setTimeout(_ => this.setState({ showBanner: false }), 3500);
    }
    handleChange(event: any, data: string) {
        this.setState({
            info: Object.assign(this.state.info, { [data]: event.target.value })
        });
    }

    render() {
        const inputStyle: CSS.Properties = {
            float: 'right'
        };
        const groupStyle: CSS.Properties = {
            display: 'block',
            height: '50px'
        };
        const score = this.state.info?.score || 0.00;
        const scoreColor = score > 1 ? 'success' : score < 0.04 ? 'danger' : 'warning';
        let internals = (
            <div>
                <h2>Edit Profile Information</h2>
                <form onSubmit={this.handleSubmit}>
                    <div className="form-group row">
                        <label htmlFor="name" className="col-sm-2 col-form-label">Display name</label>
                        <div className="col-sm-10">
                            <input className="form-control" type="text" placeholder="Display name" id="name"
                                aria-describedby="nameHelp"
                                value={this.state.info?.name}
                                onChange={e => this.handleChange(e, 'name')} />
                            <small id="nameHelp" className="form-text text-muted">
                                This is public, but should not be a pseudonym.
                        </small>
                        </div>
                    </div>

                    <div className="form-group row">
                        <label htmlFor="email" className="col-sm-2 col-form-label">Email address</label>
                        <div className="col-sm-10">
                            <input className="form-control" type="email" placeholder="Public email address" id="email"
                                aria-describedby="emailHelp"
                                value={this.state.info?.email}
                                onChange={e => this.handleChange(e, 'email')} />
                            <small id="emailHelp" className="form-text text-muted">
                                This is your public email address. The one that Fides uses to identify you is secret. Make this blank if you want.
                </small>
                        </div>
                    </div>

                    <div className="form-group row">
                        <label htmlFor="image" className="col-sm-2 col-form-label">Avatar URL</label>
                        <div className="col-sm-10">
                            <input className="form-control" type="url" placeholder="Avatar URL" id="image"
                                aria-describedby="imageHelp"
                                value={this.state.info?.photo}
                                onChange={e => this.handleChange(e, 'photo')} />
                            <small id="imageHelp" className="form-text text-muted">
                                Hosting/uploading will be offered soon.
                </small>
                        </div>
                    </div>

                    <div className="form-group row">
                        <label htmlFor="bio" className="col-sm-2 col-form-label">Biography</label>
                        <div className="col-sm-10">
                            <textarea className="form-control" placeholder="Useful information about yourself. Keep it short!" id="bio"
                                value={this.state.info?.bio}
                                onChange={e => this.handleChange(e, 'bio')} />
                        </div>
                    </div>
                    <br />
                    <input className="btn btn-primary" type="submit" value="Submit" />
                    <br />
                    {this.state.showBanner ?
                        <div className="alert alert-success" role="alert"> Info successfully updated! </div> : null}
                </form>
            </div>
        );
        if (!this.props.editible) {
            internals = (
                <div>
                    <div className="form-group row">
                        <label htmlFor="name" className="col-sm-2 col-form-label">Display name</label>
                        <div className="col-sm-10">
                            <input className="form-control-plaintext" readOnly type="text"
                                placeholder="Display name" id="name"
                                value={this.state.info?.name} />
                        </div>
                    </div>

                    <div className="form-group row">
                        <label htmlFor="email" className="col-sm-2 col-form-label">Email address</label>
                        <div className="col-sm-10">
                            <input className="form-control-plaintext" readOnly type="email"
                                placeholder="Public email address" id="email"
                                value={this.state.info?.email} />
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div style={{ margin: '10px auto', width: '80%' }}>
                <div className="card mx-auto" style={{ width: '18rem' }}>
                    <div className="card-body" style={{ textAlign: 'center' }}>
                        <h5 className="card-title" style={{ fontVariant: 'small-caps' }}>SCORE</h5>
                        <h1><span className={`badge badge-${scoreColor}`}>{this.state.info?.score}</span></h1>
                    </div>
                </div>
                <br />
                {internals}
            </div>
        );
    }
}
