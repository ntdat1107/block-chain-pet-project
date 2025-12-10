import React, { useState } from 'react';
import './CertificateIssuer.css';
import Web3Service from '../services/Web3Service';
// Optional IPFS upload using web3.storage. Install with:
// npm install web3.storage
let Web3StorageClient = null;
try {
  // Lazy require so app doesn't crash if package isn't installed
  // (During build, bundler will include it if present)
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { Web3Storage } = require('web3.storage');
  Web3StorageClient = Web3Storage;
} catch (err) {
  Web3StorageClient = null;
}

function CertificateIssuer() {
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    courseName: '',
    issueDate: '',
    extraInfo: '',
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleIssue = async () => {
    if (!Web3Service.getCurrentAccount()) {
      alert('Vui lòng kết nối ví trước.');
      return;
    }

    if (
      !formData.studentName ||
      !formData.studentEmail ||
      !formData.courseName ||
      !formData.issueDate
    ) {
      alert('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }

    setLoading(true);
    setResult('Đang xử lý...');

    // Attempt IPFS upload if token present and package installed
    let ipfsHash = '';
    const token = process.env.REACT_APP_WEB3_STORAGE_TOKEN;
    if (token && Web3StorageClient) {
      setResult('Đang upload dữ liệu chứng nhận lên IPFS...');
      try {
        const client = new Web3StorageClient({ token });
        const metadata = {
          studentName: formData.studentName,
          studentEmailOrId: formData.studentEmail,
          courseName: formData.courseName,
          issueDate: formData.issueDate,
          extraInfo: formData.extraInfo,
          issuedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        const file = new File([blob], 'certificate.json');
        const cid = await client.put([file], { wrapWithDirectory: false });
        ipfsHash = cid;
        setResult(`Upload lên IPFS thành công. CID: ${cid}\nGửi giao dịch...`);
      } catch (err) {
        // Don't block issuance if IPFS fails; proceed with empty ipfsHash
        console.warn('IPFS upload failed:', err);
        setResult('Không thể upload lên IPFS, tiếp tục gửi giao dịch...');
      }
    } else if (token && !Web3StorageClient) {
      setResult(
        'REACT_APP_WEB3_STORAGE_TOKEN được cấu hình nhưng package web3.storage chưa được cài.'
      );
      setLoading(false);
      return;
    } else {
      setResult('Không cấu hình IPFS, gửi giao dịch mà không có ipfsHash...');
    }

    try {
      const response = await Web3Service.issueCertificate(
        formData.studentName,
        formData.studentEmail,
        formData.courseName,
        formData.issueDate,
        formData.extraInfo,
        ipfsHash
      );

      setResult(
        `Đã cấp chứng nhận thành công!\n` +
          `Mã chứng nhận: ${response.certificateId}\n` +
          `Tx hash: ${response.txHash}`
      );

      // Clear form
      setFormData({
        studentName: '',
        studentEmail: '',
        courseName: '',
        issueDate: '',
        extraInfo: '',
      });
    } catch (error) {
      setResult(`Lỗi khi cấp chứng nhận: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-6">
      <div className="card">
        <h3>Cấp chứng nhận mới</h3>

        <label>Tên học viên</label>
        <input
          id="inputStudentName"
          type="text"
          value={formData.studentName}
          onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
        />

        <label>Email / Mã học viên</label>
        <input
          id="inputStudentEmail"
          type="text"
          value={formData.studentEmail}
          onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
        />

        <label>Tên khóa học</label>
        <input
          id="inputCourseName"
          type="text"
          value={formData.courseName}
          onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
        />

        <label>Ngày cấp (YYYY-MM-DD)</label>
        <input
          id="inputIssueDate"
          type="text"
          placeholder="2025-12-08"
          value={formData.issueDate}
          onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
        />

        <label>Ghi chú</label>
        <textarea
          id="inputExtraInfo"
          rows="3"
          placeholder="Điểm, xếp loại, ghi chú thêm..."
          value={formData.extraInfo}
          onChange={(e) => setFormData({ ...formData, extraInfo: e.target.value })}
        />

        <button id="btnIssue" className="btn-success" onClick={handleIssue} disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Cấp chứng nhận'}
        </button>

        <h4>Kết quả</h4>
        <div id="issueResult" className="small">
          {result}
        </div>
      </div>
    </div>
  );
}

export default CertificateIssuer;
