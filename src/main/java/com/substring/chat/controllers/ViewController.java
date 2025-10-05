package com.substring.chat.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ViewController {

    // Home page
    @GetMapping("/")
    public String index() {
        return "index";
    }

    // Chat room page
    @GetMapping("/room/{roomId}")
    public String room(
            @PathVariable String roomId,
            @RequestParam(required = false) String username,
            Model model
    ) {
        if (roomId == null || roomId.trim().isEmpty()) {
            model.addAttribute("error", "Invalid room ID");
            return "error";
        }

        model.addAttribute("roomId", roomId);
        model.addAttribute("username", username != null ? username : "Anonymous");
        return "room";
    }
}