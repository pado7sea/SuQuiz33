import React, { useState, useEffect } from "react";

import ModalMakeFriend from "./friend/ModalMakeFriend";
import ModalEndFriendship from "./friend/ModalEndFriendship";
import Chatting from "../community/Chatting";

import styles from "./FriendList.module.css";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { pullFriends } from "../../../apis/mypageApi";

const FriendList = ({ isMultiplay }) => {
  const storedId = sessionStorage.getItem("idStorage");
  const parsedId = JSON.parse(storedId);
  const userId = parsedId.state.userId;
  const [friends, setFriends] = useState([]);
  const [filterFriend, setFilterFriend] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [doSearch, setDoSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [toNickname, setToNickname] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);

  const openMakeModal = () => {
    setIsModalOpen(true);
  };

  const closeMakeModal = () => {
    setIsModalOpen(false);
  };

  const openEndModal = (friendNickname) => {
    setToNickname(friendNickname);
    setEndModalOpen(true);
  };

  const closeEndModal = () => {
    setEndModalOpen(false);
  };

  const closeChatting = () => {
    setSelectedFriend(null);
  };

  const handleChatButtonClick = (friend) => {
    setSelectedFriend(friend);
  };

  const handleSearchFriend = (e) => {
    e.preventDefault();
    const filteredFriends = friends.filter((friend) => friend.nickname.includes(searchValue));
    setFilterFriend(filteredFriends);

    setDoSearch(true);
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await pullFriends(userId);
        // 만약 응답이 성공이고, data.data가 존재한다면 그 값을 사용
        if (data.status === 200 && data.data) {
          setFriends(data.data);
        } else {
          console.error("Error fetching data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchFriends();
  }, [endModalOpen]);

  return (
    <>
      <div>
        {selectedFriend === null ? (
          <>
            {isMultiplay ? (
              <></>
            ) : (
              <>
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-around mt-2 gap">
                    <button className={styles.addButton} onClick={openMakeModal}>
                      <PersonAddRoundedIcon />
                    </button>
                    <form onSubmit={handleSearchFriend} className="flex items-center">
                      <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="친구 닉네임"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                      ></input>
                      <button className={styles.searchButton} onClick={handleSearchFriend}>
                        <SearchRoundedIcon />
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}
            <div>
              {!doSearch && (
                <ul>
                  {friends.map((friend) => (
                    <li className={styles.friendItem} key={friend.nickname}>
                      <p className={styles.friendName}>{friend.nickname}</p>
                      <p className={styles.friendLevel}>Lv.{friend.level}</p>
                      <button className={styles.friendButton} onClick={() => handleChatButtonClick(friend)}>
                        채팅
                      </button>
                      <button className={styles.deleteButton} onClick={() => openEndModal(friend.nickname)}>
                        <PersonRemoveRoundedIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {doSearch && (
                <ul>
                  {filterFriend.map((friend) => (
                    <li className={styles.friendItem} key={friend.nickname}>
                      <p className={styles.friendName}>{friend.nickname}</p>
                      <p className={styles.friendLevel}>{friend.level}</p>
                      <button className={styles.friendButton} onClick={() => handleChatButtonClick(friend)}>
                        채팅
                      </button>
                      <button className={styles.deleteButton} onClick={() => openEndModal(friend.nickname)}>
                        <PersonRemoveRoundedIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <Chatting
            friendId={selectedFriend.friendId}
            userId={userId}
            friendNickname={selectedFriend.nickname}
            onClose={closeChatting}
          />
        )}
        {isModalOpen && <ModalMakeFriend onClose={closeMakeModal} />}
        {endModalOpen && <ModalEndFriendship onClose={closeEndModal} friendNickname={toNickname} />}{" "}
      </div>
    </>
  );
};

export default FriendList;
