package com.example.loanmanagementsystem.controller;

import com.example.loanmanagementsystem.model.Loan;
import com.example.loanmanagementsystem.model.LoginRequestDTO;
import com.example.loanmanagementsystem.model.LoginResponse;
import com.example.loanmanagementsystem.model.User;
import com.example.loanmanagementsystem.service.LoanService;
import com.example.loanmanagementsystem.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private LoanService loanService;

    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        User registeredUser = userService.registerNewUser(user);
        return new ResponseEntity<>(registeredUser, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> loginUser(@RequestBody LoginRequestDTO loginRequestDTO) {
        User foundUser = userService.findByEmail(loginRequestDTO.getEmail());
        if (foundUser != null && userService.passwordEncoder.matches(loginRequestDTO.getPassword(), foundUser.getPasswordHash())) {
            List<Loan> loans = loanService.getUserLoans(foundUser);
            return new ResponseEntity<>(new LoginResponse(foundUser, loans), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(new LoginResponse("Invalid credentials", "AUTH_001"), HttpStatus.UNAUTHORIZED);
        }
    }
}
