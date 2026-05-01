package org.example.communityboard.domain.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.example.communityboard.domain.auth.dto.LoginRequest;
import org.example.communityboard.domain.auth.dto.SignupRequest;
import org.example.communityboard.domain.auth.dto.UserResponse;
import org.example.communityboard.domain.user.User;
import org.example.communityboard.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    void signupCreatesUserWithEncodedPassword() {
        SignupRequest request = new SignupRequest("tester", "password123", "tester@example.com");
        when(userRepository.existsByUsername("tester")).thenReturn(false);
        when(userRepository.existsByEmail("tester@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = authService.signup(request);

        assertThat(response.username()).isEqualTo("tester");
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("encoded-password");
    }

    @Test
    void signupRejectsDuplicateUsername() {
        SignupRequest request = new SignupRequest("tester", "password123", "tester@example.com");
        when(userRepository.existsByUsername("tester")).thenReturn(true);

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("이미 사용 중인 아이디입니다.");
    }

    @Test
    void loginRejectsInvalidPassword() {
        User user = new User("tester", "encoded-password", "tester@example.com");
        when(userRepository.findByUsername("tester")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("tester", "wrong-password")))
                .isInstanceOf(BadCredentialsException.class);
    }
}
