import Web3 from 'web3';

const CONTRACT_ADDRESS = '0xF543C0a7263027692F119B59BB8231Ac6C5B4c1E';

const CONTRACT_ABI = [
  {
    inputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
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
    ],
    name: 'CertificateIssued',
    type: 'event',
  },
  {
    constant: true,
    inputs: [],
    name: 'certificateCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
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
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
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
    ],
    name: 'issueCertificate',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
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
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
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

  async issueCertificate(studentName, studentEmail, courseName, issueDate, extraInfo) {
    if (!this.contract || !this.currentAccount) {
      throw new Error('Vui lòng kết nối ví trước.');
    }

    try {
      const receipt = await this.contract.methods
        .issueCertificate(studentName, studentEmail, courseName, issueDate, extraInfo)
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
      return {
        id: cert[0],
        studentName: cert[1],
        studentEmailOrId: cert[2],
        courseName: cert[3],
        issueDate: cert[4],
        extraInfo: cert[5],
        issuer: cert[6],
      };
    } catch (error) {
      throw new Error('Không tìm thấy chứng nhận: ' + error.message);
    }
  }

  getCurrentAccount() {
    return this.currentAccount;
  }
}

export default new Web3Service();
