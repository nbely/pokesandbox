export enum MenuResponseType {
  COMPONENT,
  MESSAGE,
  MIXED,
}

export type MenuOptions = {
  cancellable?: boolean;
  responseType: MenuResponseType;
  returnable?: boolean;
  trackedInHistory?: boolean;
};
