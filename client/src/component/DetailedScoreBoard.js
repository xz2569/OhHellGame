import { Modal, Table } from "react-bootstrap";
import React from "react";

const DetailedScoreBoard = ({
  show,
  hideDetail,
  playersInfo,
  currentRound,
  getGuessAndMade,
}) => {
  return (
    <Modal show={show} onHide={hideDetail} size="lg">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontFamily: "Palette Mosaic, cursive" }}>
          Score Board
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table
          style={{
            fontSize: "20px",
            fontFamily: "Ubuntu, sans-serif",
            textAlign: "center",
          }}
          bordered
          responsive
          striped
        >
          <thead>
            <tr style={{ borderBottom: "solid 2px black" }}>
              <th style={{ borderRight: "solid 2px black" }}>Round</th>
              {playersInfo.map((playerInfo) => (
                <th colSpan={2} key={playerInfo.username}>
                  {playerInfo.username}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(currentRound).keys()].map((round) => (
              <tr key={round + 1}>
                <td style={{ borderRight: "solid 2px black" }}>{round + 1}</td>
                {playersInfo.map((playerInfo) => (
                  <React.Fragment key={playerInfo.username}>
                    <td>
                      {getGuessAndMade(
                        playerInfo[round + 1].guess,
                        playerInfo[round + 1].made
                      )}
                    </td>
                    <td>{playerInfo[round + 1].score}</td>
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  );
};

export default DetailedScoreBoard;
