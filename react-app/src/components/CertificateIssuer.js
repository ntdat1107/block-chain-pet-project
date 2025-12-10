import React, { useState } from 'react';
import './CertificateIssuer.css';
import Web3Service from '../services/Web3Service';

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

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id.replace('input', '').charAt(0).toLowerCase() + id.slice('input'.length + 1)]: value,
    }));
  };

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
    setResult('Đang gửi giao dịch, vui lòng xác nhận trên MetaMask...');

    try {
      const response = await Web3Service.issueCertificate(
        formData.studentName,
        formData.studentEmail,
        formData.courseName,
        formData.issueDate,
        formData.extraInfo
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
