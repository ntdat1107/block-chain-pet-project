import React, { useState, useEffect } from 'react';
import './App.css';
import WalletConnect from './components/WalletConnect';
import CertificateIssuer from './components/CertificateIssuer';
import CertificateSearch from './components/CertificateSearch';
import UserManagement from './components/UserManagement';
import Statistics from './components/Statistics';
import ShareVerify from './components/ShareVerify';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import Web3Service from './services/Web3Service';
// ThemeSwitcher removed

function App() {
  const [account, setAccount] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [isActiveUser, setIsActiveUser] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchUserInfo();
    const interval = setInterval(fetchUserInfo, 5000);
    return () => clearInterval(interval);
  }, [account]);

  // Role mapping: numeric values come from the smart contract `getUser` result
  // Contract enum: Role { NONE, ADMIN, TEACHER, STUDENT }
  const ROLE_NAMES = {
    0: 'NONE',
    1: 'ADMIN',
    2: 'TEACHER',
    3: 'STUDENT',
  };

  const ACTIONS_BY_ROLE = {
    NONE: ['Tìm kiếm chứng nhận'],
    ADMIN: [
      'Phát hành',
      'Tìm kiếm',
      'Quản lý người dùng',
      'Bảng điều khiển Admin',
      'Thống kê',
      'Chia sẻ & Xác minh',
    ],
    TEACHER: ['Phát hành', 'Tìm kiếm', 'Bảng điều khiển Giáo viên', 'Chia sẻ & Xác minh'],
    STUDENT: ['Tìm kiếm', 'Chia sẻ & Xác minh'],
  };

  const fetchUserInfo = async () => {
    try {
      const currentAccount = Web3Service.getCurrentAccount();
      if (currentAccount) {
        setAccount(currentAccount);
        const user = await Web3Service.getUser(currentAccount);
        if (user && user[0]) {
          const roleNum = parseInt(user[2]);
          setUserRole(roleNum);
          setIsAdmin(roleNum === 1);
          setUserName(user[1] || '');
          setIsActiveUser(Boolean(user[3]));
        } else {
          // No user record returned, reset role
          setUserRole(null);
          setIsAdmin(false);
          setUserName('');
          setIsActiveUser(false);
        }
      } else {
        // Not connected yet
        setUserRole(null);
        setIsAdmin(false);
        setUserName('');
        setIsActiveUser(false);
      }
    } catch (error) {
      console.log('Not logged in or error fetching user info:', error.message);
      setUserRole(null);
      setIsAdmin(false);
      setUserName('');
      setIsActiveUser(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h1 style={{ margin: 0 }}>🔗 Hệ thống Quản lý Chứng nhận Khóa học</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} />
        </div>
        <p className="subtitle">Ứng dụng Blockchain – MetaMask – Ganache</p>
        {account && (
          <p className="account-info">
            👤 Địa chỉ:{' '}
            <code>
              {account.substring(0, 10)}...{account.substring(account.length - 8)}
            </code>
            {/* Role badge (readable name) */}
            <span className="role-badge">{ROLE_NAMES[userRole] || 'Guest'}</span>
            {isAdmin && <span className="admin-badge">👑 ADMIN</span>}
          </p>
        )}
      </header>

      {/* Hide WalletConnect panel when already connected */}
      {!account && <WalletConnect onAccountChange={setAccount} />}

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Tổng quan
        </button>
        {/* `Phát hành` accessible to Admin and Teacher roles */}
        {(userRole === 1 || userRole === 2) && (
          <button
            className={`nav-btn ${activeTab === 'issue' ? 'active' : ''}`}
            onClick={() => setActiveTab('issue')}
          >
            🎓 Phát hành
          </button>
        )}
        <button
          className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔎 Tìm kiếm
        </button>
        {/* Admin Dashboard Tab */}
        {isAdmin && (
          <button
            className={`nav-btn ${activeTab === 'admin-dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin-dashboard')}
          >
            👑 Bảng điều khiển
          </button>
        )}
        {/* Teacher Dashboard Tab */}
        {userRole === 2 && (
          <button
            className={`nav-btn ${activeTab === 'teacher-dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('teacher-dashboard')}
          >
            📚 Bảng điều khiển
          </button>
        )}
        {/* Share & Verify tab: hide for STUDENT role */}
        {(userRole === 1 || userRole === 2) && (
          <button
            className={`nav-btn ${activeTab === 'share' ? 'active' : ''}`}
            onClick={() => setActiveTab('share')}
          >
            🔐 Chia sẻ & Xác minh
          </button>
        )}
        {isAdmin && (
          <>
            <button
              className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Người dùng
            </button>
            <button
              className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              📈 Thống kê
            </button>
          </>
        )}
      </nav>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'dashboard' && (
          <section className="dashboard-section">
            <div className="welcome-card">
              <h2>👋 Chào mừng!</h2>
              <p>
                Đây là hệ thống quản lý chứng nhận khóa học dựa trên công nghệ Blockchain. Sử dụng
                MetaMask để kết nối ví của bạn và bắt đầu sử dụng các chức năng.
              </p>
              {/* Role-specific actions summary */}
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px',
                  background: 'var(--card-bg)',
                  borderRadius: 6,
                }}
              >
                <strong>Vai trò hiện tại:</strong> {ROLE_NAMES[userRole] || 'Guest'}
                <div style={{ marginTop: 8 }}>
                  <strong>Hành động được phép:</strong>
                  <ul style={{ margin: '6px 0 0 18px' }}>
                    {(ACTIONS_BY_ROLE[ROLE_NAMES[userRole]] || ['Tìm kiếm', 'Chia sẻ']).map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎓</div>
                <h3>Phát hành Chứng nhận</h3>
                <p>Cấp chứng nhận cho học viên hoàn thành khóa học</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔎</div>
                <h3>Tìm kiếm Chứng nhận</h3>
                <p>Tìm và xem chi tiết chứng nhận đã phát hành</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔐</div>
                <h3>Xác minh & Chia sẻ</h3>
                <p>Xác minh chứng nhận và chia sẻ trên mạng xã hội</p>
              </div>
              {isAdmin && (
                <>
                  <div className="feature-card">
                    <div className="feature-icon">👥</div>
                    <h3>Quản lý Người dùng</h3>
                    <p>Thêm/sửa/xóa người dùng và phân quyền</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h3>Thống kê & Báo cáo</h3>
                    <p>Xem thống kê và xuất báo cáo hệ thống</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">👑</div>
                    <h3>Bảng điều khiển Admin</h3>
                    <p>Xem tất cả chứng chỉ, người dùng, và môn học</p>
                  </div>
                </>
              )}
              {userRole === 2 && (
                <div className="feature-card">
                  <div className="feature-icon">📚</div>
                  <h3>Bảng điều khiển Giáo viên</h3>
                  <p>Xem các môn và chứng chỉ được gán cho bạn</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'issue' && <CertificateIssuer />}

        {activeTab === 'search' && <CertificateSearch />}

        {activeTab === 'share' && <ShareVerify />}

        {activeTab === 'users' && isAdmin && <UserManagement account={account} isAdmin={isAdmin} />}

        {activeTab === 'stats' && isAdmin && <Statistics />}

        {activeTab === 'admin-dashboard' && isAdmin && (
          <AdminDashboard account={account} isAdmin={isAdmin} />
        )}

        {activeTab === 'teacher-dashboard' && userRole === 2 && (
          <TeacherDashboard account={account} userRole={userRole} />
        )}
      </div>

      <footer className="footer">
        <p>Đề tài: Xây dựng hệ thống quản lý chứng nhận khóa học bằng Blockchain</p>
        <p>© 2025 - Công nghệ Blockchain</p>
      </footer>
    </div>
  );
}

export default App;
