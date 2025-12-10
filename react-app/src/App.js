import React from 'react';
import './App.css';
import WalletConnect from './components/WalletConnect';
import CertificateIssuer from './components/CertificateIssuer';
import CertificateSearch from './components/CertificateSearch';

function App() {
  return (
    <div className="container">
      <h2>Hệ thống quản lý chứng nhận khóa học</h2>
      <p className="subtitle">Ứng dụng Blockchain – MetaMask – Ganache</p>

      <WalletConnect />

      <div className="row">
        <CertificateIssuer />
        <CertificateSearch />
      </div>

      <div className="footer">
        Đề tài: Xây dựng hệ thống quản lý chứng nhận khóa học bằng Blockchain
      </div>
    </div>
  );
}

export default App;
