import React from 'react';
import './index.less';

import SearchBar from './SearchBar';

class AppHeader extends React.Component {

	constructor(props: any) {
		super(props);
		this.state = {
		};
	}

	render () {
		return (<>
			<a href="/" className="App-link">
				<img
				alt="Pokéball Logo"
				src={process.env.PUBLIC_URL + '/noun_Pokeball_227399.svg'}
				width="40"
				height="40"
				className="d-inline-block align-center"
				/>{'  '}
				PokéSandbox
			</a>
			<div className="App-search-bar">
				<SearchBar />
			</div>
	  	</>)
	}
}

export default AppHeader;
