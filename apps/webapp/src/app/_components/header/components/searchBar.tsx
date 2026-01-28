"use client";
import { UserOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { RegionDTO, ServerDTO, UserDTO } from "@shared";
import {
  SearchType,
  setSearch,
  setSearchType,
} from "@webapp/store/searchSlice";
import { useAppDispatch, useAppSelector } from "@webapp/store/selectors";

interface SelectItem {
  id: string;
  label: React.ReactElement;
  type: string;
  value: string;
}

interface SelectOptions {
  label: React.ReactElement;
  options: SelectItem[];
}

interface SearchTypeOption {
  name: string;
  quantity: number;
}

const SearchBar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const search = useAppSelector((state) => state.search.search);
  const searchTypes = useAppSelector((state) => state.search.searchTypes);
  const regions = useAppSelector((state) => state.regions.regions);
  const servers = useAppSelector((state) => state.servers.servers);
  const users = useAppSelector((state) => state.users.users);

  const [options, setOptions] = useState<SelectOptions[]>([]);

  const getAnySearchOptions = useCallback(
    (value = ""): SelectOptions[] => {
      const types: SearchTypeOption[] = [
        { name: "Servers", quantity: servers.length },
        { name: "Regions", quantity: regions.length },
        { name: "Users", quantity: users.length },
      ];
      const filteredTypes = types.filter((type: SearchTypeOption) =>
        type.name.toLowerCase().includes(value.toLowerCase())
      );
      return filteredTypes.length > 0
        ? [
            {
              label: renderTitle("Search Options"),
              options: filteredTypes.map((type: SearchTypeOption) =>
                renderItem(type.name, type.quantity)
              ),
            },
          ]
        : [];
    },
    [servers, regions, users]
  );

  useEffect(() => {
    setOptions(getAnySearchOptions());
  }, [getAnySearchOptions]);

  const searchTypeString = useMemo(() => {
    return searchTypes
      .filter((type: SearchType) => type !== SearchType.Any)
      .join("/");
  }, [searchTypes]);

  const getServersSearchOptions = useCallback(
    (value = ""): SelectOptions[] => {
      const filteredServers = servers.filter((server: ServerDTO) =>
        server.name.toLowerCase().includes(value.toLowerCase())
      );
      return filteredServers.length > 0
        ? [
            {
              label: renderTitle("Servers"),
              options: filteredServers.map((server: ServerDTO) =>
                renderItem(
                  server.name,
                  server.playerList.length,
                  SearchType.Servers,
                  server.serverId
                )
              ),
            },
          ]
        : [];
    },
    [servers]
  );

  const getRegionsSearchOptions = useCallback(
    (value = ""): SelectOptions[] => {
      const filteredRegions = regions.filter((region: RegionDTO) =>
        region.name.toLowerCase().includes(value.toLowerCase())
      );
      return filteredRegions.length > 0
        ? [
            {
              label: renderTitle("Regions"),
              options: filteredRegions.map((region: RegionDTO) =>
                renderItem(
                  region.name,
                  region.playerList.length,
                  SearchType.Regions,
                  region._id.toString()
                )
              ),
            },
          ]
        : [];
    },
    [regions]
  );

  const getUsersSearchOptions = useCallback(
    (value = ""): SelectOptions[] => {
      const filteredUsers = users.filter((user: UserDTO) =>
        user.username.toLowerCase().includes(value.toLowerCase())
      );
      return filteredUsers.length > 0
        ? [
            {
              label: renderTitle("Users"),
              options: filteredUsers.map((user: UserDTO) =>
                renderItem(
                  user.username,
                  undefined,
                  SearchType.Users,
                  user.userId
                )
              ),
            },
          ]
        : [];
    },
    [users]
  );

  const updateOptions = useCallback(
    (value: string, searchTypes: SearchType[]): void => {
      const newOptions: SelectOptions[] = [];
      for (const searchType of searchTypes) {
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
    ]
  );

  const handleSelect = useCallback(
    (value: string, valueOptions: SelectOptions | SelectOptions[]): void => {
      let newSearch: string = search;
      let newSearchTypes: SearchType[] = [SearchType.Any];

      if (Object.keys(SearchType).includes(value)) {
        const newValue = value as SearchType;
        newSearchTypes = [...searchTypes, newValue].filter(
          (type: SearchType) => type !== SearchType.Any
        );
      } else {
        newSearch = "";
        const selectionOption = valueOptions as unknown as SelectItem;
        router.push(
          `/${selectionOption.type.toLowerCase()}/${selectionOption.id}`
        );
      }
      dispatch(setSearch(newSearch));
      dispatch(setSearchType(newSearchTypes));
      updateOptions(newSearch, newSearchTypes);
    },
    [dispatch, router, search, searchTypes, updateOptions]
  );

  const handleChange = useCallback(
    (value: string): void => {
      if (value.includes(": ")) {
        const [inputSearchTypes, inputSearch] = value.split(": ");
        const parsedSearchTypes = inputSearchTypes.split("/");
        if (
          !searchTypes.every(
            (type: SearchType, index: number) =>
              type === parsedSearchTypes[index]
          ) &&
          parsedSearchTypes.every((type: string) =>
            Object.keys(SearchType).includes(type)
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
    [dispatch, searchTypes, updateOptions]
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

const renderTitle = (title: string): React.ReactElement => <span>{title}</span>;

const renderItem = (
  title: string,
  count: number | undefined,
  type: string = SearchType.Any,
  id = ""
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
