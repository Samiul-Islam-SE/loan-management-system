package com.example.loanmanagementsystem.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "email_templates")
public class EmailTemplate {

    @Id
    @Column(name = "key")
    private String key;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "body_md", nullable = false)
    private String bodyMd;

    // Getters and Setters

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBodyMd() {
        return bodyMd;
    }

    public void setBodyMd(String bodyMd) {
        this.bodyMd = bodyMd;
    }
}
