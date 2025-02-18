import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useUserNicknameStore, useUserEmailStore, useProviderStore } from "../../../app/store";
import { checkNickname, signupUser } from "../../../apis/usersApi";

import styles from "./ModalSignup.module.css";

const Modal = ({ onClose, email }) => {
  const modalRef = useRef();
  const [checkValue, setCheckValue] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(0);
  const { userEmail, setUserEmail } = useUserEmailStore();
  const { provider, setProvider } = useProviderStore();
  const { userNickname, setUserNickname } = useUserNicknameStore();
  const navigate = useNavigate();

  const checkCondition = (value) => {
    // 정규식을 사용하여 주어진 문자열이 한글로만 이루어져 있는지 확인
    const koreanRegex = /^[가-힣]+$/;

    // 주어진 문자열이 한글로만 이루어져 있고, 길이가 15 이하일 경우 true를 반환
    return koreanRegex.test(value) && value.length <= 15;
  };

  const handleCheck = async () => {
    try {
      const data = await checkNickname(checkValue);
      // data.data가 true면 사용가능한 닉네임
      if (data.data) {
        if (checkCondition(checkValue)) {
          setIsConfirmed(2);
        } else {
          setIsConfirmed(3);
        }
      } else {
        setIsConfirmed(1);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSignup = async () => {
    try {
      const data = await signupUser(userEmail, checkValue, provider);
      // 만약 응답이 성공이고, data.data가 존재한다면 그 값을 사용
      if (data.data) {
        setUserNickname(checkValue);
        sessionStorage.setItem("emailStorage", null);
        onClose();
        navigate("/");
        alert("회원가입 완료");
      } else {
        // 응답이 성공이 아니거나 data.data가 없을 경우에 대한 처리
        console.error("Error fetching data:", data.message);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleClickInside = (event) => {
    // 모달 내부를 클릭한 경우 이벤트 전파를 중지시킴
    event.stopPropagation();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleCheck();
    }
  };

  return (
    <div className={styles.modalBackground}>
      <div ref={modalRef} className={styles.modal} onClick={handleClickInside}>
        <div className={styles.modalTitle}>
          <div>회원 가입</div>
          <span className={styles.close} onClick={onClose}>
            &times;
          </span>
        </div>
        <div className={styles.modalContent}>
          <div>
            <p className={styles.subtitle}>닉네임 설정</p>

            <div className={styles.input}>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="15자 이하의 한글"
                value={checkValue}
                onChange={(e) => setCheckValue(e.target.value)}
                onKeyPress={handleKeyPress}
              ></input>
              <button className={styles.cancelBtn} onClick={handleCheck}>
                중복검사
              </button>
              {isConfirmed === 2 && <p style={{ color: "blue", fontSize: "12px" }}>사용 가능한 닉네임입니다.</p>}
              {isConfirmed === 1 && <p style={{ color: "red", fontSize: "12px" }}>사용 중인 닉네임입니다.</p>}
              {isConfirmed === 3 && <p style={{ color: "red", fontSize: "12px" }}>적합하지 않은 닉네임입니다.</p>}
            </div>
          </div>

          <div className={styles.bottomBox}>
            <p>SuQuiz 서비스 이용약관에 동의하시면 '저장'을 눌러주세요.</p>
            <div className={styles.btns}>
              <button
                className={isConfirmed === 2 ? styles.requestBtn : styles.disable}
                onClick={isConfirmed === 2 && handleSignup}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
