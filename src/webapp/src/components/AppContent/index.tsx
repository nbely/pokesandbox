import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './index.less';

import Home from './Home';
import Servers from './Servers';
import Server from './Server';
import Region from './Region'
import Profile from './Profile';
import Thread from './Thread';

class AppContent extends React.Component {

	constructor(props: any) {
		super(props);
		this.state = {
		};
	}

	render () {
		return (<>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/profile/:id' element={<Profile />} />
            <Route path='/servers' element={<Servers />} />
            <Route path='/server/:id' element={<Server />} />
            <Route path='/region/:id' element={<Region />} />
            <Route path='/thread' element={<Thread />} />
          </Routes>
        </>)
	}
}

export default AppContent;
