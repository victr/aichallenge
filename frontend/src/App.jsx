import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Hello from './pages/Hello';
import Day1 from './pages/Day1';
import Day2 from './pages/Day2';
import Day3 from './pages/Day3';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Hello />} />
          <Route path="/hello" element={<Hello />} />
          <Route path="/day1" element={<Day1 />} />
          <Route path="/day2" element={<Day2 />} />
          <Route path="/day3" element={<Day3 />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
