package com.example.loanmanagementsystem;

import com.example.loanmanagementsystem.model.User;
import com.example.loanmanagementsystem.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if the 'users' table exists
        Integer tableCount = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM information_schema.tables WHERE table_schema = CURRENT_SCHEMA() AND table_name = 'app_users'",
            Integer.class
        );

        if (tableCount == null || tableCount == 0) {
            // If table does not exist, create it
            System.out.println("Creating 'users' table...");
            jdbcTemplate.execute("CREATE TABLE users (" +
                                 "id BIGSERIAL PRIMARY KEY," +
                                 "username VARCHAR(255) UNIQUE NOT NULL," +
                                 "password VARCHAR(255) NOT NULL," +
                                 "email VARCHAR(255) UNIQUE" +
                                 ")");
            System.out.println("'users' table created.");
        } else {
            System.out.println("'users' table already exists.");
        }

        // Proceed with creating default admin user if no users exist
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("adminpass")); // Default password
            admin.setEmail("admin@example.com");
            userRepository.save(admin);
            System.out.println("Default admin user created: admin/adminpass");
        } else {
            System.out.println("Users already exist in the database. Skipping default admin creation.");
        }
    }
}
