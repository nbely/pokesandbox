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

const GlobalProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { defaultAlgorithm, darkAlgorithm } = theme;
    const [isDarkMode, setIsDarkMode] = useState(true);

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

export const useGlobalContext = (): IState => {
    return useContext(GlobalContext);
}

export default GlobalProvider;