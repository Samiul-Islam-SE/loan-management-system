package com.example.loanmanagementsystem;

import com.example.loanmanagementsystem.model.User;
import com.example.loanmanagementsystem.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Create a default admin user if no users exist
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setFullName("Admin User");
            admin.setEmail("admin@example.com");
            admin.setPasswordHash(passwordEncoder.encode("adminpass")); // Default password
            admin.setAdmin(true);
            userRepository.save(admin);
            System.out.println("Default admin user created: admin@example.com / adminpass");
        } else {
            System.out.println("Users already exist. Skipping default admin creation.");
        }
    }
}
