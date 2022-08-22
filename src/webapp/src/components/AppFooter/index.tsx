import React from 'react';
import './index.less';

class AppFooter extends React.Component {

	constructor(props: any) {
		super(props);
		this.state = {
		};
	}

	render () {
		return (<>
        <p>
          Pokémon Copyright © 1995-2022 Nintendo/Creatures Inc./GAME FREAK Inc
        </p>
        <p>
          Fables of Arc is not affiliated with Nintendo, Creatures Inc. and GAME FREAK Inc.
        </p>
        </>)
	}
}

export default AppFooter;
