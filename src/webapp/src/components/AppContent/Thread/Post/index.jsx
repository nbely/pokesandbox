import React from 'react';
import './index.less';

const url = "https://i1.sndcdn.com/avatars-000651700224-nysi7a-t500x500.jpg";

class Post extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
		};
	}

	render () {
		return (<div className="Post">
            <div className="Post-title">{this.props.title}</div>
            <div className="Post-user">
                <img className="Post-avatar" src={url} alt="User Avatar"/>
                <div className="Post-username">
                    <div>{"Lord Dalmonde"}</div>
                    <div>{"Taav#4683"}</div>
                </div>
            </div>
            <div className="Post-content">{this.props.content}</div>
        </div>)
	}
}

export default Post;
