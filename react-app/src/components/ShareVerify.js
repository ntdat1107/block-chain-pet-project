import React, { useState, useEffect } from 'react';
import './ShareVerify.css';
import Web3Service from '../services/Web3Service';

function ShareVerify() {
  const [certificateId, setCertificateId] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  // Generate QR Code
  const generateQRCode = (id) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `Chứng nhận ID: ${id} - Xác minh tại: https://yourapp.com/verify/${id}`
    )}`;
    return qrUrl;
  };

  // Search certificate
  const handleSearchCertificate = async (e) => {
    e.preventDefault();

    if (!certificateId || isNaN(certificateId)) {
      setMessage('❌ Vui lòng nhập ID chứng nhận hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const cert = await Web3Service.getCertificate(parseInt(certificateId));
      if (cert && cert[0]) {
        setCertificate({
          id: cert[0],
          studentName: cert[1],
          studentEmailOrId: cert[2],
          courseName: cert[3],
          issueDate: cert[4],
          extraInfo: cert[5],
          issuer: cert[6],
          ipfsHash: cert[7],
          isVerified: cert[8],
          timestamp: new Date(cert[9] * 1000).toLocaleString('vi-VN'),
        });

        // Get verification status
        const status = await Web3Service.getCertificateVerificationStatus(parseInt(certificateId));
        setVerificationStatus({
          isVerified: status[0],
          issuer: status[1],
          timestamp: new Date(status[2] * 1000).toLocaleString('vi-VN'),
        });

        // Generate QR code
        const qr = generateQRCode(certificateId);
        setQrCodeUrl(qr);

        setMessage('✅ Tìm thấy chứng nhận!');
      } else {
        setMessage('❌ Không tìm thấy chứng nhận');
        setCertificate(null);
        setVerificationStatus(null);
      }
    } catch (error) {
      console.error('Error searching certificate:', error);
      setMessage(`❌ Lỗi: ${error.message}`);
      setCertificate(null);
    }
    setLoading(false);
  };

  // Verify certificate
  const handleVerifyCertificate = async () => {
    if (!certificateId) {
      setMessage('❌ Vui lòng nhập ID chứng nhận');
      return;
    }

    setLoading(true);
    try {
      await Web3Service.verifyCertificate(parseInt(certificateId));
      setMessage('✅ Chứng nhận đã được xác minh thành công!');

      // Reload verification status
      const status = await Web3Service.getCertificateVerificationStatus(parseInt(certificateId));
      setVerificationStatus({
        isVerified: status[0],
        issuer: status[1],
        timestamp: new Date(status[2] * 1000).toLocaleString('vi-VN'),
      });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setMessage(`❌ Lỗi: ${error.message}`);
    }
    setLoading(false);
  };

  // Share to social media
  const shareToSocial = (platform) => {
    const text = `Tôi đã nhận được chứng nhận khóa học: ${certificate?.courseName} từ ${certificate?.issueDate}. ID: ${certificateId} #Blockchain #Certificate`;

    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl || window.location.href
        )}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text
        )}&url=${encodeURIComponent(shareUrl || window.location.href)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl || window.location.href
        )}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(
          text + ' ' + (shareUrl || window.location.href)
        )}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('✅ Đã sao chép vào clipboard!');
    setTimeout(() => setMessage(''), 2000);
  };

  // Download certificate
  const downloadCertificate = () => {
    if (!certificate) return;

    const canvas = document.getElementById('certificateCanvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `Certificate_${certificate.id}_${certificate.studentName}.png`;
      link.click();
    }
  };

  // Print certificate
  const printCertificate = () => {
    window.print();
  };

  return (
    <div className="share-verify">
      <h3>🔐 Chia sẻ & Xác minh Chứng nhận</h3>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>
      )}

      {/* Search Form */}
      <div className="search-form-section">
        <h4>🔍 Tìm kiếm Chứng nhận</h4>
        <form onSubmit={handleSearchCertificate}>
          <input
            type="number"
            placeholder="Nhập ID chứng nhận"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            min="1"
          />
          <button type="submit" disabled={loading}>
            {loading ? '⏳ Đang tìm kiếm...' : '🔎 Tìm kiếm'}
          </button>
        </form>
      </div>

      {/* Certificate Display */}
      {certificate && (
        <div className="certificate-display">
          {/* Top Row: Certificate Details + QR Code side-by-side */}
          <div className="top-row">
            <div className="certificate-details">
              <h4>📄 Chi tiết Chứng nhận</h4>
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
                  <label>Email/ID Học viên:</label>
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
            </div>

            <div className="qr-section">
              <h4>QR Code</h4>
              {qrCodeUrl && (
                <div className="qr-container">
                  <img src={qrCodeUrl} alt="QR Code" />
                  <button
                    className="download-qr"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCodeUrl;
                      link.download = `qr_certificate_${certificateId}.png`;
                      link.click();
                    }}
                  >
                    📥 Tải QR Code
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Middle Row: Verification Status + Export */}
          <div className="middle-row">
            <div className="verification-section">
              <h4>✅ Trạng thái Xác minh</h4>
              {verificationStatus && (
                <div
                  className={`verification-status ${
                    verificationStatus.isVerified ? 'verified' : 'unverified'
                  }`}
                >
                  <div className="status-icon">{verificationStatus.isVerified ? '✅' : '⏳'}</div>
                  <div className="status-details">
                    <p className="status-text">
                      {verificationStatus.isVerified
                        ? '✅ Chứng nhận đã được xác minh'
                        : '⏳ Chứng nhận chưa được xác minh'}
                    </p>
                    <p className="status-time">Thời gian: {verificationStatus.timestamp}</p>
                  </div>
                </div>
              )}

              {!verificationStatus?.isVerified && (
                <button className="verify-btn" onClick={handleVerifyCertificate} disabled={loading}>
                  {loading ? '⏳ Đang xác minh...' : '🔏 Xác minh Ngay'}
                </button>
              )}
            </div>

            <div className="export-section">
              <h4>💾 Xuất Chứng nhận</h4>
              <div className="export-buttons">
                <button className="export-btn print" onClick={printCertificate}>
                  🖨️ In Chứng nhận
                </button>
                <button className="export-btn download" onClick={downloadCertificate}>
                  📥 Tải PDF
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Copy Link + Share Buttons */}
          <div className="bottom-row">
            <div className="copy-link-section">
              <h4>🔗 Sao chép Liên kết</h4>
              <div className="link-box">
                <input
                  type="text"
                  readOnly
                  value={`Chứng nhận ID: ${certificate.id}`}
                  onClick={(e) => e.target.select()}
                />
                <button onClick={() => copyToClipboard(`Chứng nhận ID: ${certificate.id}`)}>
                  📋 Sao chép
                </button>
              </div>
            </div>

            <div className="share-section">
              <h4>📤 Chia sẻ Chứng nhận</h4>
              <div className="share-buttons">
                <button className="share-btn facebook" onClick={() => shareToSocial('facebook')}>
                  👍 Facebook
                </button>
                <button className="share-btn twitter" onClick={() => shareToSocial('twitter')}>
                  🐦 Twitter
                </button>
                <button className="share-btn linkedin" onClick={() => shareToSocial('linkedin')}>
                  💼 LinkedIn
                </button>
                <button className="share-btn whatsapp" onClick={() => shareToSocial('whatsapp')}>
                  💬 WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="help-section">
        <h4>❓ Hướng dẫn sử dụng</h4>
        <ul>
          <li>
            🔍 <strong>Tìm kiếm:</strong> Nhập ID chứng nhận để tìm thông tin chi tiết
          </li>
          <li>
            🔏 <strong>Xác minh:</strong> Nhấn nút xác minh để ghi nhận chứng nhận trên blockchain
          </li>
          <li>
            📤 <strong>Chia sẻ:</strong> Chia sẻ chứng nhận trên các mạng xã hội
          </li>
          <li>
            📋 <strong>Sao chép:</strong> Sao chép thông tin chứng nhận để gửi cho người khác
          </li>
          <li>
            💾 <strong>Xuất:</strong> Tải hoặc in chứng nhận dưới dạng tệp
          </li>
          <li>
            🔐 <strong>QR Code:</strong> Sử dụng QR code để xác minh nhanh chóng
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ShareVerify;
