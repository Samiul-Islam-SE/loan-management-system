package com.example.loanmanagementsystem.service;

import com.example.loanmanagementsystem.model.Loan;
import com.example.loanmanagementsystem.model.User;
import com.example.loanmanagementsystem.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    public List<Loan> getUserLoans(User user) {
        return loanRepository.findByLenderOrBorrower(user, user);
    }
}
