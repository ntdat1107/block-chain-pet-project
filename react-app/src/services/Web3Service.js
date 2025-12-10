import Web3 from 'web3';

const CONTRACT_ADDRESS = '0x2d9809B1fC3b11598820F901F0772d0452861B14';

const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'logId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'actor',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'action',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'certificateId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'AuditLogCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'studentName',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'studentEmailOrId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'courseName',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'issueDate',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'extraInfo',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'issuer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'ipfsHash',
        type: 'string',
      },
    ],
    name: 'CertificateIssued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'certificateId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'verifier',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'CertificateVerified',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'userAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'role',
        type: 'uint256',
      },
    ],
    name: 'UserAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'userAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldRole',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newRole',
        type: 'uint256',
      },
    ],
    name: 'UserRoleUpdated',
    type: 'event',
  },
  {
    inputs: [],
    name: 'auditLogCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'auditLogs',
    outputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'actor',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'action',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'certificateId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'certificateCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'certificates',
    outputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'studentName',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'studentEmailOrId',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'courseName',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'issueDate',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'extraInfo',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'issuer',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'ipfsHash',
        type: 'string',
      },
      {
        internalType: 'bool',
        name: 'isVerified',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    name: 'courseStats',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'issuedByTeacher',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'users',
    outputs: [
      {
        internalType: 'address',
        name: 'userAddress',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'enum CourseCertificate.Role',
        name: 'role',
        type: 'uint8',
      },
      {
        internalType: 'bool',
        name: 'isActive',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'createdDate',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_userAddress',
        type: 'address',
      },
      {
        internalType: 'string',
        name: '_name',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: '_role',
        type: 'uint256',
      },
    ],
    name: 'addUser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_userAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_newRole',
        type: 'uint256',
      },
    ],
    name: 'updateUserRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_userAddress',
        type: 'address',
      },
    ],
    name: 'deactivateUser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_userAddress',
        type: 'address',
      },
    ],
    name: 'getUser',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_studentName',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_studentEmailOrId',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_courseName',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_issueDate',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_extraInfo',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_ipfsHash',
        type: 'string',
      },
    ],
    name: 'issueCertificate',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_id',
        type: 'uint256',
      },
    ],
    name: 'getCertificate',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_id',
        type: 'uint256',
      },
    ],
    name: 'verifyCertificate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_userAddress',
        type: 'address',
      },
    ],
    name: 'reactivateUser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_id',
        type: 'uint256',
      },
    ],
    name: 'getCertificateVerificationStatus',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'getTotalCertificates',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'getTotalUsers',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_courseName',
        type: 'string',
      },
    ],
    name: 'getCourseStatistic',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_teacher',
        type: 'address',
      },
    ],
    name: 'getTeacherStatistic',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_logId',
        type: 'uint256',
      },
    ],
    name: 'getAuditLog',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'getTotalAuditLogs',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
];

