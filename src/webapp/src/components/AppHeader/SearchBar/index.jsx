import React from 'react';
import './index.less';
import { Input, AutoComplete } from "antd";
import { UserOutlined } from "@ant-design/icons";

class SearchBar extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
		  selectValue: "",
		  isOpen: false,
		  options: [
			{
			  label: renderTitle("Search Options"),
			  options: [
				renderItem("Servers", 1),
				renderItem("Regions", 1),
				renderItem("Users", 1)
			  ]
			}
		  ]
		};
		this.handleSelect = this.handleSelect.bind(this);
    	this.handleChange = this.handleChange.bind(this);
 	}

	handleSelect(value) {
		value = this.state.selectValue
			? this.state.selectValue.concat(value + ": ")
			: value + ": ";
		this.setState({
			selectValue: value
		});
		this.getOptions(value);
	}

	handleChange(value) {
		this.setState({
			selectValue: value
		});
		this.getOptions(value);
	}

	getOptions(value) {
		const filterLevels = value.split(": ");
		console.log(value);
		if (filterLevels[0] === "") {
			filterLevels[0] = value;
		}
		console.log(filterLevels);
		let options = [];

		switch (filterLevels[0]) {
			case "":
				options = [{
					label: renderTitle("Search Options"),
					options: [
						renderItem("Servers", 1),
						renderItem("Regions", 1),
						renderItem("Users", 1)
					]
				}];
				break;

			case "Servers":
				options = [{
					label: renderTitle("Servers"),
					options: [renderItem("Pokémon Turquoise", 64)]
				}];
				break;

			case "Regions":
				options = [{
					label: renderTitle("Regions"),
					options: [renderItem("New Logora", 64)]
				}];
				break;

			case "Users":
				options = [{
					label: renderTitle("Users"),
					options: [renderItem("Chron", 1)]
				}];
				break;

			default:
				options = [{
					label: renderTitle("Error: None Found"),
					options: []
				}];
				break;
		}
		this.setState({ 
			options: options,
			isOpen: true
		});
	}

	render () {
		return (<>
			<AutoComplete
				dropdownClassName="certain-category-search-dropdown"
				dropdownMatchSelectWidth={350}
				style={{
					width: 250
				}}
				options={this.state.options}
				onSelect={this.handleSelect}
				onChange={this.handleChange}
				value={this.state.selectValue}
				onBlur={() => {
					this.setState({ isOpen: false });
				}}
				onFocus={() => {
					this.setState({ isOpen: true });
				}}
			>
				<Input.Search size="large" placeholder="Search" className="searchbox" />
			</AutoComplete>
    	</>);
	}
}

const renderTitle = (title) => (
	<span>
	  {title}
	</span>
);

const renderItem = (title, count) => ({
value: title,
label: (
	<div
	style={{
		display: "flex",
		justifyContent: "space-between"
	}}
	>
	{title}
	<span>
		<UserOutlined /> {count}
	</span>
	</div>
)
});

export default SearchBar;
