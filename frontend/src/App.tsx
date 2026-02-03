import { BrowserRouter } from 'react-router-dom';
import './App.css';
import AppRoutes from './routes/Routes';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import Layout from './layout/Layout';
import { SidebarProvider } from './components/ui/sidebar';

function App() {
  return (
    <div className="app">
      <Provider store={store}>
        <BrowserRouter>
          <SidebarProvider>
            <Layout>
              <AppRoutes />
            </Layout>
          </SidebarProvider>
        </BrowserRouter>
      </Provider>
    </div>
  );
}

export default App;
