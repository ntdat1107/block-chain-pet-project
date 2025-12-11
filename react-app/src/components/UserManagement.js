import React, { useState } from 'react';
import './UserManagement.css';
import Web3Service from '../services/Web3Service';

function UserManagement({ account, isAdmin }) {
  const [newUser, setNewUser] = useState({ address: '', name: '', role: '3' });
  const [searchAddress, setSearchAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [coursesForAssignment, setCoursesForAssignment] = useState([]);
  const [assignedMap, setAssignedMap] = useState({});
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [assignmentPageSize, setAssignmentPageSize] = useState(10);

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

  // Load all courses for teacher assignment when viewing a teacher
  React.useEffect(() => {
    const loadForTeacher = async () => {
      if (!userDetails || userDetails.role !== 'TEACHER') {
        setAssignedMap({});
        setCoursesForAssignment([]);
        return;
      }
      try {
        const total = await Web3Service.getTotalCourses();
        const res = await Web3Service.getCourses(1, total || 1);
        const list = [];
        for (let i = 0; i < res.ids.length; i++) {
          if (res.ids[i] && res.ids[i] !== '0') {
            list.push({ id: res.ids[i], name: res.names[i], isActive: res.isActive[i] });
          }
        }
        setCoursesForAssignment(list);
        const map = {};
        for (const c of list) {
          try {
            const assigned = await Web3Service.isTeacherAssignedToCourse(userDetails.address, c.id);
            map[c.id] = assigned;
          } catch (err) {
            map[c.id] = false;
          }
        }
        setAssignedMap(map);
      } catch (err) {
        console.error('Lỗi khi tải môn cho phân công:', err);
        setCoursesForAssignment([]);
        setAssignedMap({});
      }
    };
    loadForTeacher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetails]);

  // whenever course list for assignment or selected user changes, reload assignments
  React.useEffect(() => {
    const loadAssignments = async () => {
      if (!userDetails || userDetails.role !== 'TEACHER') {
        setAssignedMap({});
        return;
      }
      const map = {};
      for (const c of coursesForAssignment) {
        try {
          const assigned = await Web3Service.isTeacherAssignedToCourse(userDetails.address, c.id);
          map[c.id] = assigned;
        } catch (err) {
          map[c.id] = false;
        }
      }
      setAssignedMap(map);
    };
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coursesForAssignment, userDetails]);

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

  // Course management moved to separate screen; assignment toggles below

  const toggleTeacherAssignment = async (teacherAddr, courseId, currentlyAssigned) => {
    setLoading(true);
    try {
      if (currentlyAssigned) {
        await Web3Service.revokeTeacherFromCourse(teacherAddr, courseId);
        setMessage('✅ Thu quyền giáo viên cho môn thành công');
      } else {
        await Web3Service.assignTeacherToCourse(teacherAddr, courseId);
        setMessage('✅ Gán giáo viên cho môn thành công');
      }
      // refresh user details (assignments reloaded by effect)
      loadUserDetails(teacherAddr);
    } catch (err) {
      setMessage('❌ Lỗi khi cập nhật quyền giáo viên: ' + err.message);
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

          {userDetails.role === 'TEACHER' && (
            <div className="teacher-assignments">
              <h5>📝 Phân công Môn học cho Giáo viên</h5>
              {coursesForAssignment.length === 0 ? (
                <p>Không có môn học để hiển thị.</p>
              ) : (
                <>
                  <div className="assign-table-wrapper">
                    <table className="assign-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Mã môn</th>
                          <th>Tên môn</th>
                          <th>Trạng thái</th>
                          <th>Đã phân công</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coursesForAssignment
                          .slice(
                            (assignmentPage - 1) * assignmentPageSize,
                            assignmentPage * assignmentPageSize
                          )
                          .map((c, idx) => (
                            <tr key={c.id} className={c.isActive ? '' : 'inactive-course'}>
                              <td>{(assignmentPage - 1) * assignmentPageSize + idx + 1}</td>
                              <td className="mono">{c.id}</td>
                              <td>{c.name}</td>
                              <td>{c.isActive ? '✅ Hoạt động' : '❌ Không hoạt động'}</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={!!assignedMap[c.id]}
                                  onChange={() =>
                                    toggleTeacherAssignment(
                                      userDetails.address,
                                      c.id,
                                      !!assignedMap[c.id]
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="assign-pagination">
                    <div className="page-controls">
                      <button
                        onClick={() => setAssignmentPage((p) => Math.max(1, p - 1))}
                        disabled={assignmentPage === 1}
                      >
                        ‹ Trước
                      </button>
                      <span>
                        Trang {assignmentPage} /{' '}
                        {Math.max(1, Math.ceil(coursesForAssignment.length / assignmentPageSize))}
                      </span>
                      <button
                        onClick={() =>
                          setAssignmentPage((p) =>
                            Math.min(
                              Math.ceil(coursesForAssignment.length / assignmentPageSize),
                              p + 1
                            )
                          )
                        }
                        disabled={
                          assignmentPage >=
                          Math.ceil(coursesForAssignment.length / assignmentPageSize)
                        }
                      >
                        Sau ›
                      </button>
                    </div>
                    <div className="page-size">
                      <label>Hiển thị:</label>
                      <select
                        value={assignmentPageSize}
                        onChange={(e) => {
                          setAssignmentPageSize(parseInt(e.target.value, 10));
                          setAssignmentPage(1);
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
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

      {/* Course management moved to a separate screen */}
    </div>
  );
}

export default UserManagement;
