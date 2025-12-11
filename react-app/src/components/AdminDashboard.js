import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import Web3Service from '../services/Web3Service';
import CourseManagement from './CourseManagement';

function AdminDashboard({ account, isAdmin }) {
  const [activeTab, setActiveTab] = useState('certificates');

  // Certificates
  const [certificates, setCertificates] = useState([]);
  const [certificatesPage, setCertificatesPage] = useState(1);
  const [totalCerts, setTotalCerts] = useState(0);
  const CERTS_PAGE_SIZE = 5;

  // Users
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const USERS_PAGE_SIZE = 5;

  // Courses
  const [totalCourses, setTotalCourses] = useState(0);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const ROLES = {
    0: 'NONE',
    1: 'ADMIN',
    2: 'TEACHER',
    3: 'STUDENT',
  };

  // Load certificates (newest first)
  const loadCertificates = async (page) => {
    setLoading(true);
    try {
      console.log('[AdminDashboard] Loading certificates, page:', page);

      const total = await Web3Service.getTotalCertificates();
      console.log('[AdminDashboard] Total certificates:', total);
      setTotalCerts(total);

      if (total === 0) {
        console.log('[AdminDashboard] No certificates, skipping getCertificates call');
        setCertificates([]);
        setMessage('');
        setLoading(false);
        return;
      }

      const maxPage = Math.max(1, Math.ceil(total / CERTS_PAGE_SIZE));
      const pageToUse = Math.min(page, maxPage);
      console.log(
        '[AdminDashboard] Max page:',
        maxPage,
        'Page to use:',
        pageToUse,
        'Page size:',
        CERTS_PAGE_SIZE
      );

      const res = await Web3Service.getCertificates(pageToUse, CERTS_PAGE_SIZE);
      console.log('[AdminDashboard] getCertificates response:', res);

      // Optimized: studentAddresses now come directly from contract in single call
      // Previously: required N additional getCertificate() calls - now eliminated
      const list = [];
      for (let i = 0; i < res.ids.length; i++) {
        if (res.ids[i] && res.ids[i] !== '0') {
          list.push({
            id: res.ids[i],
            studentName: res.studentNames[i],
            studentAddress: res.studentAddresses[i] || '', // From contract, no extra calls needed
            courseName: res.courseNames[i],
            timestamp: new Date(parseInt(res.timestamps[i]) * 1000).toLocaleDateString('vi-VN'),
          });
        }
      }
      console.log('[AdminDashboard] Processed list:', list);
      setCertificates(list);
      setMessage('');
      if (pageToUse !== page) setCertificatesPage(pageToUse);
    } catch (err) {
      console.error('[AdminDashboard] Error loading certificates:', err);
      console.error('[AdminDashboard] Error details:', {
        message: err.message,
        code: err.code,
        data: err.data,
      });
      setCertificates([]);
      setMessage('❌ ' + err.message);
    }
    setLoading(false);
  };

  // Load users
  const loadUsers = async (page) => {
    setLoading(true);
    try {
      const total = await Web3Service.getTotalUsers();
      setTotalUsers(total);

      const maxPage = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
      const pageToUse = Math.min(page, maxPage);

      const res = await Web3Service.getUsers(pageToUse, USERS_PAGE_SIZE);
      const list = [];
      for (let i = 0; i < res.addresses.length; i++) {
        if (res.addresses[i]) {
          list.push({
            address: res.addresses[i],
            name: res.names[i],
            role: ROLES[res.roles[i]],
            isActive: res.isActive[i],
            createdDate: new Date(parseInt(res.createdDates[i]) * 1000).toLocaleDateString('vi-VN'),
          });
        }
      }
      setUsers(list);
      setMessage('');
      if (pageToUse !== page) setUsersPage(pageToUse);
    } catch (err) {
      console.error('Lỗi khi tải người dùng:', err);
      setUsers([]);
      setMessage('❌ ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    // Load totals on mount
    const loadTotals = async () => {
      try {
        const totalCerts = await Web3Service.getTotalCertificates();
        setTotalCerts(totalCerts);

        const totalUsrs = await Web3Service.getTotalUsers();
        setTotalUsers(totalUsrs);

        const totalCrs = await Web3Service.getTotalCourses();
        setTotalCourses(totalCrs);
      } catch (err) {
        console.error('Error loading totals:', err);
      }
    };
    loadTotals();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'certificates') {
      loadCertificates(certificatesPage);
    } else if (activeTab === 'users') {
      loadUsers(usersPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, certificatesPage, usersPage, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="admin-dashboard">
        <h3>👑 Bảng điều khiển Admin</h3>
        <p className="warning">⚠️ Chỉ Admin mới có thể truy cập tính năng này</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h3>👑 Bảng điều khiển Admin</h3>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>
      )}

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'certificates' ? 'active' : ''}`}
          onClick={() => setActiveTab('certificates')}
        >
          📄 Tất cả Chứng chỉ ({totalCerts})
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Tất cả Người dùng ({totalUsers})
        </button>
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Tất cả Môn học ({totalCourses})
        </button>
      </div>

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="tab-panel">
          <h4>📄 Danh sách Chứng chỉ (Từ mới nhất)</h4>
          {certificates.length === 0 ? (
            <p>Không có chứng chỉ nào.</p>
          ) : (
            <div className="list-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Học viên</th>
                    <th>Địa chỉ Học viên</th>
                    <th>Môn học</th>
                    <th>Ngày phát hành</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => (
                    <tr key={cert.id}>
                      <td>{cert.id}</td>
                      <td>{cert.studentName}</td>
                      <td className="address">{cert.studentAddress}</td>
                      <td>{cert.courseName}</td>
                      <td>{cert.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="pager">
            <button
              onClick={() => setCertificatesPage((p) => Math.max(1, p - 1))}
              disabled={certificatesPage === 1 || loading}
            >
              « Trước
            </button>
            <span>Trang {certificatesPage}</span>
            <button
              onClick={() => setCertificatesPage((p) => p + 1)}
              disabled={loading || certificatesPage * CERTS_PAGE_SIZE >= totalCerts}
            >
              Sau »
            </button>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="tab-panel">
          <h4>👥 Danh sách Người dùng</h4>
          {users.length === 0 ? (
            <p>Không có người dùng nào.</p>
          ) : (
            <div className="list-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Địa chỉ</th>
                    <th>Tên</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.address}>
                      <td className="address">{user.address}</td>
                      <td>{user.name}</td>
                      <td className={`role ${user.role.toLowerCase()}`}>{user.role}</td>
                      <td className={user.isActive ? 'active' : 'inactive'}>
                        {user.isActive ? '✅ Hoạt động' : '❌ Vô hiệu'}
                      </td>
                      <td>{user.createdDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="pager">
            <button
              onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
              disabled={usersPage === 1 || loading}
            >
              « Trước
            </button>
            <span>Trang {usersPage}</span>
            <button
              onClick={() => setUsersPage((p) => p + 1)}
              disabled={loading || usersPage * USERS_PAGE_SIZE >= totalUsers}
            >
              Sau »
            </button>
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="tab-panel">
          <CourseManagement />
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
