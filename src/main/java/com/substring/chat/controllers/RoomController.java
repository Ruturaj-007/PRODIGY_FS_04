package com.substring.chat.controllers;

import com.substring.chat.config.AppConstants;
import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.repositories.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.NotBlank; // CHANGED
import jakarta.validation.constraints.Size; // CHANGED
import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
@CrossOrigin(origins = "*")
public class RoomController {

    private final RoomRepository roomRepository;

    public RoomController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @PostMapping
    public ResponseEntity<?> createRoom(
            @RequestBody @NotBlank @Size(max = AppConstants.MAX_ROOM_ID_LENGTH) String roomId
    ) {
        if (roomRepository.findByRoomId(roomId.trim()) != null) {
            return ResponseEntity.badRequest().body("Room already exists!");
        }

        Room room = new Room();
        room.setRoomId(roomId.trim());
        Room savedRoom = roomRepository.save(room);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedRoom);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<?> joinRoom(@PathVariable String roomId) {
        Room room = roomRepository.findByRoomId(roomId);

        if (room == null) {
            room = new Room();
            room.setRoomId(roomId);
            room = roomRepository.save(room);
        }

        return ResponseEntity.ok(room);
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable String roomId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size
    ) {
        Room room = roomRepository.findByRoomId(roomId);

        if (room == null) {
            return ResponseEntity.badRequest().build();
        }

        List<Message> messages = room.getMessages();
        int totalMessages = messages.size();

        int start = Math.max(0, totalMessages - (page + 1) * size);
        int end = Math.min(totalMessages, totalMessages - page * size);

        List<Message> paginatedMessages = messages.subList(start, end);

        return ResponseEntity.ok(paginatedMessages);
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<?> deleteRoom(@PathVariable String roomId) {
        Room room = roomRepository.findByRoomId(roomId);

        if (room == null) {
            return ResponseEntity.notFound().build();
        }

        roomRepository.delete(room);
        return ResponseEntity.ok("Room deleted successfully");
    }
}