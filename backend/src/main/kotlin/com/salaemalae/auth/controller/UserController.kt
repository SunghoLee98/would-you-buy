package com.salaemalae.auth.controller

import com.salaemalae.auth.dto.UserProfileDto
import com.salaemalae.auth.service.UserService
import com.salaemalae.common.response.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("isAuthenticated()")
class UserController(
    private val userService: UserService
) {

    @GetMapping("/me")
    fun getCurrentUserProfile(): ResponseEntity<ApiResponse<UserProfileDto>> {
        val profile = userService.getCurrentUser()
        return ResponseEntity.ok(ApiResponse.success(profile))
    }
}