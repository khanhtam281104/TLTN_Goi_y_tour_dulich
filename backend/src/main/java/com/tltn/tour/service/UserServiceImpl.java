package com.tltn.tour.service;

import com.tltn.tour.dto.AuthDTOs;
import com.tltn.tour.model.User;
import com.tltn.tour.model.UserSession;
import com.tltn.tour.model.SystemLog;
import com.tltn.tour.repository.SystemLogRepository;
import com.tltn.tour.repository.UserRepository;
import com.tltn.tour.repository.UserSessionRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private SystemLogRepository systemLogRepository;

    private void logActivity(String action, String details, String username) {
        try {
            SystemLog log = new SystemLog();
            log.setAction(action);
            log.setDetails(details);
            log.setUsername(username);
            log.setTimestamp(LocalDateTime.now());
            systemLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to save system log: " + e.getMessage());
        }
    }

    @Override
    public User register(AuthDTOs.RegisterRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().length() < 3) {
            throw new IllegalArgumentException("Tên đăng nhập phải có ít nhất 3 ký tự");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự");
        }
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp");
        }
        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại");
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            if (userRepository.existsByEmail(request.getEmail().trim())) {
                throw new IllegalArgumentException("Email đã được đăng ký sử dụng");
            }
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPassword(BCrypt.hashpw(request.getPassword(), BCrypt.gensalt()));
        user.setFullName(request.getFullName() != null ? request.getFullName().trim() : "");
        user.setEmail(request.getEmail() != null ? request.getEmail().trim() : "");
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : "");
        user.setRole("USER");

        User savedUser = userRepository.save(user);
        logActivity("REGISTER", "Đăng ký tài khoản mới: " + savedUser.getUsername(), savedUser.getUsername());
        return savedUser;
    }

    @Override
    public AuthDTOs.LoginResponse login(AuthDTOs.LoginRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new IllegalArgumentException("Tên đăng nhập và mật khẩu không được để trống");
        }

        User user = userRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new IllegalArgumentException("Tên đăng nhập hoặc mật khẩu không chính xác"));

        if (!BCrypt.checkpw(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Tên đăng nhập hoặc mật khẩu không chính xác");
        }

        // Clean up any old sessions for this user
        userSessionRepository.deleteByUserId(user.getId());

        // Generate token
        String token = UUID.randomUUID().toString();
        UserSession session = new UserSession(token, user.getId(), LocalDateTime.now().plusDays(7));
        userSessionRepository.save(session);

        logActivity("LOGIN", "Đăng nhập thành công", user.getUsername());

        AuthDTOs.UserDTO userDTO = new AuthDTOs.UserDTO(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getFavoriteCategory(),
                user.getFavoriteLocation()
        );

        return new AuthDTOs.LoginResponse(token, userDTO);
    }

    @Override
    public void logout(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        if (token != null) {
            userSessionRepository.deleteByToken(token);
        }
    }

    @Override
    public User getProfile(String token) {
        UserSession session = validateTokenAndGetSession(token);
        return userRepository.findById(session.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }

    @Override
    public User updateProfile(String token, AuthDTOs.UpdateProfileRequest request) {
        UserSession session = validateTokenAndGetSession(token);
        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail().trim())) {
                throw new IllegalArgumentException("Email đã được đăng ký sử dụng bởi người dùng khác");
            }
        }

        user.setFullName(request.getFullName() != null ? request.getFullName().trim() : "");
        user.setEmail(request.getEmail() != null ? request.getEmail().trim() : "");
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : "");
        user.setFavoriteCategory(request.getFavoriteCategory());
        user.setFavoriteLocation(request.getFavoriteLocation());

        User savedUser = userRepository.save(user);
        logActivity("UPDATE_PROFILE", "Cập nhật thông tin cá nhân: " + savedUser.getFullName(), savedUser.getUsername());
        return savedUser;
    }

    @Override
    public void changePassword(String token, AuthDTOs.ChangePasswordRequest request) {
        UserSession session = validateTokenAndGetSession(token);
        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!BCrypt.checkpw(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu cũ không chính xác");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new IllegalArgumentException("Mật khẩu mới xác nhận không khớp");
        }

        user.setPassword(BCrypt.hashpw(request.getNewPassword(), BCrypt.gensalt()));
        userRepository.save(user);
        logActivity("CHANGE_PASSWORD", "Thay đổi mật khẩu thành công", user.getUsername());
    }

    private UserSession validateTokenAndGetSession(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Yêu cầu mã xác thực Token hợp lệ");
        }
        String token = authorizationHeader.substring(7);
        UserSession session = userSessionRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn"));

        if (session.getExpiryDate().isBefore(LocalDateTime.now())) {
            userSessionRepository.delete(session);
            throw new RuntimeException("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        }
        return session;
    }

    @Override
    public void seedAdmin() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(BCrypt.hashpw("admin123", BCrypt.gensalt()));
            admin.setFullName("Quản trị viên");
            admin.setEmail("admin@bintravel.com");
            admin.setPhone("0123456789");
            admin.setRole("ADMIN");
            userRepository.save(admin);
            logActivity("SYSTEM_INIT", "Khởi tạo tài khoản Admin mặc định", "SYSTEM");
            System.out.println("🌱 Created default Admin account: admin / admin123");
        }
    }

    @Override
    public AuthDTOs.LoginResponse loginWithGoogle(String email, String name, String sub) {
        // Find existing user by email
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            // Find existing user by username (just in case they share username but email was empty before)
            String googleUsername = "google_" + sub;
            user = userRepository.findByUsername(googleUsername).orElse(null);
            
            if (user == null) {
                // Register new user
                user = new User();
                user.setUsername(googleUsername);
                // Set a random password for security
                user.setPassword(BCrypt.hashpw(UUID.randomUUID().toString(), BCrypt.gensalt()));
                user.setFullName(name != null ? name : email.split("@")[0]);
                user.setEmail(email);
                user.setPhone("");
                user.setRole("USER");
                user = userRepository.save(user);
                logActivity("REGISTER_GOOGLE", "Đăng ký tài khoản Google mới: " + user.getUsername(), user.getUsername());
            }
        }

        // Clean up old sessions
        userSessionRepository.deleteByUserId(user.getId());

        // Generate session token
        String token = UUID.randomUUID().toString();
        UserSession session = new UserSession(token, user.getId(), LocalDateTime.now().plusDays(7));
        userSessionRepository.save(session);

        logActivity("LOGIN_GOOGLE", "Đăng nhập bằng Google thành công", user.getUsername());

        AuthDTOs.UserDTO userDTO = new AuthDTOs.UserDTO(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getFavoriteCategory(),
                user.getFavoriteLocation()
        );

        return new AuthDTOs.LoginResponse(token, userDTO);
    }
}
