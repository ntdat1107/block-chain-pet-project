import React, { useState } from 'react';
import './UserManagement.css';
import Web3Service from '../services/Web3Service';

function UserManagement({ account, isAdmin }) {
  const [newUser, setNewUser] = useState({ address: '', name: '', role: '3' });
  const [searchAddress, setSearchAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userDetails, setUserDetails] = useState(null);

  const ROLES = {
    0: 'NONE',
    1: 'ADMIN',
    2: 'TEACHER',
    3: 'STUDENT',
  };

  const roleOptions = [
    { value: '1', label: 'Admin' },
    { value: '2', label: 'Teacher' },
    { value: '3', label: 'Student' },
  ];

  // For add-user form we disallow creating another Admin from UI
  const addRoleOptions = roleOptions.filter((r) => r.value !== '1');
  // For update-role select we also disallow promoting someone to Admin
  const updateRoleOptions = roleOptions.filter((r) => r.value !== '1');

  // Add new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.address || !newUser.name) {
      setMessage('❌ Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      await Web3Service.addUser(newUser.address, newUser.name, parseInt(newUser.role));
      setMessage('✅ Thêm người dùng thành công!');
      setNewUser({ address: '', name: '', role: '3' });
      // Refresh users list
      setTimeout(() => loadUserDetails(newUser.address), 2000);
    } catch (error) {
      console.error('Error adding user:', error);
      setMessage(`❌ Lỗi: ${error.message}`);
    }
    setLoading(false);
  };

  // Get user details
  const loadUserDetails = async (address) => {
    try {
      const details = await Web3Service.getUser(address);
      if (details && details[0]) {
        setUserDetails({
          address: details[0],
          name: details[1],
          role: ROLES[details[2]],
          isActive: details[3],
          createdDate: new Date(details[4] * 1000).toLocaleDateString('vi-VN'),
        });
        setMessage('');
        return;
      }
      // fallback: clear
      setUserDetails(null);
    } catch (error) {
      console.error('Error loading user:', error);
      setUserDetails(null);
      setMessage('❌ Không tìm thấy người dùng');
    }
  };

  // Update user role
  const handleUpdateRole = async (userAddress, newRole) => {
    setLoading(true);
    try {
      await Web3Service.updateUserRole(userAddress, newRole);
      setMessage('✅ Cập nhật vai trò thành công!');
      loadUserDetails(userAddress);
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage(`❌ Lỗi: ${error.message}`);
    }
    setLoading(false);
  };

  // Deactivate user
  const handleDeactivateUser = async (userAddress) => {
    if (!window.confirm('Bạn chắc chắn muốn vô hiệu hóa người dùng này?')) return;

    setLoading(true);
    try {
      await Web3Service.deactivateUser(userAddress);
      setMessage('✅ Vô hiệu hóa người dùng thành công!');
      loadUserDetails(userAddress);
    } catch (error) {
      console.error('Error deactivating user:', error);
      setMessage(`❌ Lỗi: ${error.message}`);
    }
    setLoading(false);
  };

  // Reactivate user
  const handleReactivateUser = async (userAddress) => {
    if (!window.confirm('Bạn chắc chắn muốn kích hoạt lại người dùng này?')) return;

    setLoading(true);
    try {
      await Web3Service.reactivateUser(userAddress);
      setMessage('✅ Kích hoạt lại người dùng thành công!');
      loadUserDetails(userAddress);
    } catch (error) {
      console.error('Error reactivating user:', error);
      setMessage(`❌ Lỗi: ${error.message}`);
    }
    setLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="user-management">
        <h3>👤 Quản lý Người dùng</h3>
        <p className="warning">⚠️ Chỉ Admin mới có thể quản lý người dùng</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <h3>👤 Quản lý Người dùng & Phân quyền</h3>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>
      )}

      {/* Add New User Form */}
      <div className="form-section">
        <h4>Thêm Người dùng Mới</h4>
        <form onSubmit={handleAddUser}>
          <input
            type="text"
            placeholder="Địa chỉ Ethereum (0x...)"
            value={newUser.address}
            onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
          />
          <input
            type="text"
            placeholder="Tên người dùng"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            {addRoleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading}>
            {loading ? '⏳ Đang xử lý...' : '➕ Thêm Người dùng'}
          </button>
        </form>
      </div>

      {/* Search User */}
      <div className="form-section">
        <h4>Tìm kiếm Người dùng</h4>
        <div className="search-user">
          <input
            type="text"
            placeholder="Nhập địa chỉ Ethereum"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
          />
          <button
            onClick={() => {
              setMessage('');
              if (!searchAddress || !searchAddress.startsWith('0x')) {
                setMessage('❌ Vui lòng nhập địa chỉ hợp lệ (bắt đầu bằng 0x)');
                setUserDetails(null);
                return;
              }
              loadUserDetails(searchAddress);
            }}
            disabled={loading}
          >
            🔎 Tìm kiếm
          </button>
        </div>
      </div>

      {/* User Details */}
      {userDetails && (
        <div className="user-details-card">
          <h4>Chi tiết Người dùng</h4>
          <div className="details-grid">
            <div className="detail-item">
              <label>Địa chỉ:</label>
              <span className="address">{userDetails.address}</span>
            </div>
            <div className="detail-item">
              <label>Tên:</label>
              <span>{userDetails.name}</span>
            </div>
            <div className="detail-item">
              <label>Vai trò:</label>
              <span className={`role ${userDetails.role.toLowerCase()}`}>{userDetails.role}</span>
            </div>
            <div className="detail-item">
              <label>Trạng thái:</label>
              <span className={userDetails.isActive ? 'active' : 'inactive'}>
                {userDetails.isActive ? '✅ Hoạt động' : '❌ Vô hiệu'}
              </span>
            </div>
            <div className="detail-item">
              <label>Ngày tạo:</label>
              <span>{userDetails.createdDate}</span>
            </div>
          </div>

          <div className="action-buttons">
            <select
              onChange={(e) => handleUpdateRole(userDetails.address, parseInt(e.target.value))}
              defaultValue={Object.keys(ROLES).find((key) => ROLES[key] === userDetails.role)}
              disabled={loading || userDetails.role === 'ADMIN'}
            >
              {updateRoleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  Đổi thành: {role.label}
                </option>
              ))}
            </select>

            {userDetails.isActive ? (
              <button
                className="deactivate-btn"
                onClick={() => handleDeactivateUser(userDetails.address)}
                disabled={loading || userDetails.role === 'ADMIN'}
                title={userDetails.role === 'ADMIN' ? 'Không thể vô hiệu hóa Admin' : ''}
              >
                {loading
                  ? '⏳ Đang xử lý...'
                  : userDetails.role === 'ADMIN'
                  ? '👑 Admin (không thể vô hiệu)'
                  : '🚫 Vô hiệu hóa'}
              </button>
            ) : (
              <button
                className="reactivate-btn"
                onClick={() => handleReactivateUser(userDetails.address)}
                disabled={loading}
              >
                {loading ? '⏳ Đang xử lý...' : '✅ Kích hoạt lại'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Role Legend */}
      <div className="role-legend">
        <h4>📋 Giải thích Vai trò:</h4>
        <ul>
          <li>
            <strong>ADMIN:</strong> Quản lý hệ thống, thêm/sửa/xóa người dùng
          </li>
          <li>
            <strong>TEACHER:</strong> Phát hành chứng nhận cho học viên
          </li>
          <li>
            <strong>STUDENT:</strong> Nhận chứng nhận, xem lịch sử
          </li>
        </ul>
      </div>
    </div>
  );
}

export default UserManagement;