class Web3Service {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.currentAccount = null;
  }

  isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined';
  }

  async initializeWeb3() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask không được cài đặt. Vui lòng cài đặt MetaMask extension.');
    }

    this.web3 = new Web3(window.ethereum);
    this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    return true;
  }

  async connectWallet() {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.currentAccount = accounts[0];
      return this.currentAccount;
    } catch (error) {
      throw new Error('Không thể kết nối ví: ' + error.message);
    }
  }

  async issueCertificate(studentName, studentEmail, courseName, issueDate, extraInfo, ipfsHash) {
    if (!this.contract || !this.currentAccount) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const receipt = await this.contract.methods
        .issueCertificate(
          studentName,
          studentEmail,
          courseName,
          issueDate,
          extraInfo,
          ipfsHash || ''
        )
        .send({ from: this.currentAccount });

      const eventData = receipt.events.CertificateIssued.returnValues;
      return {
        certificateId: eventData.id,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      throw new Error('Lỗi khi cấp chứng nhận: ' + error.message);
    }
  }

  async getCertificate(id) {
    if (!this.contract) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const cert = await this.contract.methods.getCertificate(id).call();
      return [
        cert[0],
        cert[1],
        cert[2],
        cert[3],
        cert[4],
        cert[5],
        cert[6],
        cert[7],
        cert[8],
        cert[9],
      ];
    } catch (error) {
      throw new Error('Không tìm thấy chứng nhận.');
    }
  }

  // ==================== USER MANAGEMENT ====================
  async addUser(userAddress, name, role) {
    if (!this.contract || !this.currentAccount) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const receipt = await this.contract.methods
        .addUser(userAddress, name, role)
        .send({ from: this.currentAccount });
      return receipt;
    } catch (error) {
      throw new Error('Lỗi khi thêm người dùng: ' + error.message);
    }
  }

  async updateUserRole(userAddress, newRole) {
    if (!this.contract || !this.currentAccount) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const receipt = await this.contract.methods
        .updateUserRole(userAddress, newRole)
        .send({ from: this.currentAccount });
      return receipt;
    } catch (error) {
      throw new Error('Lỗi khi cập nhật vai trò: ' + error.message);
    }
  }

  async deactivateUser(userAddress) {
    if (!this.contract || !this.currentAccount) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const receipt = await this.contract.methods
        .deactivateUser(userAddress)
        .send({ from: this.currentAccount });
      return receipt;
    } catch (error) {
      throw new Error('Lỗi khi vô hiệu hóa người dùng: ' + error.message);
    }
  }

  async reactivateUser(userAddress) {
    if (!this.contract || !this.currentAccount) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const receipt = await this.contract.methods
        .reactivateUser(userAddress)
        .send({ from: this.currentAccount });
      return receipt;
    } catch (error) {
      throw new Error('Lỗi khi kích hoạt lại người dùng: ' + error.message);
    }
  }

  async getUser(userAddress) {
    if (!this.contract) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const user = await this.contract.methods.getUser(userAddress).call();
      return user;
    } catch (error) {
      throw new Error('Lỗi khi lấy thông tin người dùng: ' + error.message);
    }
  }

  // ==================== CERTIFICATE ISSUE WITH IPFS ====================
  async issueCertificateWithIPFS(
    studentName,
    studentEmail,
    courseName,
    issueDate,
    extraInfo,
    ipfsHash
  ) {
    if (!this.contract || !this.currentAccount) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const receipt = await this.contract.methods
        .issueCertificate(
          studentName,
          studentEmail,
          courseName,
          issueDate,
          extraInfo,
          ipfsHash || ''
        )
        .send({ from: this.currentAccount });

      const eventData = receipt.events.CertificateIssued.returnValues;
      return {
        certificateId: eventData.id,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      throw new Error('Lỗi khi cấp chứng nhận: ' + error.message);
    }
  }

  // ==================== VERIFICATION ====================
  async verifyCertificate(certificateId) {
    if (!this.contract || !this.currentAccount) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const receipt = await this.contract.methods
        .verifyCertificate(certificateId)
        .send({ from: this.currentAccount });
      return receipt;
    } catch (error) {
      throw new Error('Lỗi khi xác minh chứng nhận: ' + error.message);
    }
  }

  async getCertificateVerificationStatus(certificateId) {
    if (!this.contract) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const status = await this.contract.methods
        .getCertificateVerificationStatus(certificateId)
        .call();
      return status;
    } catch (error) {
      throw new Error('Lỗi khi lấy trạng thái xác minh: ' + error.message);
    }
  }

  // ==================== STATISTICS ====================
  async getTotalCertificates() {
    if (!this.contract) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const count = await this.contract.methods.getTotalCertificates().call();
      return parseInt(count);
    } catch (error) {
      throw new Error('Lỗi khi lấy tổng số chứng nhận: ' + error.message);
    }
  }

  async getTotalAuditLogs() {
    if (!this.contract) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const count = await this.contract.methods.getTotalAuditLogs().call();
      return parseInt(count);
    } catch (error) {
      throw new Error('Lỗi khi lấy tổng số nhật ký: ' + error.message);
    }
  }

  async getAuditLog(logId) {
    if (!this.contract) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const log = await this.contract.methods.getAuditLog(logId).call();
      return log;
    } catch (error) {
      throw new Error('Lỗi khi lấy nhật ký: ' + error.message);
    }
  }

  async getCourseStatistic(courseName) {
    if (!this.contract) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const count = await this.contract.methods.getCourseStatistic(courseName).call();
      return parseInt(count);
    } catch (error) {
      throw new Error('Lỗi khi lấy thống kê khóa học: ' + error.message);
    }
  }

  async getTeacherStatistic(teacherAddress) {
    if (!this.contract) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const count = await this.contract.methods.getTeacherStatistic(teacherAddress).call();
      return parseInt(count);
    } catch (error) {
      throw new Error('Lỗi khi lấy thống kê giáo viên: ' + error.message);
    }
  }

  getCurrentAccount() {
    return this.currentAccount;
  }

  async disconnect() {
    try {
      // Some wallet providers support programmatic disconnect (not MetaMask), call if available
      if (window.ethereum && typeof window.ethereum.disconnect === 'function') {
        await window.ethereum.disconnect();
      }
    } catch (err) {
      // ignore provider-specific disconnect errors
    }

    // Clear local references so the app treats user as disconnected
    this.currentAccount = null;
    // Keep web3/contract initialized so user can reconnect without full page reload
    return true;
  }
}

const web3Service = new Web3Service();
export default web3Service;
