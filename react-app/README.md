# Hệ thống Quản lý Chứng nhận Khóa học Bằng Blockchain - React Version

Đây là phiên bản React của ứng dụng quản lý chứng nhận khóa học sử dụng Blockchain, MetaMask, và Ganache.

## Cấu trúc Dự án

```
react-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── WalletConnect.js
│   │   ├── WalletConnect.css
│   │   ├── CertificateIssuer.js
│   │   ├── CertificateIssuer.css
│   │   ├── CertificateSearch.js
│   │   └── CertificateSearch.css
│   ├── services/
│   │   └── Web3Service.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Yêu cầu

- Node.js (v14 hoặc cao hơn)
- npm hoặc yarn
- MetaMask extension
- Ganache (hoặc bất kỳ blockchain local nào)

## Cài đặt

1. Vào thư mục react-app:

```bash
cd react-app
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Cập nhật địa chỉ contract trong `src/services/Web3Service.js`:

```javascript
const CONTRACT_ADDRESS = '0xYourContractAddressHere';
```

## Chạy ứng dụng

```bash
npm start
```

Ứng dụng sẽ mở tại `http://localhost:3000`

## Tính năng

### 1. Kết nối Ví MetaMask

- Phát hiện MetaMask extension
- Kết nối ví người dùng

### 2. Cấp Chứng nhận

- Nhập thông tin học viên
- Nhập thông tin khóa học
- Cấp chứng nhận trên blockchain
- Hiển thị mã chứng nhận và hash giao dịch

### 3. Tra cứu Chứng nhận

- Tra cứu chứng nhận bằng ID
- Hiển thị đầy đủ thông tin chứng nhận
- Xác minh thông tin trên blockchain

## Cấu hình Contract

Contract ABI được định nghĩa trong `src/services/Web3Service.js`. Nếu ABI của contract thay đổi, hãy cập nhật:

```javascript
const CONTRACT_ABI = [
  // ... ABI definitions
];
```

## Ghi chú Quan trọng

1. **Địa chỉ Contract**: Cập nhật `CONTRACT_ADDRESS` trong `Web3Service.js` sau khi deploy contract
2. **MetaMask Network**: Đảm bảo MetaMask kết nối tới cùng network với contract (ví dụ: Ganache local network)
3. **Gas**: Giao dịch cấp chứng nhận có thể tiêu tốn gas, hãy đảm bảo tài khoản có đủ ETH

## Build cho Production

```bash
npm run build
```

Các file được build sẽ nằm trong thư mục `build/`

## Troubleshooting

- **MetaMask không được phát hiện**: Cài đặt MetaMask extension
- **Không thể kết nối contract**: Kiểm tra địa chỉ contract và network trong MetaMask
- **Giao dịch thất bại**: Kiểm tra gas limit và balance của tài khoản

## Tác giả

Đề tài: Xây dựng hệ thống quản lý chứng nhận khóa học bằng Blockchain
