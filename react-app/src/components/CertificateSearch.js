import React, { useState } from 'react';
import './CertificateSearch.css';
import Web3Service from '../services/Web3Service';

function CertificateSearch() {
  const [certificateId, setCertificateId] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const generateQRCode = (id) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `Chứng nhận ID: ${id} - Xác minh tại: ${window.location.origin}/verify/${id}`
    )}`;
  };

  const handleSearch = async () => {
    if (!Web3Service.getCurrentAccount()) {
      alert('Vui lòng kết nối ví trước.');
      return;
    }

    if (!certificateId) {
      alert('Vui lòng nhập mã chứng nhận.');
      return;
    }

    setLoading(true);
    setMessage('Đang tra cứu...');
    setCertificate(null);

    try {
      const cert = await Web3Service.getCertificate(parseInt(certificateId));
      if (cert && cert[0]) {
        // cert array: [0]id, [1]studentName, [2]studentEmailOrId, [3]courseId, [4]courseName, [5]issueDate, [6]extraInfo, [7]issuer, [8]ipfsHash, [9]isVerified, [10]timestamp
        setCertificate({
          id: cert[0],
          studentName: cert[1],
          studentEmailOrId: cert[2],
          courseId: cert[3],
          courseName: cert[4],
          issueDate: cert[5],
          extraInfo: cert[6],
          issuer: cert[7],
          ipfsHash: cert[8],
          isVerified: cert[9],
          timestamp: new Date(cert[10] * 1000).toLocaleString('vi-VN'),
        });

        const status = await Web3Service.getCertificateVerificationStatus(parseInt(certificateId));
        setVerificationStatus({
          isVerified: status[0],
          issuer: status[1],
          timestamp: new Date(status[2] * 1000).toLocaleString('vi-VN'),
        });

        setQrCodeUrl(generateQRCode(certificateId));
        setMessage('✅ Tìm thấy chứng nhận');
      } else {
        setMessage(`❌ Không tìm thấy chứng nhận với ID ${certificateId}.`);
      }
    } catch (error) {
      setMessage(`❌ Lỗi: ${error.message || 'Không tìm thấy chứng nhận.'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('✅ Đã sao chép vào clipboard');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="col-6">
      <div className="card">
        <h3>Tra cứu chứng nhận</h3>

        {message && (
          <div className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <label>Mã chứng nhận (ID)</label>
        <input
          id="inputCertificateId"
          type="number"
          placeholder="Nhập ID chứng nhận"
          min="1"
          value={certificateId}
          onChange={(e) => setCertificateId(e.target.value)}
        />

        <button id="btnSearch" className="btn-info" onClick={handleSearch} disabled={loading}>
          {loading ? 'Đang tra cứu...' : 'Tra cứu'}
        </button>

        {certificate && (
          <div className="certificate-display">
            <div className="certificate-card">
              <div className="cert-row">
                <label>ID Chứng nhận:</label>
                <span className="cert-value">{certificate.id}</span>
              </div>
              <div className="cert-row">
                <label>Tên Học viên:</label>
                <span className="cert-value">{certificate.studentName}</span>
              </div>
              <div className="cert-row">
                <label>Địa chỉ học viên:</label>
                <span className="cert-value">{certificate.studentEmailOrId}</span>
              </div>
              <div className="cert-row">
                <label>Tên Khóa học:</label>
                <span className="cert-value">{certificate.courseName}</span>
              </div>
              <div className="cert-row">
                <label>Ngày phát hành:</label>
                <span className="cert-value">{certificate.issueDate}</span>
              </div>
              <div className="cert-row">
                <label>Thông tin Bổ sung:</label>
                <span className="cert-value">{certificate.extraInfo}</span>
              </div>
              <div className="cert-row">
                <label>IPFS Hash:</label>
                <span className="cert-value monospace">{certificate.ipfsHash || 'Chưa có'}</span>
                {certificate.ipfsHash && (
                  <button
                    className="small-link"
                    onClick={() =>
                      window.open(`https://ipfs.io/ipfs/${certificate.ipfsHash}`, '_blank')
                    }
                  >
                    Xem IPFS
                  </button>
                )}
              </div>
              <div className="cert-row">
                <label>Địa chỉ Người phát hành:</label>
                <span className="cert-value monospace">{certificate.issuer}</span>
              </div>
              <div className="cert-row">
                <label>Thời gian Tạo:</label>
                <span className="cert-value">{certificate.timestamp}</span>
              </div>
            </div>

            <div className="verification-section">
              <h4>Trạng thái xác minh</h4>
              {verificationStatus && (
                <div
                  className={`verification-status ${
                    verificationStatus.isVerified ? 'verified' : 'unverified'
                  }`}
                >
                  <div className="status-icon">{verificationStatus.isVerified ? '✅' : '⏳'}</div>
                  <div className="status-details">
                    <p className="status-text">
                      {verificationStatus.isVerified ? 'Đã xác minh' : 'Chưa được xác minh'}
                    </p>
                    <p className="status-time">Thời gian: {verificationStatus.timestamp}</p>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <button
                  className="btn-primary"
                  onClick={() => copyToClipboard(`Chứng nhận ID: ${certificate.id}`)}
                >
                  📋 Sao chép ID
                </button>
                {qrCodeUrl && (
                  <div style={{ marginTop: 10 }}>
                    <img src={qrCodeUrl} alt="QR" style={{ width: 160, height: 160 }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CertificateSearch;
