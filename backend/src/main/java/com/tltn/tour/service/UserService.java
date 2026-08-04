package com.tltn.tour.service;

import com.tltn.tour.dto.AuthDTOs;
import com.tltn.tour.model.User;

public interface UserService {
    User register(AuthDTOs.RegisterRequest request);
    AuthDTOs.LoginResponse login(AuthDTOs.LoginRequest request);
    void logout(String token);
    User getProfile(String token);
    User updateProfile(String token, AuthDTOs.UpdateProfileRequest request);
    void changePassword(String token, AuthDTOs.ChangePasswordRequest request);
    void seedAdmin();
    AuthDTOs.LoginResponse loginWithGoogle(String email, String name, String sub);
}
