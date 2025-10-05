package com.substring.chat.payload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotBlank; // CHANGED
import jakarta.validation.constraints.Size; // CHANGED

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class MessageRequest {

    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 2000, message = "Message too long")
    private String content;

    @NotBlank(message = "Sender name is required")
    @Size(max = 30, message = "Username too long")
    private String sender;

    @NotBlank(message = "Room ID is required")
    private String roomId;
}