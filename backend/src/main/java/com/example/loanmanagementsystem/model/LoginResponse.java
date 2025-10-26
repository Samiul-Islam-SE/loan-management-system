package com.example.loanmanagementsystem.model;

import java.util.List;

public class LoginResponse extends RootResponse {
    private User user;
    private List<Loan> loans;

    public LoginResponse(String message, String errorCode) {
        super(message, errorCode);
    }

    public LoginResponse(User user, List<Loan> loans) {
        super("Login successful", null);
        this.user = user;
        this.loans = loans;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<Loan> getLoans() {
        return loans;
    }

    public void setLoans(List<Loan> loans) {
        this.loans = loans;
    }
}
