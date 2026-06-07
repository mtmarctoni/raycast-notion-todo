import { Icon, List } from "@raycast/api";
import { capitalizeFirstLetter } from "../utils";
import { TodoFilter } from "../types";

export function TodoFilterDropdown({
  filter,
  onFilterChange,
}: {
  filter: TodoFilter;
  onFilterChange: (value: TodoFilter) => void;
}) {
  return (
    <List.Dropdown tooltip="Filter Todos" value={filter} onChange={(value) => onFilterChange(value as TodoFilter)}>
      <List.Dropdown.Item title={capitalizeFirstLetter(TodoFilter.ALL)} value={TodoFilter.ALL} />
      <List.Dropdown.Item
        title={capitalizeFirstLetter(TodoFilter.PERSONAL)}
        value={TodoFilter.PERSONAL}
        icon={Icon.Person}
      />
      <List.Dropdown.Item title={capitalizeFirstLetter(TodoFilter.WORK)} value={TodoFilter.WORK} icon={Icon.Building} />
    </List.Dropdown>
  );
}
