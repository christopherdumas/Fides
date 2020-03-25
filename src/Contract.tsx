import React from 'react';
import * as database from './DataOperations';
import { Link } from 'react-router-dom';
import CSS from 'csstype';
import { UserAvatar } from './UserInformation';
import { Column, Row } from 'simple-flexbox';

interface ContractProps {
    data: database.Contract,
    currentUid?: string,
    full?: boolean,
    render?: (users: database.Person[]) => React.ReactNode,
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function autoGrow(el: any) {
    el.style.height = "55px";
    el.style.height = (el.scrollHeight) + "px";
}

export class Contract extends React.Component<ContractProps, {
    users: { [uid: string]: database.Person },
    commentText: string
}> {
    constructor(props: ContractProps) {
        super(props);
        this.state = {
            users: {},
            commentText: ""
        }
    }

    makeComment = (_: any) => {
        if (database.fireapp.auth().currentUser) {
            let el = database.fireapp.database().ref('/contracts/' + this.props.data.uniqid + '/comments').push();
            database.fireapp.database().ref('/people/' + database.fireapp.auth().currentUser?.uid).on('value', userSnap => {
                el.set({
                    p: userSnap.val(),
                    comment: this.state.commentText,
                    date: (new Date()).toString()
                });
            });
            this.setState({ commentText: "" })
        } else {
            alert("You're not signed in!");
        }
    }

    componentDidMount() {
        Object.values(this.props.data.people).forEach(contractEntry => {
            database.fireapp.database().ref('/people/' + contractEntry.uid)
                .orderByChild("metadata/name")
                .on('value', snapshot => {
                    this.setState(state => {
                        const users = Object.assign(
                            state.users,
                            { [contractEntry.uid]: snapshot.val() }
                        );
                        return {
                            users: users,
                        };
                    });
                });
        });

    }

    render() {
        const commentsSection = (
            <div className="comments" style={{ backgroundColor: "#eff", }}>
                {Object.values(this.props.data.comments || []).map((c: database.CommentEntry, i: number) =>
                    <Comment key={i} isPov={c.p.uid == database.fireapp.auth().currentUser?.uid} data={c} />)}
                <div className="input-group" style={{ padding: "15px 30px", width: "100%" }}>
                    <textarea value={this.state.commentText}
                        id="message"
                        className="form-control"
                        aria-label="Send message"
                        style={{ resize: "vertical", padding: "15px", maxHeight: "100px", height: "55px" }}
                        placeholder="Your message..."
                        onKeyPress={e => {
                            if (e.key == "Enter" && !e.shiftKey) {
                                this.makeComment(e);
                                e.preventDefault();
                            }
                        }}
                        onChange={e => {
                            autoGrow(e.target);
                            this.setState({ commentText: e.target.value });
                        }}></textarea>
                    <div className="input-group-append">
                        <button className="btn btn-outline-secondary" type="button" id="button-addon2"
                            onClick={this.makeComment}>Send</button>
                    </div>
                </div>
            </div>
        );

        // @ts-ignore: Object is possibly 'null'.
        return (
            <div>
                <div className="card m-1">
                    <div className="card-body">
                        <h5 className="card-title">
                            {this.props.full
                                ? this.props.data.title
                                : <a href={"/contract/" + this.props.data.uniqid}>{this.props.data.title}</a>}
                        </h5>
                        <h6 className="card-subtitle mb-2 text-muted">{this.props.data.deadline}</h6>
                        <p className="card-text">{this.props.data.desc}</p>
                        {!!this.props.render
                            ? this.props.render(Object.values(this.state.users))
                            : this.props.children}
                    </div>
                    <ul className="list-group list-group-flush">
                        {Object.values(this.state.users).map(u => {
                            let udata = this.props.data.people[u.uid];
                            return <li key={u.uid} className="list-group-item">
                                <b>{capitalize(this.props.data.people[u.uid].role)}:&nbsp;</b>
                                <Link style={{ color: udata.accepted ? 'green' : 'red' }} to={`/dashboard/${u.uid}`}>{u.metadata.name}</Link>
                            </li>;
                        }
                        )}
                    </ul>

                    {this.props.full ? commentsSection : null}
                </div>
            </div>
        );
    }
}

function toFuzzyTime(milliseconds: number) {
    const times: { [key: string]: number } = {
        "years": (60000 * 60 * 24) * 30 * 12,
        "months": (60000 * 60 * 24) * 30,
        "days": 60000 * 60 * 24,
        "hours": 60000 * 60,
        "mins": 60000,
    };
    let fuzzy = [];
    for (let key in times) {
        const val = Math.floor(milliseconds / times[key]);
        if (val > 0) {
            fuzzy.push((val).toString() + " " + key);
        }
        milliseconds %= times[key];
        console.log(milliseconds);
    }
    return fuzzy.join(" and ") + " ago";
}

export function Comment(props: {
    data: database.CommentEntry,
    isPov: boolean
}) {
    const imageStyle: CSS.Properties = {
        float: 'left',
        width: '32px',
        borderRadius: '50%',
        height: '32px',
        marginRight: '10px',
        display: 'block'
    };
    const fuzzyTime = toFuzzyTime(new Date().getTime() - new Date(props.data.date).getTime());
    const user = (
        <Column key="user" alignItems="center" style={{ maxWidth: "80px" }}>
            <a href={`/dashboard/${props.data.p.uid}`}>
                <UserAvatar style={imageStyle}
                    avatar={props.data.p.metadata.photo} />
            </a>
            <p className="text-muted"><small>{fuzzyTime}</small></p>
        </Column>
    );
    const comment = (
        <Column key="comment" style={{
            padding: "10px 10px 10px 10px",
        }}
            flexBasis="40%"
            className={"talk-bubble tri-right " + (!props.isPov ? "left-top" : "right-top")} >
            {
                props.data.comment.split('\n').map((item, i) => {
                    return <span key={i}>{item}<br /></span>;
                })
            }
        </Column>
    );
    console.log(!props.isPov ? "flex-start" : "flex-end");
    return (
        <Row vertical='baseline'
            horizontal={!props.isPov ? "flex-start" : "flex-end"}
            style={{
                padding: "0px 30px",
            }} className="commentrow">
            {!props.isPov ? [user, comment] : [comment, user]}
        </Row>
    );
}
