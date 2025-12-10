import React, { useState, useEffect } from 'react';
import './WalletConnect.css';
import Web3Service from '../services/Web3Service';

function WalletConnect() {
  const [status, setStatus] = useState('Chưa kết nối');
  const [account, setAccount] = useState(null);

  useEffect(() => {
    initializeWeb3();
  }, []);

  const initializeWeb3 = async () => {
    try {
      if (Web3Service.isMetaMaskInstalled()) {
        await Web3Service.initializeWeb3();
        setStatus('Đã phát hiện MetaMask, vui lòng nhấn "Kết nối ví".');
      } else {
        setStatus('Không tìm thấy MetaMask. Vui lòng cài đặt MetaMask extension.');
        alert('Không phát hiện MetaMask. Cài MetaMask rồi reload trang.');
      }
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleConnect = async () => {
    try {
      const connectedAccount = await Web3Service.connectWallet();
      setAccount(connectedAccount);
      setStatus(`Đã kết nối: ${connectedAccount}`);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="card">
      <h3>Kết nối ví MetaMask</h3>
      <p id="walletStatus">{status}</p>
      <button
        id="btnConnect"
        className="btn-primary"
        onClick={handleConnect}
        disabled={account !== null}
      >
        Kết nối ví
      </button>
    </div>
  );
}

export default WalletConnect;
