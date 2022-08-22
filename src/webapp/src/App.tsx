import './App.less';
import { Layout } from 'antd';

import AppHeader from './components/AppHeader';
import AppSider from './components/AppSider';
import AppContent from './components/AppContent';
import AppFooter from './components/AppFooter';

const { Header, Sider, Content, Footer } = Layout;

function App() {
  return (
    <div className="App">
      <Layout className="App-layout">
        <Header className="App-header" >
          <AppHeader />
        </Header>
        <Layout>
          <Sider width={200} className="App-sider">
            <AppSider />
          </Sider>
          <Content className="App-content">
            <AppContent />
          </Content>
        </Layout>
        <Footer className="App-footer">
          <AppFooter /> 
        </Footer>
      </Layout>
    </div>
  );
}

export default App;
