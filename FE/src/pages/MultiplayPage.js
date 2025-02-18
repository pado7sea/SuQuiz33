import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { OpenVidu } from "openvidu-browser";
import Players from "../feature/multiplay/Players";
import WaitingRoomSidebar from "../feature/multiplay/WaitingRoomSidebar";
import MyCam from "../feature/learning/MyCam";
import MultiplayModal from "../feature/multiplay/MultiplayModal";
import { exitQuiz, players, quiz, start, end } from "../apis/multiplayApi";
import { userInfo } from "../apis/mypageApi";
import FriendList from "../feature/mypage/community/FriendList";

import GroupsIcon from "@mui/icons-material/Groups";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import styles from "./MultiplayPage.module.css";
import flag from "../assets/images/flag.png";

const MultiplayPage = () => {
  const storedId = sessionStorage.getItem("idStorage");
  const parsedId = JSON.parse(storedId);
  const userId = parsedId.state.userId;
  const storedAccessToken = sessionStorage.getItem("tokenStorage");
  const parsedAccessToken = JSON.parse(storedAccessToken);
  const accessToken = parsedAccessToken.state.accessToken;
  const storedNickname = sessionStorage.getItem("nicknameStorage");
  const parsedNickname = JSON.parse(storedNickname);
  const userNickname = parsedNickname.state.userNickname;
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId, inviteCode, token, isModerator: initialIsModerator } = location.state;
  const [setOV] = useState(null);
  const [session, setSession] = useState(null);
  const [publisher, setPublisher] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playersList, setPlayersList] = useState([]);
  const [isFour, setIsFour] = useState(false);
  const [solver, setSolver] = useState(null);
  const [stage, setStage] = useState(0);
  const [quizList, setQuizList] = useState([]);
  const [quizWordList, setQuizWordList] = useState([]);
  const [quizVideoList, setQuizVideoList] = useState([]);
  const [resCnt, setResCnt] = useState(0);
  const [resList, setResList] = useState([]);
  const [visitedList, setVisitedList] = useState([false, false, false, false, false]);
  const [setIsAnswer] = useState(false);
  const [isModerator, setIsModerator] = useState(initialIsModerator);
  const [finger, setFinger] = useState("#");
  let myScore = 0;
  const [userInfoData, setUserInfoData] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [setChatHistory] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // 초대코드 복사
  const copyCode = () => {
    var tempInput = document.createElement("input");
    tempInput.value = inviteCode;

    document.body.appendChild(tempInput);

    tempInput.select();
    document.execCommand("copy");

    document.body.removeChild(tempInput);
  };

  const changeSolver = async () => {
    if (session) {
      await session
        .signal({
          data: JSON.stringify({
            solver: solver,
          }),
          type: "change-solver",
        })
        .then(() => {
          console.log("solver successfully change");
        })
        .catch((error) => {
          console.error("Error changing solver:", error);
        });
    }
  };

  useEffect(() => {
    if (solver !== null) {
      if (!isPlaying) setIsPlaying(true);
      // solver 정보 보내기
      changeSolver();
    } else {
      if (isPlaying) setIsPlaying(false);
      changeSolver();
    }
  }, [solver]);

  // 게임 시작 이벤트, 방장만 가능
  const startQuiz = async () => {
    // 유저들과 방 db정보 isPlaying을 true로 변경요청
    await start(sessionId);

    // 문제 리스트 업데이트
    await fetchQuizList();

    setResList(["?", "?", "?", "?", "?"]);

    // solver 할당, 참가자들에게 알림. solver가 바뀌면, MyCam이 인식 -> Solver의 finger 인식 시작
    setSolver(userNickname);
  };

  // 퀴즈리스트 받아오기
  const fetchQuizList = async () => {
    try {
      const wordle = await quiz();
      console.log("오늘의 문제");

      // 정답 단어를 리스트에 저장
      const extractedWordNames = wordle.data.map((item) => item.wordName);
      setQuizWordList([...quizWordList, extractedWordNames]);
      // 정답 수어 영상을 리스트에 저장
      const extractedVideoUrls = wordle.data.map((item) => item.videoUrl);
      console.log("퀴즈시작!!!");
      console.log(extractedVideoUrls);
      setQuizVideoList([...quizVideoList, extractedVideoUrls]);
      // 데이터에서 현재 문제의 syllables만 추출하여 quizList에 저장
      const extractedSyllables = wordle.data.map((item) => item.syllables);
      console.log(extractedSyllables);
      const newArray = [...quizList, extractedSyllables];
      setQuizList(newArray);

      if (session) {
        await session
          .signal({
            data: JSON.stringify({
              quizList: JSON.stringify(extractedSyllables),
              quizWordList: JSON.stringify(extractedWordNames),
              quizVideoList: JSON.stringify(extractedVideoUrls),
            }), // 퀴즈 시작 정보 및 문제리스트
            type: "quiz-start",
          })
          .then(() => {
            console.log("Quiz successfully start");
          })
          .catch((error) => {
            console.error("Error starting quiz:", error);
          });
      }
    } catch (error) {
      console.error("Error fetching playersList:", error);
    }
  };

  // 현재 문제의 진행배열 변화
  const changeResList = async (tempResCnt, tempResList, tempVisitedList) => {
    //글자 입력 시그널
    if (session) {
      await session
        .signal({
          data: JSON.stringify({
            resList: JSON.stringify(tempResList),
            visitedList: JSON.stringify(tempVisitedList),
            resCnt: tempResCnt,
          }), // 퀴즈 시작 정보를 담아서,
          type: "change-resList",
        })
        .then(() => {
          console.log("ResList successfully change");
        })
        .catch((error) => {
          console.error("Error changing resList:", error);
        });
    }
  };

  // 정답시 다음 스테이지 (3개로 구성) 이동
  const changeStage = async () => {
    // 다음 문제로 이동
    // 다음 스테이지 진행 시 영상 변경, 글자 이펙트 초기화, 리스트에서 새로운 문제 할당
    // 모든 자모를 맞추면 현재 solver에게 점수 부여, resCnt 초기화, resList 초기화, visitedResList 초기화
    let nextStage = stage + 1;
    setStage((prevStage) => prevStage + 1);
    setResCnt(0);
    setResList(["?", "?", "?", "?", "?"]);
    setVisitedList([false, false, false, false, false]);

    if (session) {
      await session
        .signal({
          data: JSON.stringify({
            isAnswer: true,
            stage: stage,
            res: "?",
            visited: false,
          }),
          type: "change-stage",
        })
        .then(() => {
          console.log("Stage successfully change");
        })
        .catch((error) => {
          console.error("Error changing stage:", error);
        });
    }
    setTimeout(function () {
      setIsAnswer(false);
    }, 3000);

    // 만약 마지막 스테이지라면 종료 함수 호출
    if (nextStage >= quizWordList.length) endGame();
  };

  const endGame = async () => {
    console.log("엔드게임 호출");
    console.log(quizVideoList);
    console.log(quizWordList);

    // for (let i = 0; i < playersList.length; i++) {
    //   if (playersList[i].playerNickname === userNickname) {
    //     scoreList[i] = myScore;
    //   }
    // }

    // BE에 결과 종료 요청
    const result = await end(sessionId, userId, myScore);
    // 결과가 제대로 반환 되었다면

    if (result.data) {
      console.log("모달오픈 호출");
      // setQuizResultList(result.data); //세팅하자
      // result 이용하여 필요한 정보 갖고 결과 모달 띄우기 - 나가기는 leaveSession() 호출, 다시하기는 모달 닫기
      setModalOpen(true);
    }
    if (solver != null) {
      //다른 사용자도 게임 끝내기
      if (session) {
        await session
          .signal({
            data: JSON.stringify(),
            type: "quiz-end",
          })
          .then(() => {
            console.log("quiz successfully finished");
          })
          .catch((error) => {
            console.error("Error finishing quiz:", error);
          });
      }
    }

    // solver, stage, isPlaying, 퀴즈 리스트초기화
    myScore = 0;
    setSolver(null);
    setStage(0);
    setIsPlaying(false);
  };

  const leaveSession = async () => {
    const requestBody = {
      sessionId: sessionId,
      userId: userId,
    };

    try {
      await exitQuiz();
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    // 여기에 방장이 방을 나갈 때 새로운 방장을 선정하는 로직을 추가
    if (isModerator && subscribers.length > 0) {
      // 새로운 방장 ID를 결정하는 로직 (예시로 첫 번째 구독자를 새 방장으로 설정)
      const newModeratorNickname = subscribers[0].nickname;
      // 새 방장 정보를 세션의 모든 참가자에게 신호로 전송
      session
        .signal({
          type: "newModerator",
          data: newModeratorNickname,
        })
        .then(() => {
          console.log("New moderator signal sent");
        })
        .catch((error) => {
          console.error("Error sending new moderator signal:", error);
        });
    }

    if (session) {
      session.disconnect();
      navigate("/quizLobby"); // 퇴장 후 리다이렉트
    }
  };

  // 렌더링 시 오픈비두 띄우기
  useEffect(() => {
    const OVInstance = new OpenVidu();
    setOV(OVInstance);
    const sessionInstance = OVInstance.initSession();

    sessionInstance.on("streamCreated", (event) => {
      const subscriber = sessionInstance.subscribe(event.stream, undefined);
      // 구독자의 connectionData에서 닉네임 파싱
      console.log(event.stream.connection.data);
      const connectionData = event.stream.connection.data;
      const nickname = connectionData || "Anonymous";
      setSubscribers((prevSubscribers) => [
        ...prevSubscribers,
        { streamManager: subscriber, nickname: nickname }, // 구독자 객체에 닉네임 추가
      ]);
    });

    sessionInstance.on("streamDestroyed", (event) => {
      setSubscribers((prevSubscribers) =>
        prevSubscribers.filter((sub) => sub.streamManager.stream.streamId !== event.stream.streamId)
      );
    });

    sessionInstance
      .connect(token)
      .then(() => {
        const publisher = OVInstance.initPublisher(undefined, {
          audioSource: undefined,
          videoSource: undefined,
          publishAudio: false,
          publishVideo: true,
          resolution: "640x480",
          frameRate: 30,
          insertMode: "APPEND",
          mirror: true,
        });
        sessionInstance.publish(publisher);
        setPublisher(publisher);
      })
      .catch((error) => console.log("There was an error connecting to the session:", error));

    setSession(sessionInstance);

    // 새로운 방장 정보를 처리하는 이벤트 리스너 추가
    sessionInstance.on("signal:newModerator", (event) => {
      const newModeratorNickname = event.data;
      // 현재 사용자가 새로운 방장인지 확인하고 상태 업데이트
      if (userNickname === newModeratorNickname) {
        setIsModerator(true);
        console.log("방장이 되었습니다.");
      }
    });

    return () => {
      if (sessionInstance) {
        sessionInstance.disconnect();
      }
    };
  }, [sessionId, token]);

  // 새로운 참가자가 들어오면 4명인지 검사하기 위해 실행
  useEffect(() => {
    const fetchData = async () => {
      try {
        const playerResponse = await players(sessionId);
        setPlayersList(playerResponse.data);
        // 참가 인원 배포 전에 4로 수정하기 ***************************************
        if (playerResponse.data.length <= 4 && playerResponse.data.length > 1) {
          setIsFour(true);
        }
      } catch (error) {
        console.error("Error fetching playersList:", error);
      }
    };

    fetchData();
  }, [subscribers]);

  const changeFinger = (value) => {
    setFinger(value);
    console.log(value);
  };

  useEffect(() => {
    console.log("resList변화");
    console.log(resList);
  }, [resList]);

  // 글자 하나 입력 (finger 변화할 때마다)시 채점을 위해 실행되는 부분.
  useEffect(() => {
    console.log("모션인식");
    if (isPlaying && solver === userNickname) {
      let tempResCnt = resCnt;
      let isCorrect = false;
      // let tempResList = [...resList];

      // console.log(tempResList);
      // for (let i = 0; i < 5; i++) {
      //   console.log(quizList[stage][0][i]);
      //   console.log(finger);

      //   // 입력한 적 없는 정답 - 해당 글자의 위치에 맞게 글자 체크, 이펙트 등장
      //   if (!visitedList[i] && quizList[stage][0][i] === finger) {
      //     console.log(tempResList);
      //     tempResList[i] = finger;
      //     console.log("afterChange");
      //     console.log(tempResList);
      //     visitedList[i] = true;
      //     tempResCnt += 1;
      //     isCorrect = true;
      //   }
      // }
      let tempVisitedList = [...visitedList];
      console.log(quizList[stage][0]);
      console.log(finger);
      console.log(visitedList);
      console.log(resList);
      // 새로운 resList 계산
      const tempResList = resList.map((item, index) => {
        if (!visitedList[index] && quizList[stage][0][index] == finger) {
          console.log("여기옴");
          tempVisitedList[index] = true;
          tempResCnt += 1;
          isCorrect = true;
          return finger; // 현재 finger 값으로 업데이트
        }
        return item; // 변경 없음
      });

      if (isCorrect) {
        setResList(tempResList);
        setResCnt(tempResCnt);
        console.log("포함");
        changeResList(tempResCnt, tempResList, tempVisitedList);
        // 만약 모두 맞추어 낱말을 완성했다면 정답 시그널
        if (tempResCnt === 5) {
          if (solver === userNickname) {
            myScore += 1;
          }
          changeStage();
        }
      }
      // 오답이거나 입력한 적 있는 정답이면 solver 변화
      else {
        for (let j = 0; j < playersList.length; j++) {
          if (playersList[j].playerNickname === userNickname) {
            setSolver(playersList[(j + 1) % playersList.length].playerNickname);
            console.log(playersList[(j + 1) % playersList.length].playerNickname);
            break;
          }
        }
        console.log("불포함");
        // changeSolver();
      }
    }
  }, [finger]);

  // 세션 시그널 & on 이벤트 부분! 모든 구독자에게 뿌려주는 데이터 위주
  useEffect(() => {
    // 게임이 시작되면 실행될 콜백 함수
    const handleStartQuiz = (event) => {
      let data = JSON.parse(event.data);

      // 퀴즈 리스트 업데이트
      setQuizList([...quizList, JSON.parse(data.quizList)]);
      setQuizWordList([...quizWordList, JSON.parse(data.quizWordList)]);
      setQuizVideoList([...quizVideoList, JSON.parse(data.quizVideoList)]);
      // 참가자들의 퀴즈 시작 정보 업데이트
      setIsPlaying(true);
    };

    const handleChangeSolver = (event) => {
      let data = JSON.parse(event.data);
      console.log("now solver :", data.solver);
      setSolver(data.solver); // 현재 Solver 정보 업데이트
    };

    const handleNewModerator = (event) => {
      let newModeratorNickname = event.data;
      // 현재 사용자가 새로운 방장인지 확인하고 상태 업데이트
      if (userNickname === newModeratorNickname) {
        setIsModerator(true);
        console.log("방장이 되었습니다.");
      }
    };

    const handleSetResList = (event) => {
      let newData = JSON.parse(event.data);
      setResList(...resList, JSON.parse(newData.resList));
      setVisitedList(JSON.parse(newData.visitedList));
      // setVisitedList(JSON.parse(newData.visitedList))
      console.log(newData.resCnt);
      setResCnt(newData.resCnt);
      console.log(resCnt);
    };

    const handleSetStage = (event) => {
      let newData = JSON.parse(event.data);
      setStage(newData.stage);
      setResCnt(0);
      setResList([newData.res, newData.res, newData.res, newData.res, newData.res]);
      setVisitedList([newData.visited, newData.visited, newData.visited, newData.visited, newData.visited]);

      setIsAnswer(newData.isAnswer);

      setTimeout(function () {
        setIsAnswer(false);
      }, 3000);
    };

    const handleEndQuiz = (event) => {
      endGame();
    };

    if (session) {
      session.on("signal:quiz-start", handleStartQuiz); // 게임 시작 정보 전달
      session.on("signal:change-solver", handleChangeSolver); // solver 변경 정보 전달
      session.on("signal:newModerator", handleNewModerator); // 방장이 방 나가면 방장 변경 정보 전달
      session.on("signal:change-resList", handleSetResList); // 답안 배열 변경 정보 전달
      session.on("signal:change-stage", handleSetStage); // 스테이지 변경 정보 전달
      session.on("signal:quiz-end", handleEndQuiz);
    }

    return () => {
      if (session) {
        session.off("signal:quiz-start", handleStartQuiz);
        session.off("signal:change-solver", handleChangeSolver); // solver 변경 정보 전달
        session.off("signal:newModerator", handleNewModerator); // 방장이 방 나가면 방장 변경 정보 전달
        session.off("signal:change-resList", handleSetResList); // 답안 배열 변경 정보 전달
        session.off("signal:change-stage", handleSetStage); // 스테이지 변경 정보 전달
        session.off("signal:quiz-end", handleEndQuiz);
      }
    };
  }, [session]);

  const LinearProgressbar = ({ level, exp }) => {
    const maxExp = (level - 1) * 50 + 100;
    const percentage = Math.min(100, (exp / maxExp) * 100); // 현재 경험치를 퍼센트로 변환, 최대 100%

    return (
      <div className="w-full h-4 bg-gray-200 rounded-full">
        <div className={styles.progress} style={{ width: `${percentage}%` }}></div>
      </div>
    );
  };

  const sendMessage = () => {
    if (session) {
      session
        .signal({
          data: JSON.stringify({
            message: chatMessage,
            senderNickname: userInfoData.nickname, // 보낸 사람의 닉네임 추가
          }),
          type: "chat-message",
        })
        .then(() => {
          console.log("Message successfully sent");
          setChatMessage(""); // Clear input field after sending message
        })
        .catch((error) => {
          console.error("Error sending message:", error);
        });
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const data = await userInfo(userId);
        setUserInfoData(data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchUserInfo();
  }, []); // 빈 배열을 전달하여 컴포넌트가 마운트될 때 한 번만 호출

  // 채팅 메시지를 수신할 때마다 실행될 콜백 함수
  useEffect(() => {
    const handleChatMessage = (event) => {
      console.log("Received chat message:", event.data);
      setChatHistory((prevChatHistory) => [...prevChatHistory, JSON.parse(event.data)]);
    };

    if (session) {
      session.on("signal:chat-message", handleChatMessage);
    }

    return () => {
      if (session) {
        session.off("signal:chat-message", handleChatMessage);
      }
    };
  }, [session]);

  return (
    <>
      <div className={styles.container}>
        {!isPlaying ? (
          <>
            <div className={styles.topContainer}>
              <div className={styles.beforePlaying}>
                {/* 사용자 정보 표시 부분 */}
                <div className={styles.userInfo}>
                  <div className="relative w-20 h-20">
                    <img src={flag} alt="Flag" className="absolute inset-0 z-10 w-full h-full py-2" />
                    <div className="absolute inset-0 z-20 flex items-center justify-center pb-3">
                      <div className="font-bold text-xl text-[#f4b28e]">Lv.{userInfoData.level}</div>
                    </div>
                  </div>
                  {/* <img src={getUserInfo().profileImage} alt="프로필 이미지" className={styles.profileImage} /> */}
                  <div className="w-64 ml-3">
                    <div className="w-full text-xl font-bold">{userInfoData.nickname}</div>
                    <div className="text-gray-500">EXP.{userInfoData.exp}</div>
                    <div className={styles.progressBar}>
                      <LinearProgressbar level={userInfoData.level} exp={userInfoData.exp} />
                    </div>
                  </div>
                </div>
                {/* 친구한테 초대코드 보내기 위한 컴포넌트 */}
                <div className={styles.friendList}>
                  <FriendList isMultiplay={true} />
                </div>
              </div>
            </div>

            <div className={styles.middleContainer}>
              <div className={styles.topButton}>
                <div className={styles.member}>
                  <GroupsIcon fontSize="large" /> &nbsp;
                  {subscribers.length + 1} / 4
                </div>
                <button onClick={leaveSession} className={styles.leave}>
                  나가기
                </button>
              </div>
              <Players publisher={publisher} subscribers={subscribers} isPlaying={isPlaying} />
              <div className={styles.bottomButton}>
                <div className={styles.code} onClick={copyCode}>
                  입장 코드 : {inviteCode} &nbsp;
                  <ContentCopyIcon fontSize="x-small" />
                </div>
                {isModerator ? (
                  <>
                    {/* 방장 */}
                    {/* 4명이 모이기 전/후 */}
                    {isFour ? (
                      <div onClick={startQuiz} className={styles.start}>
                        시작하기
                      </div>
                    ) : (
                      <div className={styles.unactive}>시작하기</div>
                    )}
                  </>
                ) : (
                  <>{/* 참가자라서 시작하기 버튼 X */}</>
                )}
              </div>
            </div>
            <div></div>
          </>
        ) : (
          <>
            <div className={styles.leftContainer}>
              {/* 게임 시작 후 */}
              {solver === userNickname ? (
                <>
                  <div className={styles.mycam}>
                    <MyCam categoryNumber={4} changeFinger={changeFinger} isVideoVisible={false}></MyCam>
                  </div>
                </>
              ) : (
                <></>
              )}
              <div className={styles.topButton}>
                <div>
                  <div onClick={leaveSession} className={styles.leave}>
                    나가기
                  </div>
                </div>
                <div className={styles.cellList}>
                  {resList.map((index) => (
                    <div className={styles.cell}>{index === "?" ? "ㅤ" : index}</div>
                  ))}
                </div>
                <div></div>
              </div>
              <Players publisher={publisher} subscribers={subscribers} solver={solver} isPlaying={isPlaying} />
            </div>
          </>
        )}
        <div className={styles.onSidebar}>
          {!isPlaying ? (
            <></>
          ) : (
            <>
              <div className={styles.video}>
                <video key={quizVideoList} loop autoPlay muted style={{ borderRadius: "0.5rem" }}>
                  <source src={quizVideoList[stage]} type="video/mp4" />
                  영상이 존재하지 않습니다.
                </video>
              </div>
            </>
          )}
          <WaitingRoomSidebar session={session} isPlaying={isPlaying} />
        </div>
      </div>
      {modalOpen && (
        <MultiplayModal
          sessionId={sessionId}
          myScore={myScore}
          onClose={handleCloseModal}
          solver={solver}
          playersList={playersList}
          quizWord={quizWordList}
          quizVideo={quizVideoList}
        />
      )}
    </>
  );
};

export default MultiplayPage;
