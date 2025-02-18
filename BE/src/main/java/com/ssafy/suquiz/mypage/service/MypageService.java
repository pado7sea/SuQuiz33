package com.ssafy.suquiz.mypage.service;

import com.ssafy.suquiz.mypage.dto.MypageDto;
import com.ssafy.suquiz.singleplay.domain.SingleHistory;
import com.ssafy.suquiz.singleplay.repository.SingleHistoryRepository;
import com.ssafy.suquiz.user.domain.User;
import com.ssafy.suquiz.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
@RequiredArgsConstructor
public class MypageService {

    private final UserRepository userRepository;
    private final SingleHistoryRepository singleHistoryRepository;

    public MypageDto.UserResponse find(Long userId) {
        /**
         * nickname, profile image, level, exp
         */
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();

            return MypageDto.UserResponse.builder()
                    .nickname(user.getNickname())
                    .profileImage(user.getImageUrl())
                    .level(user.getLevel())
                    .exp(user.getXp())
                    .build();
        }
        return null;
    }

    public MypageDto.NicknameModifyResoponse modify(MypageDto.NicknameModifyRequest request) {

        Optional<User> optionalUser = userRepository.findById(request.getUserId());
        if (optionalUser.isPresent()) {
            /**
             * toBuiler()를 통해 값을 변경하면 UserBuiler Class를 통해 변수값을 변경하는 것
             * 따라서, 영속성 컨텍스트가 User의 변경사항을 인지하지 못하고
             * DB값이 수정되지도 않는다.
             */
//            optionalUser.get().toBuilder()
//                    .nickname(request.getModifiedName())
//                    .build();
            User user = optionalUser.get();
            user.changeNickname(request.getModifiedName());

            return MypageDto.NicknameModifyResoponse.builder()
                    .modifiedName(request.getModifiedName())
                    .build();
        } else {
            return null;
        }
    }

    public MypageDto.UserWordleResponse userWordleResponse(Long userId) {

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isPresent()) {

            // user
            User user = optionalUser.get();
            // user's all single histories
            List<SingleHistory> histories = singleHistoryRepository.findAllByUser(user);

            // all single histories count
            int allTrialCount = histories.size();
            // streak
            Map<LocalDate, Integer> streak = new TreeMap<>();
            // trial spread : 1 ~ 6
            int[] trialSpread = new int[7];
            // correctRate
            float correctRate;
            float okCount = 0;

            // 현재 날짜
            LocalDate currentDate = LocalDate.now();
            // 1년 전 날짜 계산
            LocalDate oneYearAgo = currentDate.minusYears(1);
            // 1년 전부터 오늘까지 풀지 않은 값 저장
            for (LocalDate date = oneYearAgo; date.isBefore(currentDate.plusDays(1)); date = date.plusDays(1)) {
                streak.put(date, 0);
            }

            // streak, trial spread
            for (SingleHistory singleHistory: histories) {
                // streak
                LocalDate getDate = singleHistory.getCreateDate();
                if (singleHistory.isCorrect()) {
                    okCount += 1;
                    streak.put(getDate, 1);
                } else {
                    streak.put(getDate, -1);
                }
                // trial spread
                trialSpread[singleHistory.getTrialCount()] += 1;
            }

            return MypageDto.UserWordleResponse.builder()
                    .allTrialCount(allTrialCount)
                    .streak(streak)
                    .solveCount(user.getSolveCount())
                    .correctCount(user.getCorrectCount())
                    .maxCorrectCount(user.getMaxCorrectCount())
                    .trialSpread(Arrays.copyOfRange(trialSpread, 1, trialSpread.length))
                    .correctRate((int) (okCount/allTrialCount*100))
                    .build();
        }
        return null;
    }
}
