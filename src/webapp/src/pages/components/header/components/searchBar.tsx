import { Input, AutoComplete } from "antd";
import React, { Dispatch, SetStateAction } from "react";
import { UserOutlined } from "@ant-design/icons";

interface SelectItem {
    label: JSX.Element,
    value: string
}

interface SelectOptions {
    label: JSX.Element,
    options: SelectItem[]
}

export default function SearchBar(): JSX.Element {
    const [ isOpen, setIsOpen ]: [ boolean, Dispatch<SetStateAction<boolean>> ] = React.useState(false)
    const [ selectValue, setSelectValue ]: [ string, Dispatch<SetStateAction<string>>] = React.useState("");
    const [ options, setOptions ]: [ SelectOptions[], Dispatch<SetStateAction<SelectOptions[]>> ] = React.useState([
        {
            label: renderTitle("Search Options"),
            options: [
                renderItem("Servers", 1),
                renderItem("Regions", 1),
                renderItem("Users", 1)
            ]
        }
    ]);

    const handleSelect = (value: string): void => {
		value = selectValue
			? selectValue.concat(value + ": ")
			: value + ": ";
        handleChange(value);
	}

	const handleChange = (value: string): void => {
		setSelectValue(value);
		getOptions(value);
	}

	const getOptions = (value: string): void => {
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
        setOptions(options);
        setIsOpen(true);
	}


    return (
        <AutoComplete
            dropdownMatchSelectWidth={350}
            options={options}
            popupClassName="certain-category-search-dropdown"
            value={selectValue}
            onBlur={() => setIsOpen(false)}
            onChange={handleChange}
            onFocus={() => setIsOpen(true)}
            onSelect={handleSelect}
        >
            <Input.Search size="large" placeholder="Search" className="searchbox" />
        </AutoComplete>
    );
}


const renderTitle = (title: string): JSX.Element => (
	<span>
	  {title}
	</span>
);

const renderItem = (title: string, count: number): SelectItem => ({
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