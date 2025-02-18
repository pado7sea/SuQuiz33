package com.ssafy.suquiz.mypage.controller;

import com.ssafy.suquiz.global.dto.CommonResponse;
import com.ssafy.suquiz.mypage.dto.MypageDto;
import com.ssafy.suquiz.mypage.service.MypageService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/mypage")
@RequiredArgsConstructor
@Tag(name = "마이페이지", description = "조회, 수정, 워들")
public class MypageController {

    private final MypageService mypageService;

    /**e
     * request param : query parameter
     * request body : request body
     * GET : query parameter
     * POST, PUT, DELETE : request body
     */
    @GetMapping("/{userId}")
    public ResponseEntity<CommonResponse<MypageDto.UserResponse>> find(@PathVariable(value = "userId") long userId) {
        /**
         * nickname, profile image, level, exp
         */
        MypageDto.UserResponse response = mypageService.find(userId);
        return new ResponseEntity<>(CommonResponse.<MypageDto.UserResponse>builder()
                .status(HttpStatus.OK.value())
                .message("success : find user")
                .data(response)
                .build(), HttpStatus.OK);
    }

    @PutMapping("/modify")
    public ResponseEntity<CommonResponse<MypageDto.NicknameModifyResoponse>> modify(@RequestBody MypageDto.NicknameModifyRequest request) {
        /**
         * modified nickname
         */
//        String response = mypageService.modify(request);

        return new ResponseEntity<>(CommonResponse.<MypageDto.NicknameModifyResoponse>builder()
                .status(HttpStatus.OK.value())
                .message("success : modify user nickname")
                .data(mypageService.modify(request))
                .build(), HttpStatus.OK);
    }

    @GetMapping("/wordle/{userId}")
    public ResponseEntity<CommonResponse<MypageDto.UserResponse>> wordle(@PathVariable(value = "userId") long userId) {

        MypageDto.UserWordleResponse response = mypageService.userWordleResponse(userId);
        return new ResponseEntity<>(CommonResponse.<MypageDto.UserResponse>builder()
                .status(HttpStatus.OK.value())
                .message("success : user wordle list")
                .data(response)
                .build(), HttpStatus.OK);
    }
}
