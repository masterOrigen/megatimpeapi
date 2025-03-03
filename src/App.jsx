import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Brand from './components/Brand';
import BrandComparison from './components/BrandComparison';
import PDFAnalysis from './components/PDFAnalysis';
import NavigationBar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App bg-light min-vh-100 w-100 p-0">
        <NavigationBar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/brand/:brandName" element={<Brand />} />
          <Route path="/comparison/:brands" element={<BrandComparison />} />
          <Route path="/pdf-analysis" element={<PDFAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;


