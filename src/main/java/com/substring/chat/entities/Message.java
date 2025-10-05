package com.substring.chat.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor  // This is critical for MongoDB and Spring
@Getter
@Setter
public class Message {
    private String sender;
    private String content;
    private LocalDateTime timeStamp;
    private String messageType; // TEXT, JOIN, LEAVE

    // Custom constructor for backward compatibility
    public Message(String sender, String content) {
        this.sender = sender;
        this.content = content;
        this.timeStamp = LocalDateTime.now();
        this.messageType = "TEXT";
    }
}