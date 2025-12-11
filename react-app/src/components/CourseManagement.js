import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import Web3Service from '../services/Web3Service';

function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [coursesPage, setCoursesPage] = useState(1);
  const COURSES_PAGE_SIZE = 5;
  const [newCourse, setNewCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [totalCourses, setTotalCourses] = useState(0);

  const loadCourses = async (page) => {
    setLoading(true);
    try {
      const total = await Web3Service.getTotalCourses();
      setTotalCourses(total);

      const maxPage = Math.max(1, Math.ceil(total / COURSES_PAGE_SIZE));
      const pageToUse = Math.min(page, maxPage);

      const res = await Web3Service.getCourses(pageToUse, COURSES_PAGE_SIZE);
      const list = [];
      for (let i = 0; i < res.ids.length; i++) {
        if (res.ids[i] && res.ids[i] !== '0') {
          list.push({ id: res.ids[i], name: res.names[i], isActive: res.isActive[i] });
        }
      }
      setCourses(list);
      if (pageToUse !== page) setCoursesPage(pageToUse);
    } catch (err) {
      console.error('Lỗi khi tải môn học:', err);
      setCourses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCourses(coursesPage);
  }, [coursesPage]);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourse) {
      setMessage('❌ Vui lòng nhập tên môn học');
      return;
    }
    setLoading(true);
    try {
      await Web3Service.addCourse(newCourse);
      setMessage('✅ Thêm môn học thành công');
      setNewCourse('');
      loadCourses(coursesPage);
    } catch (err) {
      setMessage('❌ Lỗi khi thêm môn: ' + err.message);
    }
    setLoading(false);
  };

  const handleDeactivateCourse = async (courseId) => {
    if (!window.confirm('Bạn chắc chắn muốn vô hiệu hóa môn học này?')) return;
    setLoading(true);
    try {
      await Web3Service.deactivateCourse(courseId);
      setMessage('✅ Vô hiệu hóa môn học thành công');
      loadCourses(coursesPage);
    } catch (err) {
      setMessage('❌ Lỗi khi vô hiệu hóa môn: ' + err.message);
    }
    setLoading(false);
  };

  const handleActivateCourse = async (courseId) => {
    setLoading(true);
    try {
      await Web3Service.activateCourse(courseId);
      setMessage('✅ Kích hoạt môn học thành công');
      loadCourses(coursesPage);
    } catch (err) {
      setMessage('❌ Lỗi khi kích hoạt môn: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h4>📚 Danh sách Môn học</h4>
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>
      )}

      <form onSubmit={handleAddCourse} className="add-course-form">
        <input
          type="text"
          placeholder="Tên môn học"
          value={newCourse}
          onChange={(e) => setNewCourse(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? '⏳ Đang xử lý...' : '➕ Thêm Môn'}
        </button>
      </form>

      {courses.length === 0 ? (
        <p>Không có môn học trong trang này.</p>
      ) : (
        <div className="list-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên môn</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td className={c.isActive ? 'active' : 'inactive'}>
                    {c.isActive ? '✅ Hoạt động' : '❌ Vô hiệu'}
                  </td>
                  <td>
                    {c.id > 3 ? (
                      c.isActive ? (
                        <button
                          className="deactivate-btn"
                          onClick={() => handleDeactivateCourse(c.id)}
                          disabled={loading}
                        >
                          {loading ? '⏳ Đang xử lý...' : '🚫 Vô hiệu'}
                        </button>
                      ) : (
                        <button
                          className="activate-btn"
                          onClick={() => handleActivateCourse(c.id)}
                          disabled={loading}
                        >
                          {loading ? '⏳ Đang xử lý...' : '✅ Kích hoạt'}
                        </button>
                      )
                    ) : (
                      <em className="protected"> (môn bắt buộc)</em>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pager">
        <button
          onClick={() => setCoursesPage((p) => Math.max(1, p - 1))}
          disabled={coursesPage === 1 || loading}
        >
          « Trước
        </button>
        <span>Trang {coursesPage}</span>
        <button
          onClick={() => setCoursesPage((p) => p + 1)}
          disabled={loading || coursesPage * COURSES_PAGE_SIZE >= totalCourses}
        >
          Sau »
        </button>
      </div>
    </div>
  );
}

export default CourseManagement;
