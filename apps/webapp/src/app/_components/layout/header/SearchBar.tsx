"use client";

import { UserOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { RegionDTO, ServerDTO, UserDTO } from "@shared/dtos";
import { trpc } from "@webapp/trpc";

export enum SearchType {
  Any = "Any",
  Servers = "Servers",
  Regions = "Regions",
  Users = "Users",
}

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

export const SearchBar = () => {
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [searchTypes, setSearchType] = useState<SearchType[]>([SearchType.Any]);
  const { data: regions = [], isLoading: regionsLoading } =
    trpc.regions.getAll.useQuery();
  const { data: servers = [], isLoading: serversLoading } =
    trpc.servers.getAll.useQuery();
  const { data: users = [], isLoading: usersLoading } =
    trpc.users.getAll.useQuery();

  const [options, setOptions] = useState<SelectOptions[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [keepOpen, setKeepOpen] = useState<boolean>(false);

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
                  undefined,
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
        user.globalName.toLowerCase().includes(value.toLowerCase())
      );
      return filteredUsers.length > 0
        ? [
            {
              label: renderTitle("Users"),
              options: filteredUsers.map((user: UserDTO) =>
                renderItem(
                  user.globalName,
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
        // Set flag to keep dropdown open when selecting a search type
        setKeepOpen(true);
      } else {
        newSearch = "";
        const selectionOption = valueOptions as unknown as SelectItem;
        router.push(
          `/${selectionOption.type.toLowerCase()}/${selectionOption.id}`
        );
        // Allow dropdown to close when navigating
        setKeepOpen(false);
      }
      setSearch(newSearch);
      setSearchType(newSearchTypes);
      updateOptions(newSearch, newSearchTypes);
    },
    [router, search, searchTypes, updateOptions]
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
          setSearchType(parsedSearchTypes as SearchType[]);
          updateOptions(inputSearch, parsedSearchTypes as SearchType[]);
        }
        setSearch(inputSearch);
      } else {
        setSearch(value);
        setSearchType([SearchType.Any]);
        updateOptions(value, [SearchType.Any]);
      }
    },
    [searchTypes, updateOptions]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen && keepOpen) {
        // Keep dropdown open if flag is set
        setOpen(true);
        setKeepOpen(false);
      } else {
        setOpen(isOpen);
      }
    },
    [keepOpen]
  );

  return (
    <AutoComplete
      classNames={{
        popup: {
          root: "certain-category-search-dropdown",
        },
      }}
      onOpenChange={handleOpenChange}
      open={open}
      onChange={handleChange}
      onSelect={handleSelect}
      options={options}
      popupMatchSelectWidth={350}
      value={`${searchTypeString ? searchTypeString + ": " : ""}${search}`}
    >
      <Input.Search
        loading={regionsLoading || serversLoading || usersLoading}
        size="large"
        placeholder="Search"
        className="searchbox"
      />
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
