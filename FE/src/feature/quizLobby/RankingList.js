import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css"; // 스타일 시트 임포트

import styles from "./RankingList.module.css";

import goldMedal from "../../assets/icons/gold-medal.png"; // 금메달 이미지 경로
import silverMedal from "../../assets/icons/silver-medal.png"; // 은메달 이미지 경로
import bronzeMedal from "../../assets/icons/bronze-medal.png"; // 동메달 이미지 경로
import flag from "../../assets/images/flag.png";
import { flatMapDeep } from "lodash";

const RankingList = () => {
  const storedId = localStorage.getItem("idStorage");
  const parsedId = JSON.parse(storedId);
  const userId = parsedId.state.userId;
  const storedNickname = localStorage.getItem("nicknameStorage");
  const parsedNickname = JSON.parse(storedNickname);
  const userNickname = parsedNickname.state.userNickname;
  const storedToken = localStorage.getItem("tokenStorage");
  const parsedToken = JSON.parse(storedToken);
  const accessToken = parsedToken.state.accessToken;

  const [rankingData, setRankingData] = useState(null);
  const [userInfoData, setUserInfoData] = useState(null);

  // 데이터 로딩 상태를 표시하기 위한 state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_ROOT}/ranking/${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }); // API 경로
        const data = await response.json();
        console.log(data);
        // 만약 응답이 성공이면 그 값을 사용
        if (data.status === 200) {
          setRankingData(data.data);
          console.log(data.data);
        } else {
          // 응답이 성공이 아니거나 data.data가 없을 경우에 대한 처리
          console.error("Error fetching data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`/mypage/${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("서버 응답이 실패했습니다.");
        }

        const data = await response.json();
        setUserInfoData(data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchRanking();
    fetchUserInfo();

    // 데이터 로딩이 완료된 후 setLoading을 false로 설정
    setLoading(false);
  }, []);

  const getUserInfo = () => {
    return userInfoData != null
      ? userInfoData
      : {
          nickname: "",
          profileImage: "",
          level: 0,
          exp: 0,
        };
  };

  // 데이터 로딩 중 표시할 UI
  if (loading) {
    return <div>Loading...</div>;
  }

  // 데이터가 없을 경우 표시할 UI
  if (!rankingData) {
    return <div>랭킹 데이터를 불러오는 데 실패했습니다.</div>;
  }

  const LinearProgressbar = ({ level, exp }) => {
    const maxExp = (level - 1) * 50 + 100;
    const percentage = Math.min(100, (exp / maxExp) * 100); // 현재 경험치를 퍼센트로 변환, 최대 100%

    return (
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div className="bg-coutom-yellow h-4 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
    );
  };

  return (
    <div>
      {/* 사용자 정보 표시 부분 */}
      <div className={styles.userInfo}>
        <div className="relative w-20 h-24">
          <img src={flag} alt="Flag" className="absolute inset-0 w-full h-full object-cover z-10" />
          <div className="absolute inset-0 flex items-center justify-center pb-3 z-20">
            <div className="font-bold text-2xl text-[#f4b28e]">Lv.{getUserInfo().level}</div>
          </div>
        </div>
        {/* <img src={getUserInfo().profileImage} alt="프로필 이미지" className={styles.profileImage} /> */}
        <div className="w-72">
          <div className="mb-1 font-bold text-2xl w-full">{userNickname}</div>
          <div className="text-gray-500">EXP.{getUserInfo().exp}</div>
          <div className={styles.progressBar}>
            <LinearProgressbar level={getUserInfo().level} exp={getUserInfo().exp} />
          </div>
        </div>
      </div>
      {/* 나의 랭킹 테이블 */}
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            <th className="w-[70px]">내 순위</th>
            <th>닉네임</th>
            <th>레벨</th>
            <th className="w-[70px]">경험치</th>
          </tr>
        </thead>
        <tbody>
          {rankingData &&
            rankingData.ranking
              .filter((user) => user.nickname === userNickname) // 사용자의 닉네임과 일치하는 항목만 필터링
              .map((user, index) => (
                <motion.tr
                  key={user.nickname}
                  className={`${user.nickname === userNickname ? styles.highlight : ""} ${styles.tableRow}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <td className="flex justify-center items-center">
                    {rankingData.myRank === 1 ? (
                      <img src={goldMedal} alt="Gold Medal" />
                    ) : rankingData.myRank === 2 ? (
                      <img src={silverMedal} alt="Silver Medal" />
                    ) : rankingData.myRank === 3 ? (
                      <img src={bronzeMedal} alt="Bronze Medal" />
                    ) : (
                      rankingData.myRank
                    )}
                  </td>
                  <td
                    className={`${
                      rankingData.myRank === 1
                        ? styles.goldMedalName
                        : rankingData.myRank === 2
                        ? styles.silverMedalName
                        : rankingData.myRank === 3
                        ? styles.bronzeMedalName
                        : ""
                    }`}
                  >
                    {user.nickname}
                    {user.nickname === userNickname && <span className={styles.myIcon}> 🍋</span>}
                  </td>
                  <td>{user.level}</td>
                  <td>{user.exp}</td>
                </motion.tr>
              ))}
        </tbody>
      </table>

      {/* 상위 10명 랭킹 테이블 */}
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            <th className="w-[70px]">전체 순위</th>
            <th>닉네임</th>
            <th>레벨</th>
            <th className="w-[70px]">경험치</th>
          </tr>
        </thead>
        <tbody>
          {rankingData &&
            rankingData.ranking.slice(0, 10).map((user, index) => (
              <motion.tr
                key={user.nickname}
                className={`${user.nickname === userNickname ? styles.highlight : ""} ${styles.tableRow}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <td className="flex justify-center items-center">
                  {index === 0 ? (
                    <img src={goldMedal} alt="Gold Medal" />
                  ) : index === 1 ? (
                    <img src={silverMedal} alt="Silver Medal" />
                  ) : index === 2 ? (
                    <img src={bronzeMedal} alt="Bronze Medal" />
                  ) : (
                    index + 1
                  )}
                </td>
                <td
                  className={`${
                    index === 0
                      ? styles.goldMedalName
                      : index === 1
                      ? styles.silverMedalName
                      : index === 2
                      ? styles.bronzeMedalName
                      : ""
                  }`}
                >
                  {user.nickname}
                  {user.nickname === userNickname && <span className={styles.myIcon}> 🍋</span>}
                </td>
                <td>{user.level}</td>
                <td>{user.exp}</td>
              </motion.tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingList;
