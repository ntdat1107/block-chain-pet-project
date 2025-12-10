import React, { useState, useEffect } from 'react';
import './Statistics.css';
import Web3Service from '../services/Web3Service';

function Statistics() {
  const [stats, setStats] = useState({
    totalCertificates: 0,
    auditLogs: [],
    courseData: {},
    teacherData: {},
  });
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStatistics();
    const interval = setInterval(loadStatistics, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const totalCerts = await Web3Service.getTotalCertificates();
      const auditLogCount = await Web3Service.getTotalAuditLogs();

      let auditLogs = [];
      for (let i = Math.max(1, auditLogCount - 20); i <= auditLogCount; i++) {
        try {
          const log = await Web3Service.getAuditLog(i);
          if (log && log[0]) {
            auditLogs.push({
              id: log[0],
              actor: log[1],
              action: log[2],
              certificateId: log[3],
              timestamp: new Date(log[4] * 1000).toLocaleString('vi-VN'),
            });
          }
        } catch (e) {
          // Continue even if a log fails
        }
      }

      setStats({
        totalCertificates: totalCerts,
        auditLogs: auditLogs.reverse(),
        courseData: {},
        teacherData: {},
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
    setLoading(false);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Hành động', 'ID Chứng nhận', 'Người thực hiện', 'Thời gian'];
    const rows = stats.auditLogs.map((log) => [
      log.id,
      log.action,
      log.certificateId,
      log.actor,
      log.timestamp,
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Export to PDF
  const exportToPDF = () => {
    const content = `
BÁNG KÊ THỐNG KÊ HỆ THỐNG QUẢN LÝ CHỨNG NHẬN
Ngày xuất: ${new Date().toLocaleString('vi-VN')}

THỐNG KÊ CHUNG:
- Tổng số chứng nhận phát hành: ${stats.totalCertificates}
- Tổng số hoạt động ghi nhật ký: ${stats.auditLogs.length}

NHẬT KÝ HOẠT ĐỘNG (20 mục gần nhất):
${stats.auditLogs
  .map(
    (log, idx) =>
      `${idx + 1}. ID: ${log.id} | Hành động: ${log.action} | Người thực hiện: ${
        log.actor
      } | Thời gian: ${log.timestamp}`
  )
  .join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  // Filter and search logs
  const filteredLogs = stats.auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toString().includes(searchTerm);

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'issued') return log.action.includes('Issued') && matchesSearch;
    if (filterType === 'verified') return log.action.includes('Verified') && matchesSearch;
    if (filterType === 'user')
      return (log.action.includes('User') || log.action.includes('Role')) && matchesSearch;

    return matchesSearch;
  });

  return (
    <div className="statistics">
      <h3>📊 Thống kê & Báo cáo</h3>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <h4>Tổng Chứng nhận</h4>
            <p className="stat-number">{stats.totalCertificates}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h4>Hoạt động ghi nhật ký</h4>
            <p className="stat-number">{stats.auditLogs.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h4>Cập nhật lần cuối</h4>
            <p className="stat-time">{new Date().toLocaleTimeString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="export-section">
        <h4>📥 Xuất Báo cáo</h4>
        <div className="export-buttons">
          <button className="btn-export csv" onClick={exportToCSV}>
            📄 Xuất CSV
          </button>
          <button className="btn-export pdf" onClick={exportToPDF}>
            📋 Xuất Báng kê
          </button>
          <button className="btn-refresh" onClick={loadStatistics} disabled={loading}>
            {loading ? '⏳ Đang tải...' : '🔄 Tải lại'}
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="filter-section">
        <h4>🔍 Lọc & Tìm kiếm</h4>
        <div className="filter-controls">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Tất cả hoạt động</option>
            <option value="issued">Chứng nhận phát hành</option>
            <option value="verified">Chứng nhận xác minh</option>
            <option value="user">Quản lý người dùng</option>
          </select>
          <input
            type="text"
            placeholder="Tìm kiếm theo hành động, địa chỉ, hoặc ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="result-count">{filteredLogs.length} kết quả</span>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="logs-section">
        <h4>📋 Nhật ký Hoạt động</h4>
        {filteredLogs.length > 0 ? (
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hành động</th>
                  <th>Người thực hiện</th>
                  <th>ID Chứng nhận</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`log-${log.action.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <td className="log-id">{log.id}</td>
                    <td className="log-action">
                      <span className="action-badge">{log.action}</span>
                    </td>
                    <td className="log-actor">
                      <code>
                        {log.actor.substring(0, 10)}...{log.actor.substring(log.actor.length - 8)}
                      </code>
                    </td>
                    <td className="log-cert-id">
                      {log.certificateId > 0 ? log.certificateId : '—'}
                    </td>
                    <td className="log-timestamp">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-logs">Không có hoạt động nào</p>
        )}
      </div>

      {/* Statistics Legend */}
      <div className="legend-section">
        <h4>📌 Giải thích</h4>
        <div className="legend-grid">
          <div className="legend-item">
            <span className="action-badge">Certificate Issued</span>
            <span>Chứng nhận được phát hành</span>
          </div>
          <div className="legend-item">
            <span className="action-badge">Certificate Verified</span>
            <span>Chứng nhận được xác minh</span>
          </div>
          <div className="legend-item">
            <span className="action-badge">User Added</span>
            <span>Người dùng mới được thêm</span>
          </div>
          <div className="legend-item">
            <span className="action-badge">User Role Updated</span>
            <span>Vai trò người dùng được cập nhật</span>
          </div>
          <div className="legend-item">
            <span className="action-badge">User Deactivated</span>
            <span>Người dùng bị vô hiệu hóa</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
