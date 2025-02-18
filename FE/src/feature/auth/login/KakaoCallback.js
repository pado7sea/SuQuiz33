import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  useAuthStore,
  useUserNicknameStore,
  useUserEmailStore,
  useProviderStore,
  useTokenStore,
} from "../../../app/store";
import { oauthKakao, checkIsMember } from "../../../apis/usersApi";
import backgroundVideo from "../../../assets/backgroundVideo.mp4";
import styles from "./Callback.module.css";
import ModalSignup from "../signup/ModalSignup";

const KakaoCallback = () => {
  const { userId, setUserId } = useAuthStore();
  const { userNickname, setUserNickname } = useUserNicknameStore();
  const { userEmail, setUserEmail } = useUserEmailStore();
  const { provider, setProvider } = useProviderStore();
  const { accessToken, setAccessToken } = useTokenStore();
  const location = useLocation();
  const navigate = useNavigate();
  // 모달창 노출 여부 state
  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  // 함수를 전달하여 모달 닫기
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const fetchNickname = async (email, provider) => {
    try {
      const data = await checkIsMember(email, provider); // API 경로
      // 만약 응답이 성공이고, data.data가 존재한다면 그 값을 사용
      if (data.data) {
        setUserNickname(data.data.nickname);
        setUserEmail(null);
        navigate("/");
      } else {
        // 회원가입 모달 띄우자
        handleOpenModal();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleOAuthKakao = async (code) => {
    try {
      // 카카오로부터 받아온 code를 서버에 전달하여 카카오로 회원가입 & 로그인한다
      const response = await oauthKakao(code);
      setUserId(response.data.data.userId);
      setUserEmail(response.data.data.email);
      setProvider(response.data.data.oauthProvider);
      setAccessToken(response.data.data.authTokens.accessToken);
      await fetchNickname(response.data.data.email, response.data.data.oauthProvider);
    } catch (error) {
      alert(error);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code"); // 카카오는 Redirect 시키면서 code를 쿼리 스트링으로 준다.
    if (code) {
      handleOAuthKakao(code);
    }
  }, [location]);

  return (
    <>
      <div className={styles.videoContainer}>
        <video className={styles.video} autoPlay loop muted>
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      </div>

      {/* openModal이 true일 때만 모달 렌더링 */}
      {openModal && <ModalSignup onClose={handleCloseModal} email={userEmail} />}
    </>
  );
};

export default KakaoCallback;
