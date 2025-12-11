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
    studentAddress: '',
    courseId: '',
    courseName: '',
    issueDate: '',
    extraInfo: '',
  });
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // Format address with ellipsis: 0x1234...5678
  const formatAddressShort = (address) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Load all students when component mounts
  React.useEffect(() => {
    const loadStudents = async () => {
      try {
        const studentList = await Web3Service.getAllStudents();
        setStudents(studentList);
      } catch (err) {
        console.error('Lỗi khi tải danh sách học viên:', err);
        setStudents([]);
      }
    };
    loadStudents();
  }, []);

  const handleSelectStudent = (address, name) => {
    setFormData({ ...formData, studentAddress: address });
    setShowStudentDropdown(false);
  };

  const handleIssue = async () => {
    if (!Web3Service.getCurrentAccount()) {
      alert('Vui lòng kết nối ví trước.');
      return;
    }

    // Validate student address format
    if (!formData.studentAddress) {
      alert('Vui lòng nhập địa chỉ tài khoản học viên.');
      return;
    }

    // Check if address is valid Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.studentAddress)) {
      alert('Địa chỉ tài khoản không hợp lệ.');
      return;
    }

    if (!formData.courseId || !formData.issueDate) {
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
          studentAddress: formData.studentAddress,
          studentId: formData.studentId,
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
        formData.studentAddress,
        parseInt(formData.courseId, 10),
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
        studentAddress: '',
        courseId: '',
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

  // Load all courses for dropdown (no pagination)
  const loadAllCourses = async () => {
    try {
      const total = await Web3Service.getTotalCourses();
      const res = await Web3Service.getCourses(1, total || 1);
      const list = [];
      for (let i = 0; i < res.ids.length; i++) {
        if (res.ids[i] && res.ids[i] !== '0') {
          // use isActive if available else fallback to true
          list.push({
            id: res.ids[i],
            name: res.names[i],
            isActive: res.isActive ? res.isActive[i] : true,
          });
        }
      }
      setCourses(list);
    } catch (err) {
      console.error('Lỗi khi tải danh sách môn:', err);
      setCourses([]);
    }
  };

  React.useEffect(() => {
    loadAllCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      const container = document.getElementById('studentDropdownContainer');
      if (container && !container.contains(e.target)) {
        setShowStudentDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // compute filtered students based on input (address or name)
  const filteredStudents = React.useMemo(() => {
    const query = (formData.studentAddress || '').trim().toLowerCase();
    if (!query) return students;
    return students.filter((s) => {
      const addr = (s.address || '').toLowerCase();
      const name = (s.name || '').toLowerCase();
      return addr.includes(query) || name.includes(query);
    });
  }, [students, formData.studentAddress]);

  return (
    <div className="col-6">
      <div className="card">
        <h3>Cấp chứng nhận mới</h3>

        <label>Địa chỉ tài khoản học viên</label>
        <div id="studentDropdownContainer" className="student-dropdown-container">
          <input
            id="inputStudentAddress"
            type="text"
            placeholder="Nhấp để chọn hoặc nhập địa chỉ 0x..."
            value={formData.studentAddress}
            onChange={(e) => setFormData({ ...formData, studentAddress: e.target.value })}
            onFocus={() => setShowStudentDropdown(true)}
          />
          {showStudentDropdown && students.length > 0 && (
            <div className="student-dropdown">
              {filteredStudents.map((student) => (
                <div
                  key={student.address}
                  className="student-dropdown-item"
                  onClick={() => handleSelectStudent(student.address, student.name)}
                >
                  {formatAddressShort(student.address)} - {student.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <label>Chọn môn học</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={formData.courseId}
            onChange={(e) => {
              const selected = courses.find((c) => String(c.id) === String(e.target.value));
              setFormData({
                ...formData,
                courseId: e.target.value,
                courseName: selected ? selected.name : '',
              });
            }}
          >
            <option value="">-- Chọn môn --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div>{/* No pagination for course dropdown; all courses loaded above */}</div>
        </div>

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
