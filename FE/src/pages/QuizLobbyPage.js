import React, { useState } from "react";

import Container from "../components/Container";
import RankingList from "../feature/quizLobby/RankingList";
import QuizSelect from "../feature/quizLobby/QuizSelect";

export default function QuizLobbyPage() {
  return (
    <Container>
      <div className="flex gap-10">
        <div className="w-2/6 py-6 h-[90vh]">
          <RankingList />
        </div>
        <div className="w-4/6 h-[90vh]">
          <QuizSelect />
        </div>
      </div>
    </Container>
  );
}
