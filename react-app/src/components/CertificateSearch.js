import React, { useState } from 'react';
import './CertificateSearch.css';
import Web3Service from '../services/Web3Service';

function CertificateSearch() {
  const [certificateId, setCertificateId] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

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
    setResult('Đang tra cứu trên chuỗi khối...');

    try {
      const cert = await Web3Service.getCertificate(certificateId);

      const text =
        `ID: ${cert.id}\n` +
        `Tên học viên: ${cert.studentName}\n` +
        `Email/Mã HV: ${cert.studentEmailOrId}\n` +
        `Khóa học: ${cert.courseName}\n` +
        `Ngày cấp: ${cert.issueDate}\n` +
        `Ghi chú: ${cert.extraInfo}\n` +
        `Issuer (địa chỉ ví cấp): ${cert.issuer}`;

      setResult(text);
    } catch (error) {
      setResult(`Không tìm thấy chứng nhận hoặc lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-6">
      <div className="card">
        <h3>Tra cứu chứng nhận</h3>

        <label>Mã chứng nhận (ID)</label>
        <input
          id="inputCertificateId"
          type="number"
          min="1"
          value={certificateId}
          onChange={(e) => setCertificateId(e.target.value)}
        />

        <button id="btnSearch" className="btn-info" onClick={handleSearch} disabled={loading}>
          {loading ? 'Đang tra cứu...' : 'Tra cứu'}
        </button>

        <h4>Thông tin chứng nhận</h4>
        <div id="searchResult" className="small">
          {result}
        </div>
      </div>
    </div>
  );
}

export default CertificateSearch;
