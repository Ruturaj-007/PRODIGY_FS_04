package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.payload.MessageRequest;
import com.substring.chat.payload.TypingIndicator;
import com.substring.chat.repositories.RoomRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import jakarta.validation.Valid; // CHANGED from javax to jakarta
import java.time.LocalDateTime;

@Controller
@CrossOrigin(origins = "*")
public class ChatController {

    private final RoomRepository roomRepository;

    public ChatController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @MessageMapping("/sendMessage/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public Message sendMessage(
            @DestinationVariable String roomId,
            @Valid MessageRequest request
    ) {
        Room room = roomRepository.findByRoomId(roomId);

        if (room == null) {
            throw new RuntimeException("Room not found: " + roomId);
        }

        Message message = new Message();
        message.setContent(sanitizeMessage(request.getContent()));
        message.setSender(sanitizeMessage(request.getSender()));
        message.setTimeStamp(LocalDateTime.now());
        message.setMessageType("TEXT");

        room.getMessages().add(message);
        roomRepository.save(room);

        return message;
    }

    @MessageMapping("/typing/{roomId}")
    @SendTo("/topic/typing/{roomId}")
    public TypingIndicator handleTyping(
            @DestinationVariable String roomId,
            TypingIndicator indicator
    ) {
        return indicator;
    }

    @MessageMapping("/join/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public Message userJoined(
            @DestinationVariable String roomId,
            MessageRequest request
    ) {
        Message message = new Message();
        message.setSender("System");
        message.setContent(request.getSender() + " joined the chat");
        message.setTimeStamp(LocalDateTime.now());
        message.setMessageType("JOIN");
        return message;
    }

    @MessageMapping("/leave/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public Message userLeft(
            @DestinationVariable String roomId,
            MessageRequest request
    ) {
        Message message = new Message();
        message.setSender("System");
        message.setContent(request.getSender() + " left the chat");
        message.setTimeStamp(LocalDateTime.now());
        message.setMessageType("LEAVE");
        return message;
    }

    private String sanitizeMessage(String content) {
        if (content == null) return "";
        return content
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;")
                .trim();
    }
}