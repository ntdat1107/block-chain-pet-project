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
        uint256 courseId;
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
    
    // Track all users
    address[] public userList;
    mapping(address => uint256) public userIndex; // address -> index+1 (0 means not exist)

    // Courses
    struct Course {
        uint256 id;
        string name;
        bool isActive;
    }

    uint256 public courseCount;
    mapping(uint256 => Course) public courses;

    // Permissions: courseId => teacher => allowed
    mapping(uint256 => mapping(address => bool)) public teacherCoursePermission;

    event CertificateIssued(
        uint256 id,
        string studentName,
        string studentEmailOrId,
        uint256 courseId,
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

    // Helper function to convert address to string
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        
        for (uint256 i = 0; i < 20; i++) {
            uint8 value = uint8(uint160(_addr) / (2 ** (8 * (19 - i))));
            str[2 + i * 2] = alphabet[value >> 4];
            str[3 + i * 2] = alphabet[value & 0x0f];
        }
        return string(str);
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
        // Add admin to userList
        userList.push(msg.sender);
        userIndex[msg.sender] = 1;
        
        // Initialize default protected courses (always active)
        _addCourseInternal("English", true);
        _addCourseInternal("Mathematics", true);
        _addCourseInternal("Science", true);
    }

    // Internal helper to add a course (used in constructor and addCourse)
    function _addCourseInternal(string memory _name, bool _isActive) internal {
        courseCount++;
        courses[courseCount] = Course({ id: courseCount, name: _name, isActive: _isActive });
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
        
        // Add to userList
        userList.push(_userAddress);
        userIndex[_userAddress] = userList.length;

        emit UserAdded(_userAddress, _name, _role);
        _createAuditLog(msg.sender, "User Added", 0);
    }

    function updateUserRole(address _userAddress, uint256 _newRole) 
        public onlyAdmin userExists(_userAddress) {
        require(_newRole >= 1 && _newRole <= 3, "Invalid role");
        // Prevent promoting another user to ADMIN (only deployer/admin remains ADMIN)
        require(_newRole != uint256(Role.ADMIN), "Cannot promote to admin");
        // Prevent changing role of an admin and prevent admins changing their own role
        require(users[_userAddress].role != Role.ADMIN, "Cannot change admin role");
        require(_userAddress != msg.sender, "Cannot change your own role");

        uint256 oldRole = uint256(users[_userAddress].role);
        users[_userAddress].role = Role(_newRole);
        
        emit UserRoleUpdated(_userAddress, oldRole, _newRole);
        _createAuditLog(msg.sender, "User Role Updated", 0);
    }

    function deactivateUser(address _userAddress) public onlyAdmin userExists(_userAddress) {
        // Do not allow deactivating the ADMIN account
        require(users[_userAddress].role != Role.ADMIN, "Cannot deactivate admin");
        // Do not allow an admin to deactivate themselves
        require(_userAddress != msg.sender, "Admin cannot deactivate themselves");
        users[_userAddress].isActive = false;
        _createAuditLog(msg.sender, "User Deactivated", 0);
    }

    function getUser(address _userAddress) 
        public view userExists(_userAddress)
        returns (address, string memory, uint256, bool, uint256) {
        User memory user = users[_userAddress];
        return (user.userAddress, user.name, uint256(user.role), user.isActive, user.createdDate);
    }

    // Get paginated list of users (page starts at 1)
    function getUsers(uint256 _page, uint256 _pageSize) 
        public view 
        returns (address[] memory, string[] memory, uint256[] memory, bool[] memory, uint256[] memory) {
        require(_page >= 1 && _pageSize >= 1, "Invalid paging parameters");
        
        uint256 totalUsers = userList.length;
        uint256 start = (_page - 1) * _pageSize;
        
        if (start >= totalUsers) {
            return (new address[](0), new string[](0), new uint256[](0), new bool[](0), new uint256[](0));
        }
        
        uint256 end = start + _pageSize;
        if (end > totalUsers) end = totalUsers;
        uint256 len = end - start;

        address[] memory addresses = new address[](len);
        string[] memory names = new string[](len);
        uint256[] memory roles = new uint256[](len);
        bool[] memory isActive = new bool[](len);
        uint256[] memory createdDates = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            address userAddr = userList[start + i];
            User memory user = users[userAddr];
            addresses[i] = user.userAddress;
            names[i] = user.name;
            roles[i] = uint256(user.role);
            isActive[i] = user.isActive;
            createdDates[i] = user.createdDate;
        }

        return (addresses, names, roles, isActive, createdDates);
    }

    // ==================== CERTIFICATE MANAGEMENT ====================
    function issueCertificate(
        address _studentAddress,
        uint256 _courseId,
        string memory _issueDate,
        string memory _extraInfo,
        string memory _ipfsHash
    ) public returns (uint256) {
        require(users[msg.sender].isActive, "User is not active");
        require(courses[_courseId].id != 0, "Course does not exist");

        // Permission: admin or teacher assigned to the course
        if (users[msg.sender].role == Role.TEACHER) {
            require(teacherCoursePermission[_courseId][msg.sender], "Teacher not assigned to this course");
        } else {
            require(users[msg.sender].role == Role.ADMIN, "Only admin or assigned teacher can issue certificate");
        }

        // Validate student account
        require(_studentAddress != address(0), "Invalid student address");
        require(users[_studentAddress].userAddress != address(0), "Student account not registered");
        require(users[_studentAddress].role == Role.STUDENT, "Target account is not a student");
        require(users[_studentAddress].isActive, "Student account is not active");

        certificateCount++;
        uint256 newId = certificateCount;

        certificates[newId] = Certificate({
            id: newId,
            studentName: users[_studentAddress].name,
            studentEmailOrId: _addressToString(_studentAddress),
            courseId: _courseId,
            courseName: courses[_courseId].name,
            issueDate: _issueDate,
            extraInfo: _extraInfo,
            issuer: msg.sender,
            ipfsHash: _ipfsHash,
            isVerified: false,
            timestamp: block.timestamp
        });

        courseStats[courses[_courseId].name]++;
        issuedByTeacher[msg.sender]++;

        emit CertificateIssued(
            newId,
            users[_studentAddress].name,
            _addressToString(_studentAddress),
            _courseId,
            courses[_courseId].name,
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
            uint256,
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
            cert.courseId,
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

        // Ensure sender is a registered and active user
        require(users[msg.sender].userAddress != address(0), "Sender is not a registered user");
        require(users[msg.sender].isActive, "User is not active");

        // Permission: admin or teacher assigned to the certificate's course
        uint256 cId = cert.courseId;
        Role role = users[msg.sender].role;
        if (role == Role.TEACHER) {
            require(teacherCoursePermission[cId][msg.sender], "Teacher not assigned to this course");
        } else if (role == Role.ADMIN) {
            // admin allowed
        } else {
            revert("Only admin or assigned teacher can verify certificate");
        }

        certificates[_id].isVerified = true;
        emit CertificateVerified(_id, msg.sender, block.timestamp);
        _createAuditLog(msg.sender, "Certificate Verified", _id);
    }

    // Reactivate a previously deactivated user (Admin only)
    function reactivateUser(address _userAddress) public onlyAdmin userExists(_userAddress) {
        // Do not allow reactivating the ADMIN account via this function
        require(users[_userAddress].role != Role.ADMIN, "Cannot reactivate admin");
        // Do not allow an admin to reactivate themselves
        require(_userAddress != msg.sender, "Admin cannot reactivate themselves");

        users[_userAddress].isActive = true;
        _createAuditLog(msg.sender, "User Reactivated", 0);
    }

    // ==================== COURSE MANAGEMENT ====================
    function addCourse(string memory _name) public onlyAdmin {
        require(bytes(_name).length > 0, "Invalid course name");
        courseCount++;
        courses[courseCount] = Course({ id: courseCount, name: _name, isActive: true });
        _createAuditLog(msg.sender, "Course Added", 0);
    }

    function deactivateCourse(uint256 _courseId) public onlyAdmin {
        require(courses[_courseId].id != 0, "Course does not exist");
        // Check if course is one of the default protected courses (Math=1, Physics=2, Chemistry=3)
        require(_courseId > 3, "Cannot deactivate default protected courses");
        courses[_courseId].isActive = false;
        _createAuditLog(msg.sender, "Course Deactivated", 0);
    }

    function activateCourse(uint256 _courseId) public onlyAdmin {
        require(courses[_courseId].id != 0, "Course does not exist");
        courses[_courseId].isActive = true;
        _createAuditLog(msg.sender, "Course Activated", 0);
    }

    function assignTeacherToCourse(address _teacher, uint256 _courseId) public onlyAdmin userExists(_teacher) {
        require(courses[_courseId].id != 0, "Course does not exist");
        require(users[_teacher].role == Role.TEACHER, "Target user is not a teacher");
        teacherCoursePermission[_courseId][_teacher] = true;
        _createAuditLog(msg.sender, "Teacher Assigned To Course", 0);
    }

    function revokeTeacherFromCourse(address _teacher, uint256 _courseId) public onlyAdmin userExists(_teacher) {
        require(courses[_courseId].id != 0, "Course does not exist");
        teacherCoursePermission[_courseId][_teacher] = false;
        _createAuditLog(msg.sender, "Teacher Revoked From Course", 0);
    }

    function isTeacherAssignedToCourse(address _teacher, uint256 _courseId) public view returns (bool) {
        return teacherCoursePermission[_courseId][_teacher];
    }

    // Get assigned courses for a teacher (page starts at 1)
    function getTeacherCourses(address _teacher, uint256 _page, uint256 _pageSize) public view returns (uint256[] memory, string[] memory) {
        require(_page >= 1 && _pageSize >= 1, "Invalid paging parameters");
        
        // First, count how many courses the teacher is assigned to
        uint256 assignedCount = 0;
        for (uint256 i = 1; i <= courseCount; i++) {
            if (teacherCoursePermission[i][_teacher]) {
                assignedCount++;
            }
        }

        if (assignedCount == 0) {
            return (new uint256[](0), new string[](0));
        }

        uint256 start = (_page - 1) * _pageSize + 1;
        if (start > assignedCount) {
            return (new uint256[](0), new string[](0));
        }
        uint256 end = start + _pageSize - 1;
        if (end > assignedCount) end = assignedCount;
        uint256 len = end - start + 1;

        uint256[] memory ids = new uint256[](len);
        string[] memory names = new string[](len);

        uint256 idx = 0;
        uint256 count = 0;
        for (uint256 i = 1; i <= courseCount && idx < len; i++) {
            if (teacherCoursePermission[i][_teacher]) {
                count++;
                if (count >= start && count <= end) {
                    ids[idx] = courses[i].id;
                    names[idx] = courses[i].name;
                    idx++;
                }
            }
        }

        return (ids, names);
    }

    // Get certificates for a specific course (newest first, page starts at 1)
    function getCertificatesByCourse(uint256 _courseId, uint256 _page, uint256 _pageSize) public view returns (uint256[] memory, string[] memory, uint256[] memory) {
        require(_page >= 1 && _pageSize >= 1, "Invalid paging parameters");
        require(courses[_courseId].id != 0, "Course does not exist");
        
        // Count certificates for this course
        uint256 count = 0;
        for (uint256 i = 1; i <= certificateCount; i++) {
            if (certificates[i].courseId == _courseId) {
                count++;
            }
        }

        if (count == 0) {
            return (new uint256[](0), new string[](0), new uint256[](0));
        }

        uint256 start = (_page - 1) * _pageSize + 1;
        if (start > count) {
            return (new uint256[](0), new string[](0), new uint256[](0));
        }
        uint256 end = start + _pageSize - 1;
        if (end > count) end = count;
        uint256 len = end - start + 1;

        uint256[] memory ids = new uint256[](len);
        string[] memory studentNames = new string[](len);
        uint256[] memory timestamps = new uint256[](len);

        uint256 idx = 0;
        uint256 certCount = 0;
        // Iterate from newest to oldest
        for (uint256 i = certificateCount; i >= 1; i--) {
            if (certificates[i].courseId == _courseId) {
                certCount++;
                if (certCount >= start && certCount <= end) {
                    ids[idx] = certificates[i].id;
                    studentNames[idx] = certificates[i].studentName;
                    timestamps[idx] = certificates[i].timestamp;
                    idx++;
                }
            }
            if (i == 1) break;
        }

        return (ids, studentNames, timestamps);
    }

    // Pagination for courses (page starts at 1)
    function getCourses(uint256 _page, uint256 _pageSize) public view returns (uint256[] memory, string[] memory, bool[] memory) {
        require(_page >= 1 && _pageSize >= 1, "Invalid paging parameters");
        uint256 start = (_page - 1) * _pageSize + 1;
        if (start > courseCount) {
            return (new uint256[](0), new string[](0), new bool[](0));
        }
        uint256 end = start + _pageSize - 1;
        if (end > courseCount) end = courseCount;
        uint256 len = end - start + 1;

        uint256[] memory ids = new uint256[](len);
        string[] memory names = new string[](len);
        bool[] memory isActive = new bool[](len);

        uint256 idx = 0;
        for (uint256 i = start; i <= end; i++) {
            if (courses[i].id != 0) {
                ids[idx] = courses[i].id;
                names[idx] = courses[i].name;
                isActive[idx] = courses[i].isActive;
            } else {
                ids[idx] = 0;
                names[idx] = "";
                isActive[idx] = false;
            }
            idx++;
        }

        return (ids, names, isActive);
    }

    // Get total count of courses
    function getTotalCourses() public view returns (uint256) {
        return courseCount;
    }

    function getCertificateVerificationStatus(uint256 _id) 
        public view 
        returns (bool, address, uint256) {
        Certificate memory cert = certificates[_id];
        require(cert.id != 0, "Certificate not found");
        return (cert.isVerified, cert.issuer, cert.timestamp);
    }

    // Pagination for certificates (newest first, page starts at 1)
    // Optimized: Returns studentAddresses to avoid N+1 queries on frontend
    function getCertificates(uint256 _page, uint256 _pageSize) public view returns (uint256[] memory, string[] memory, string[] memory, string[] memory, uint256[] memory) {
        require(_page >= 1 && _pageSize >= 1, "Invalid paging parameters");

        if (certificateCount == 0) {
            return (new uint256[](0), new string[](0), new string[](0), new string[](0), new uint256[](0));
        }

        // Compute offset first to avoid unsigned underflow when subtracting
        uint256 offset = (_page - 1) * _pageSize;
        if (offset >= certificateCount) {
            return (new uint256[](0), new string[](0), new string[](0), new string[](0), new uint256[](0));
        }

        uint256 start = certificateCount - offset;
        uint256 end;
        if (start <= _pageSize) {
            end = 1;
        } else {
            end = start - _pageSize + 1;
        }

        uint256 len = start - end + 1;

        uint256[] memory ids = new uint256[](len);
        string[] memory studentNames = new string[](len);
        string[] memory courseNames = new string[](len);
        string[] memory studentAddresses = new string[](len);
        uint256[] memory timestamps = new uint256[](len);

        uint256 idx = 0;
        for (uint256 i = start; i >= end; i--) {
            if (certificates[i].id != 0) {
                ids[idx] = certificates[i].id;
                studentNames[idx] = certificates[i].studentName;
                courseNames[idx] = certificates[i].courseName;
                studentAddresses[idx] = certificates[i].studentEmailOrId;
                timestamps[idx] = certificates[i].timestamp;
            } else {
                ids[idx] = 0;
                studentNames[idx] = "";
                courseNames[idx] = "";
                studentAddresses[idx] = "";
                timestamps[idx] = 0;
            }
            idx++;
            if (i == end) break;
        }

        return (ids, studentNames, courseNames, studentAddresses, timestamps);
    }

    // ==================== STATISTICS ====================
    function getTotalCertificates() public view returns (uint256) {
        return certificateCount;
    }

    function getTotalUsers() public view returns (uint256) {
        return userList.length;
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
