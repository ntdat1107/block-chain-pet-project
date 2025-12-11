import React, { useState, useEffect } from 'react';
import './TeacherDashboard.css';
import Web3Service from '../services/Web3Service';

function TeacherDashboard({ account, userRole }) {
  const [activeTab, setActiveTab] = useState('courses');

  // Courses
  const [courses, setCourses] = useState([]);
  const [coursesPage, setCoursesPage] = useState(1);
  const COURSES_PAGE_SIZE = 5;
  const [teacherHasMore, setTeacherHasMore] = useState(false);

  // Certificates
  const [certificates, setCertificates] = useState([]);
  const [certificatesPage, setCertificatesPage] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const CERTS_PAGE_SIZE = 5;
  const [certsHasMore, setCertsHasMore] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load teacher's courses
  const loadTeacherCourses = async (page) => {
    setLoading(true);
    try {
      // request one extra to detect whether there's a next page
      const res = await Web3Service.getTeacherCourses(account, page, COURSES_PAGE_SIZE + 1);
      const list = [];
      for (let i = 0; i < res.ids.length && i < COURSES_PAGE_SIZE; i++) {
        if (res.ids[i] && res.ids[i] !== '0') {
          list.push({
            id: res.ids[i],
            name: res.names[i],
          });
        }
      }
      setCourses(list);
      setTeacherHasMore(res.ids.length > COURSES_PAGE_SIZE);
      if (list.length > 0 && !selectedCourseId) {
        setSelectedCourseId(list[0].id);
      }
      setMessage('');
    } catch (err) {
      console.error('Lỗi khi tải môn học:', err);
      setCourses([]);
      setTeacherHasMore(false);
      setMessage('❌ ' + err.message);
    }
    setLoading(false);
  };

  // Load certificates for selected course
  const loadCertificatesForCourse = async (courseId, page) => {
    if (!courseId) return;
    setLoading(true);
    try {
      // request one extra to detect next page
      const res = await Web3Service.getCertificatesByCourse(courseId, page, CERTS_PAGE_SIZE + 1);
      const list = [];
      for (let i = 0; i < res.ids.length && i < CERTS_PAGE_SIZE; i++) {
        if (res.ids[i] && res.ids[i] !== '0') {
          list.push({
            id: res.ids[i],
            studentName: res.studentNames[i],
            timestamp: new Date(parseInt(res.timestamps[i]) * 1000).toLocaleDateString('vi-VN'),
          });
        }
      }
      setCertificates(list);
      setCertsHasMore(res.ids.length > CERTS_PAGE_SIZE);
      setMessage('');
    } catch (err) {
      console.error('Lỗi khi tải chứng chỉ:', err);
      setCertificates([]);
      setCertsHasMore(false);
      setMessage('❌ ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userRole !== 2 || !account) return; // Only for teachers
    if (activeTab === 'courses') {
      loadTeacherCourses(coursesPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, coursesPage, account, userRole]);

  useEffect(() => {
    if (activeTab === 'certificates' && selectedCourseId) {
      loadCertificatesForCourse(selectedCourseId, certificatesPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, certificatesPage, selectedCourseId]);

  if (userRole !== 2) {
    return (
      <div className="teacher-dashboard">
        <h3>📚 Bảng điều khiển Giáo viên</h3>
        <p className="warning">⚠️ Chỉ Giáo viên mới có thể truy cập tính năng này</p>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <h3>📚 Bảng điều khiển Giáo viên</h3>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>
      )}

      {/* Tab Navigation */}
      <div className="teacher-tabs">
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Các môn học của tôi ({courses.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'certificates' ? 'active' : ''}`}
          onClick={() => setActiveTab('certificates')}
          disabled={courses.length === 0}
        >
          📄 Chứng chỉ ({courses.length > 0 ? 'Xem' : '0'})
        </button>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="tab-panel">
          <h4>📚 Danh sách Các môn được gán</h4>
          {courses.length === 0 ? (
            <p>Bạn chưa được gán môn học nào.</p>
          ) : (
            <div className="courses-list">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="course-card"
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    setActiveTab('certificates');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <h5>{course.name}</h5>
                  <p className="course-id">Mã môn: {course.id}</p>
                  <p className="action">Nhấp để xem chứng chỉ →</p>
                </div>
              ))}
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
              disabled={loading || !teacherHasMore}
            >
              Sau »
            </button>
          </div>
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="tab-panel">
          {courses.length > 0 && (
            <>
              <h4>📄 Chứng chỉ - Môn: {courses.find((c) => c.id === selectedCourseId)?.name}</h4>
              <div className="course-selector">
                <label>Chọn môn:</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(parseInt(e.target.value));
                    setCertificatesPage(1);
                  }}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} (ID: {course.id})
                    </option>
                  ))}
                </select>
              </div>

              {certificates.length === 0 ? (
                <p>Không có chứng chỉ nào cho môn này.</p>
              ) : (
                <div className="list-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Học viên</th>
                        <th>Ngày phát hành</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((cert) => (
                        <tr key={cert.id}>
                          <td>{cert.id}</td>
                          <td>{cert.studentName}</td>
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
                  disabled={loading || !certsHasMore}
                >
                  Sau »
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
