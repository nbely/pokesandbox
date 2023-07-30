import { AutoComplete, Input } from "antd";
import React from "react";
import { UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";

import { SearchType, setSearch, setSearchType } from "@/store/searchSlice";
import { useAppDispatch, useAppSelector } from "@/store/selectors";

import type { IRegion } from "@/interfaces/models/region";
import type { IServer } from "@/interfaces/models/server";
import type { IUser } from "@/interfaces/models/user";

interface SelectItem {
  id: string;
  label: JSX.Element;
  type: string;
  value: string;
}

interface SelectOptions {
  label: JSX.Element;
  options: SelectItem[];
}

interface SearchTypeOption {
  name: string;
  quantity: number;
}

const SearchBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const search = useAppSelector((state) => state.search.search);
  const searchTypes = useAppSelector((state) => state.search.searchTypes);
  const regions = useAppSelector((state) => state.regions.regions);
  const servers = useAppSelector((state) => state.servers.servers);
  const users = useAppSelector((state) => state.users.users);

  const [options, setOptions] = React.useState<SelectOptions[]>([]);

  React.useEffect(() => {
    setOptions(getAnySearchOptions());
  }, []);

  const searchTypeString = React.useMemo(() => {
    return searchTypes
      .filter((type: SearchType) => type !== SearchType.Any)
      .join("/");
  }, [searchTypes]);

  const getAnySearchOptions = React.useCallback(
    (value: string = ""): SelectOptions[] => {
      const types: SearchTypeOption[] = [
        { name: "Servers", quantity: servers.length },
        { name: "Regions", quantity: regions.length },
        { name: "Users", quantity: users.length },
      ];
      const filteredTypes = types.filter((type: SearchTypeOption) =>
        type.name.toLowerCase().includes(value.toLowerCase()),
      );
      return filteredTypes.length > 0
        ? [
            {
              label: renderTitle("Search Options"),
              options: filteredTypes.map((type: SearchTypeOption) =>
                renderItem(type.name, type.quantity),
              ),
            },
          ]
        : [];
    },
    [servers, regions, users],
  );

  const getServersSearchOptions = React.useCallback(
    (value: string = ""): SelectOptions[] => {
      const filteredServers = servers.filter((server: IServer) =>
        server.name.toLowerCase().includes(value.toLowerCase()),
      );
      return filteredServers.length > 0
        ? [
            {
              label: renderTitle("Servers"),
              options: filteredServers.map((server: IServer) =>
                renderItem(
                  server.name,
                  server.playerList.length,
                  SearchType.Servers,
                  server.serverId,
                ),
              ),
            },
          ]
        : [];
    },
    [servers],
  );

  const getRegionsSearchOptions = React.useCallback(
    (value: string = ""): SelectOptions[] => {
      const filteredRegions = regions.filter((region: IRegion) =>
        region.name.toLowerCase().includes(value.toLowerCase()),
      );
      return filteredRegions.length > 0
        ? [
            {
              label: renderTitle("Regions"),
              options: filteredRegions.map((region: IRegion) =>
                renderItem(
                  region.name,
                  region.playerList.length,
                  SearchType.Regions,
                  region._id,
                ),
              ),
            },
          ]
        : [];
    },
    [regions],
  );

  const getUsersSearchOptions = React.useCallback(
    (value: string = ""): SelectOptions[] => {
      const filteredUsers = users.filter((user: IUser) =>
        user.username.toLowerCase().includes(value.toLowerCase()),
      );
      return filteredUsers.length > 0
        ? [
            {
              label: renderTitle("Users"),
              options: filteredUsers.map((user: IUser) =>
                renderItem(
                  user.username,
                  undefined,
                  SearchType.Users,
                  user.userId,
                ),
              ),
            },
          ]
        : [];
    },
    [users],
  );

  const updateOptions = React.useCallback(
    (value: string, searchTypes: SearchType[]): void => {
      const newOptions: SelectOptions[] = [];
      for (let searchType of searchTypes) {
        if (searchType === SearchType.Any) {
          newOptions.push(...getAnySearchOptions(value));
        }
        if (
          searchType === SearchType.Servers ||
          (value && searchType === SearchType.Any)
        ) {
          newOptions.push(...getServersSearchOptions(value));
        }
        if (
          searchType === SearchType.Regions ||
          (value && searchType === SearchType.Any)
        ) {
          newOptions.push(...getRegionsSearchOptions(value));
        }
        if (
          searchType === SearchType.Users ||
          (value && searchType === SearchType.Any)
        ) {
          newOptions.push(...getUsersSearchOptions(value));
        }
      }
      setOptions(newOptions);
    },
    [
      getAnySearchOptions,
      getServersSearchOptions,
      getRegionsSearchOptions,
      getUsersSearchOptions,
    ],
  );

  const handleSelect = React.useCallback(
    (value: string, valueOptions: SelectOptions | SelectOptions[]): void => {
      let newSearch: string = search;
      let newSearchTypes: SearchType[] = [SearchType.Any];

      if (Object.keys(SearchType).includes(value)) {
        const newValue = value as SearchType;
        newSearchTypes = [...searchTypes, newValue].filter(
          (type: SearchType) => type !== SearchType.Any,
        );
      } else {
        newSearch = "";
        const selectionOption = valueOptions as unknown as SelectItem;
        router.push(
          `/${selectionOption.type.toLowerCase()}/${selectionOption.id}`,
        );
      }
      dispatch(setSearch(newSearch));
      dispatch(setSearchType(newSearchTypes));
      updateOptions(newSearch, newSearchTypes);
    },
    [search, searchTypes, updateOptions],
  );

  const handleChange = React.useCallback(
    (value: string): void => {
      if (value.includes(": ")) {
        const [inputSearchTypes, inputSearch] = value.split(": ");
        const parsedSearchTypes = inputSearchTypes.split("/");
        if (
          !searchTypes.every(
            (type: SearchType, index: number) =>
              type === parsedSearchTypes[index],
          ) &&
          parsedSearchTypes.every((type: string) =>
            Object.keys(SearchType).includes(type),
          )
        ) {
          dispatch(setSearchType(parsedSearchTypes as SearchType[]));
          updateOptions(inputSearch, parsedSearchTypes as SearchType[]);
        }
        dispatch(setSearch(inputSearch));
      } else {
        dispatch(setSearch(value));
        dispatch(setSearchType([SearchType.Any]));
        updateOptions(value, [SearchType.Any]);
      }
    },
    [searchTypes, updateOptions],
  );

  return (
    <AutoComplete
      dropdownMatchSelectWidth={350}
      onChange={handleChange}
      onSelect={handleSelect}
      options={options}
      popupClassName="certain-category-search-dropdown"
      value={`${searchTypeString ? searchTypeString + ": " : ""}${search}`}
    >
      <Input.Search size="large" placeholder="Search" className="searchbox" />
    </AutoComplete>
  );
};

const renderTitle = (title: string): JSX.Element => <span>{title}</span>;

const renderItem = (
  title: string,
  count: number | undefined,
  type: string = SearchType.Any,
  id: string = "",
): SelectItem => ({
  id,
  label: (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      {title}
      <span>
        <UserOutlined /> {count}
      </span>
    </div>
  ),
  type,
  value: title,
});

export default SearchBar;
