import { 
    Dispatch,
    PropsWithChildren,
    SetStateAction,
    createContext,
    useContext,
    useState 
} from 'react';
import { ConfigProvider, theme } from 'antd';

export interface IState {
    isDarkMode: boolean,
    toggleDarkMode: () => void
}

const defaultState: IState = {
    isDarkMode: true,
    toggleDarkMode: () => {}
}

const GlobalContext: React.Context<IState> = createContext<IState>(defaultState);

export function GlobalProvider({ children }: PropsWithChildren): JSX.Element {
    const { defaultAlgorithm, darkAlgorithm } = theme;
    const [isDarkMode, setIsDarkMode]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(true);

    const toggleDarkMode = (): void => {
        setIsDarkMode(!isDarkMode);
    }

    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
            }}>
            <GlobalContext.Provider value={{
                isDarkMode, 
                toggleDarkMode
            }}>
                {children}
            </GlobalContext.Provider>
        </ConfigProvider>
    )
}

export function useGlobalContext(): IState {
    return useContext(GlobalContext);
}