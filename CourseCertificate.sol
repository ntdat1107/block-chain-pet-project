// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CourseCertificate {
    address public owner;

    // Enum for user roles
    enum Role { NONE, ADMIN, TEACHER, STUDENT }

    struct Certificate {
        uint256 id;
        string studentName;
        string studentEmailOrId;
        string courseName;
        string issueDate;
        string extraInfo;
        address issuer;
        string ipfsHash;
        bool isVerified;
        uint256 timestamp;
    }

    struct User {
        address userAddress;
        string name;
        Role role;
        bool isActive;
        uint256 createdDate;
    }

    struct AuditLog {
        uint256 id;
        address actor;
        string action;
        uint256 certificateId;
        uint256 timestamp;
    }

    uint256 public certificateCount;
    uint256 public auditLogCount;
    mapping(uint256 => Certificate) public certificates;
    mapping(address => User) public users;
    mapping(uint256 => AuditLog) public auditLogs;
    mapping(string => uint256) public courseStats; // courseName => count
    mapping(address => uint256) public issuedByTeacher; // teacher address => count

    event CertificateIssued(
        uint256 id,
        string studentName,
        string studentEmailOrId,
        string courseName,
        string issueDate,
        string extraInfo,
        address issuer,
        string ipfsHash
    );

    event UserAdded(
        address indexed userAddress,
        string name,
        uint256 role
    );

    event UserRoleUpdated(
        address indexed userAddress,
        uint256 oldRole,
        uint256 newRole
    );

    event CertificateVerified(
        uint256 indexed certificateId,
        address verifier,
        uint256 timestamp
    );

    event AuditLogCreated(
        uint256 logId,
        address actor,
        string action,
        uint256 certificateId,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAdmin() {
        require(users[msg.sender].role == Role.ADMIN, "Only admin can perform this action");
        _;
    }

    modifier onlyTeacherOrAdmin() {
        Role role = users[msg.sender].role;
        require(role == Role.TEACHER || role == Role.ADMIN, "Only teacher or admin can issue certificate");
        _;
    }

    modifier userExists(address _userAddress) {
        require(users[_userAddress].userAddress != address(0), "User does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        users[msg.sender] = User({
            userAddress: msg.sender,
            name: "Admin",
            role: Role.ADMIN,
            isActive: true,
            createdDate: block.timestamp
        });
    }

    // ==================== USER MANAGEMENT ====================
    function addUser(address _userAddress, string memory _name, uint256 _role) public onlyAdmin {
        require(_userAddress != address(0), "Invalid address");
        require(users[_userAddress].userAddress == address(0), "User already exists");
        require(_role >= 1 && _role <= 3, "Invalid role");
        // Prevent creating another ADMIN: only the deployer (constructor) is the admin
        require(_role != uint256(Role.ADMIN), "Cannot create another admin");

        Role role = Role(_role);
        users[_userAddress] = User({
            userAddress: _userAddress,
            name: _name,
            role: role,
            isActive: true,
            createdDate: block.timestamp
        });

        emit UserAdded(_userAddress, _name, _role);
        _createAuditLog(msg.sender, "User Added", 0);
    }

    function updateUserRole(address _userAddress, uint256 _newRole) 
        public onlyAdmin userExists(_userAddress) {
        require(_newRole >= 1 && _newRole <= 3, "Invalid role");
        // Prevent promoting another user to ADMIN (only deployer/admin remains ADMIN)
        require(_newRole != uint256(Role.ADMIN), "Cannot promote to admin");
        
        uint256 oldRole = uint256(users[_userAddress].role);
        users[_userAddress].role = Role(_newRole);
        
        emit UserRoleUpdated(_userAddress, oldRole, _newRole);
        _createAuditLog(msg.sender, "User Role Updated", 0);
    }

    function deactivateUser(address _userAddress) public onlyAdmin userExists(_userAddress) {
        // Do not allow deactivating the ADMIN account
        require(users[_userAddress].role != Role.ADMIN, "Cannot deactivate admin");
        users[_userAddress].isActive = false;
        _createAuditLog(msg.sender, "User Deactivated", 0);
    }

    function getUser(address _userAddress) 
        public view userExists(_userAddress)
        returns (address, string memory, uint256, bool, uint256) {
        User memory user = users[_userAddress];
        return (user.userAddress, user.name, uint256(user.role), user.isActive, user.createdDate);
    }

    // ==================== CERTIFICATE MANAGEMENT ====================
    function issueCertificate(
        string memory _studentName,
        string memory _studentEmailOrId,
        string memory _courseName,
        string memory _issueDate,
        string memory _extraInfo,
        string memory _ipfsHash
    ) public onlyTeacherOrAdmin returns (uint256) {
        require(users[msg.sender].isActive, "User is not active");
        
        certificateCount++;
        uint256 newId = certificateCount;

        certificates[newId] = Certificate({
            id: newId,
            studentName: _studentName,
            studentEmailOrId: _studentEmailOrId,
            courseName: _courseName,
            issueDate: _issueDate,
            extraInfo: _extraInfo,
            issuer: msg.sender,
            ipfsHash: _ipfsHash,
            isVerified: false,
            timestamp: block.timestamp
        });

        courseStats[_courseName]++;
        issuedByTeacher[msg.sender]++;

        emit CertificateIssued(
            newId,
            _studentName,
            _studentEmailOrId,
            _courseName,
            _issueDate,
            _extraInfo,
            msg.sender,
            _ipfsHash
        );

        _createAuditLog(msg.sender, "Certificate Issued", newId);

        return newId;
    }

    function getCertificate(uint256 _id)
        public view
        returns (
            uint256,
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            address,
            string memory,
            bool,
            uint256
        )
    {
        Certificate memory cert = certificates[_id];
        require(cert.id != 0, "Certificate not found");

        return (
            cert.id,
            cert.studentName,
            cert.studentEmailOrId,
            cert.courseName,
            cert.issueDate,
            cert.extraInfo,
            cert.issuer,
            cert.ipfsHash,
            cert.isVerified,
            cert.timestamp
        );
    }

    // ==================== VERIFICATION ====================
    function verifyCertificate(uint256 _id) public {
        Certificate memory cert = certificates[_id];
        require(cert.id != 0, "Certificate not found");
        require(!cert.isVerified, "Certificate already verified");

        // Only TEACHER or ADMIN can verify certificates
        require(users[msg.sender].role == Role.TEACHER || users[msg.sender].role == Role.ADMIN, "Only teacher or admin can verify certificate");

        certificates[_id].isVerified = true;
        emit CertificateVerified(_id, msg.sender, block.timestamp);
        _createAuditLog(msg.sender, "Certificate Verified", _id);
    }

    // Reactivate a previously deactivated user (Admin only)
    function reactivateUser(address _userAddress) public onlyAdmin userExists(_userAddress) {
        users[_userAddress].isActive = true;
        _createAuditLog(msg.sender, "User Reactivated", 0);
    }

    function getCertificateVerificationStatus(uint256 _id) 
        public view 
        returns (bool, address, uint256) {
        Certificate memory cert = certificates[_id];
        require(cert.id != 0, "Certificate not found");
        return (cert.isVerified, cert.issuer, cert.timestamp);
    }

    // ==================== STATISTICS ====================
    function getTotalCertificates() public view returns (uint256) {
        return certificateCount;
    }

    function getTotalUsers() public view returns (uint256) {
        // Note: This is a simplified version, actual implementation would need tracking
        return 0;
    }

    function getCourseStatistic(string memory _courseName) public view returns (uint256) {
        return courseStats[_courseName];
    }

    function getTeacherStatistic(address _teacher) public view returns (uint256) {
        return issuedByTeacher[_teacher];
    }

    function getAuditLog(uint256 _logId) 
        public view 
        returns (uint256, address, string memory, uint256, uint256) {
        AuditLog memory log = auditLogs[_logId];
        return (log.id, log.actor, log.action, log.certificateId, log.timestamp);
    }

    function getTotalAuditLogs() public view returns (uint256) {
        return auditLogCount;
    }

    // ==================== INTERNAL FUNCTIONS ====================
    function _createAuditLog(address _actor, string memory _action, uint256 _certificateId) 
        internal {
        auditLogCount++;
        auditLogs[auditLogCount] = AuditLog({
            id: auditLogCount,
            actor: _actor,
            action: _action,
            certificateId: _certificateId,
            timestamp: block.timestamp
        });

        emit AuditLogCreated(auditLogCount, _actor, _action, _certificateId, block.timestamp);
    }
}
