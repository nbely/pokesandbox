import React from 'react';
import './index.less';
import { Menu, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Title } = Typography;
const { SubMenu } = Menu;

// Temporary avatar image - to be made dynamic
const avatarurl: string = "https://cdn2.bulbagarden.net/upload/thumb/3/35/Glalie_anime.png/800px-Glalie_anime.png";

class AppSider extends React.Component {

	constructor(props: any) {
		super(props);
		this.state = {
		}; 
	}

	render () {
		return (<>
      <div className="Sider-avatar" style={{backgroundImage: `url(${avatarurl})`}}></div>
      <Typography className="Sider-title">
        <Title className="Sider-title-1">
          Chron
        </Title>
        <Title level={5} className="Sider-title-2">
          Chronicler#1131
        </Title>
      </Typography>
      <Menu theme="dark" mode="inline" className="Sider-menu">
        <Menu.Item key="1">
          <Link to="/">
            <span>Home</span>
          </Link>
        </Menu.Item>
        <SubMenu key="sub1" title="Servers">
          <Menu.Item key="2">
            <Link to="/servers">
              All Servers
            </Link>
          </Menu.Item>
          <Menu.Item key="3">
            <Link to="/server/1">
              Pokémon Turquoise
            </Link>
          </Menu.Item>
        </SubMenu>
        <SubMenu key="sub2" title="Regions">
          <Menu.Item key="4">
            <Link to="/region/1">
              New Logora
            </Link>
          </Menu.Item>
        </SubMenu>
        <SubMenu key="sub3" title="Characters">
          <Menu.Item key="5">
            <Link to="/profile/160794840815239168">
              <span>Chron Icler</span>
            </Link>
          </Menu.Item>
        </SubMenu>
      </Menu>
    </>)
	}
}

export default AppSider;
