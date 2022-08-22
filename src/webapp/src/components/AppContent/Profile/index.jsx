import React from 'react';
// import ProgressBar from 'react-bootstrap/ProgressBar';
import { LoadingOutlined } from '@ant-design/icons';
import { Divider, Typography } from 'antd';
import './index.less';

const { Title } = Typography;

class Profile extends React.Component {

	async componentDidMount(){
		const response = await fetch(`http://localhost:3001/profile/${this.props.match.params.id}`);
		const { data } = await response.json();
		this.setState({data});
	}

	constructor(props) {
		super(props);
		this.state = {
			data: {}
		}
	}

	render () {
		const { data } = this.state;
		const { rival, party } = data;
		const inventory = data; // temp, todo: move inventory info to data.inventory in db
		const imgUrl = name => `${process.env.PUBLIC_URL}/pokemon/pseudosprites/${name}.png`;
		const shinyImgUrl = name => `${process.env.PUBLIC_URL}/pokemon/shinypseudosprites/${name}.png`;
		const dexUrl = name =>`http://turquoise.alteredorigin.net/pokemon/${name.toLocaleLowerCase()}/`;

		if (!data.username){
			return <div className="loadContainer"><LoadingOutlined className="loadSpinner"/></div>;
		}

		return (
			<div className="profile">
				<Typography>
					<div className="container breadcrumb">
						<Title level={2}>
							{`Pokémon Turqoise / New Logora / ${data.firstName} ${data.lastName}`}
						</Title>
					</div>
					<div className="container">
						<div className="panel info">
							<div className="basicInfo component">
								<Title level={3}>Basic Info</Title>
								<Divider />
								<div className="componentBody">
									<Title level={5}>Name: {data.firstName} {data.nickname ? "'" + data.nickname + "' " : ''}{data.lastName}</Title>
									<Title level={5}>Age: {data.age}</Title>
									<Title level={5}>Gender: {data.gender}</Title>
									{/* <li>Self Intro: {data.bio}</li> */}
								</div>
							</div>
							<div className="rivalInfo component">
								<Title level={3}>Rival Info</Title>
								<Divider />
								<div className="componentBody">
									<Title level={5}>Name: {rival.firstName} {rival.lastName}</Title>
									<Title level={5}>Age: {rival.age}</Title>
									<Title level={5}>Gender: {rival.gender}</Title>
									<Title level={5}>Party:</Title>
									{rival.team.map((name, i)=><img key={i} src={imgUrl(name)} alt={name}/>)}
								</div>
							</div>
						</div>
						<div className="panel belongings">
							<div className="inventory component">
								<Title level={3}>Inventory</Title>
								<Divider />
								<div className="componentBody">
									<Title level={5}>Money: {data.money}P</Title>
									<Title level={5}>Badges: {data.badges.join(', ') || "None"}</Title>
									<Title level={5}>Key Items: {data.keyItems.join(', ') || "None"}</Title>
									<Title level={5}>General Items</Title>
									<ul>
										{data.generalItems.map(item => 
											<li key={item.name}>{`${item.name} (x${item.quantity})`}</li>)}
									</ul>
									<Title level={5}>Pokeballs</Title>
									<ul>
										{inventory.pokeBalls.map(item => 
											<li key={item.name}>{`${item.name} (x${item.quantity})`}</li>)}
									</ul>
								</div>
							</div>
							<div className="party component">
								<Title level={3}>Party</Title>
								<Divider />
								<div className="componentBody">
									<ul className="slotList">
										{party.map((pkmn, index) => <li key={pkmn.species}>
											<Title level={4}>Slot {index+1}:</Title>
											{pkmn.pokemon && (<ul>
												Lv.{pkmn.level} <span className={`gender gender-${pkmn.gender}`}>{pkmn.gender === 'M' ? '♂' : (pkmn.gender === 'F' ? '♀' : 'X')}</span>
												<a href={dexUrl(pkmn.pokemon)}>
												<img alt={pkmn.species} title={pkmn.pokemon}
													src={pkmn.shiny ? shinyImgUrl(pkmn.species) : imgUrl(pkmn.species)}/></a>
												<li>Name: {pkmn.nickname ? pkmn.nickname : pkmn.pokemon}</li>
												<li>Ability: {pkmn.ability}</li>
												<li>Nature: {pkmn.nature}</li>
												<li>Status: <span className={`status ${pkmn.status}`}>{pkmn.status || "None"}</span></li>
												<li>HP: {pkmn.currentHP}/{pkmn.maxHP} 
													{/*<ProgressBar animated variant="danger" now={Math.floor(pkmn.currentHP/pkmn.maxHP*100)} className="Profile-progressBar" />*/}</li>
												<li>EXP: {pkmn.exp.percentage}% 
													{/*<ProgressBar animated now={pkmn.exp.percentage} className="Profile-progressBar" />*/}</li>
												<li>OT: {pkmn.originalTrainer.firstName + ' ' + pkmn.originalTrainer.lastName + ' (' + pkmn.originalTrainer.username + ')'}</li>
												<li>All Moves: {pkmn.moves.join(', ')}</li>
												<li>Set Moves: 
													<table className="movesTable">
														<tbody>
															{pkmn.setMoves.map((move, index) => 
															<tr className="tableRow" key={move.name}>
																<td className="tableData">{index+1}</td>
																<td className="tableData">{move.name}</td>
																<td className="tableData">{move.pp}/{move.maxPP} PP</td>
															</tr>)}
														</tbody>
													</table>
												</li>
											</ul>)}
											<Divider />
										</li>)}
									</ul>
								</div>
							</div>
						</div>
					</div>
				</Typography>
			</div>
		);
	}
}

export default Profile;
